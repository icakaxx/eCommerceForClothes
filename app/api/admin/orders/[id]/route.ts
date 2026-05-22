export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderStatusEmail } from '@/lib/email';
import {
  decreaseStockForOrderItems,
  increaseStockForOrderItems,
  isReturnedStatus,
  isValidTrackingStatus,
  normalizeOrderStatus,
  orderItemsPayloadEqual,
  reconcileOrderItemsStock,
  TRACKING_ORDER_STATUSES,
} from '@/lib/admin-order-stock';
import { splitCustomerName } from '@/lib/admin-order-form';
import { deleteOrderByOrderId } from '@/lib/admin-delete-order';

function mapAdminStatusToEmail(
  s: string
): 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | null {
  const n = normalizeOrderStatus(s);
  if (n === 'confirmed' || n === 'prepared') return 'confirmed';
  if (n === 'shipped' || n === 'sent') return 'shipped';
  if (n === 'delivered' || n === 'picked_up') return 'delivered';
  if (n === 'cancelled') return 'cancelled';
  return null;
}

async function insertStatusHistory(params: {
  orderId: string;
  oldStatus: string | null;
  newStatus: string;
  note?: string | null;
  changedBy?: string | null;
}) {
  const { error } = await supabaseAdmin.from('order_status_history').insert({
    order_id: params.orderId,
    old_status: params.oldStatus,
    new_status: params.newStatus,
    note: params.note ?? null,
    changed_by: params.changedBy ?? null,
  });
  if (error && error.code !== '42P01') {
    console.warn('order_status_history insert skipped:', error.message);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, note, changedBy } = body as {
      status?: string;
      note?: string | null;
      changedBy?: string | null;
    };

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const normalizedStatus = normalizeOrderStatus(status);
    if (!isValidTrackingStatus(normalizedStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${TRACKING_ORDER_STATUSES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        customers (
          customerid,
          firstname,
          lastname,
          email,
          telephone,
          country,
          city
        ),
        order_items (
          orderitemid,
          quantity,
          price,
          productid,
          productvariantid
        )
      `
      )
      .eq('orderid', id)
      .single();

    if (fetchError || !existingOrder) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const oldStatus = normalizeOrderStatus((existingOrder as { status?: string }).status || '');
    let returnStockApplied = Boolean((existingOrder as { return_stock_applied?: boolean }).return_stock_applied);
    const items = (existingOrder as { order_items?: Array<{ productvariantid?: string; quantity?: number }> })
      .order_items || [];

    const willCreditReturn =
      isReturnedStatus(normalizedStatus) && !isReturnedStatus(oldStatus) && !returnStockApplied;
    const willDebitAfterReturn =
      !isReturnedStatus(normalizedStatus) && isReturnedStatus(oldStatus) && returnStockApplied;

    const nextReturnFlag =
      willCreditReturn ? true : willDebitAfterReturn ? false : returnStockApplied;

    const updatePayload: Record<string, unknown> = {
      status: normalizedStatus,
      updatedat: new Date().toISOString(),
      return_stock_applied: nextReturnFlag,
    };

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('orderid', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
    }

    if (willCreditReturn) {
      const res = await increaseStockForOrderItems({
        orderId: id,
        items,
        movementType: 'order_returned',
        created_by: changedBy || null,
      });
      if (!res.ok) {
        await supabaseAdmin
          .from('orders')
          .update({
            status: oldStatus,
            updatedat: new Date().toISOString(),
            return_stock_applied: returnStockApplied,
          })
          .eq('orderid', id);
        return NextResponse.json(
          { success: false, error: res.error || 'Неуспешно връщане на наличност' },
          { status: 500 }
        );
      }
    } else if (willDebitAfterReturn) {
      const res = await decreaseStockForOrderItems({
        orderId: id,
        items,
        movementType: 'order_unreturned',
        created_by: changedBy || null,
      });
      if (!res.ok) {
        await supabaseAdmin
          .from('orders')
          .update({
            status: oldStatus,
            updatedat: new Date().toISOString(),
            return_stock_applied: returnStockApplied,
          })
          .eq('orderid', id);
        return NextResponse.json(
          { success: false, error: res.error || 'Неуспешно коригиране на наличност' },
          { status: 500 }
        );
      }
    }

    await insertStatusHistory({
      orderId: id,
      oldStatus: oldStatus || null,
      newStatus: normalizedStatus,
      note: note ?? null,
      changedBy: changedBy ?? null,
    });

    const emailStatus = mapAdminStatusToEmail(normalizedStatus);
    if (
      emailStatus &&
      oldStatus !== normalizedStatus &&
      normalizedStatus !== 'pending' &&
      normalizedStatus !== 'new'
    ) {
      try {
        const customer = Array.isArray(existingOrder.customers)
          ? existingOrder.customers[0]
          : existingOrder.customers;

        if (customer) {
          const itemsWithDetails = await buildItemsForEmail(existingOrder);

          const { data: storeSettings } = await supabaseAdmin
            .from('store_settings')
            .select('language')
            .limit(1)
            .single();

          const language =
            storeSettings?.language === 'bg' || storeSettings?.language === 'en'
              ? storeSettings.language
              : 'en';

          const orderDetails = buildOrderDetailsForEmail(id, existingOrder, customer, itemsWithDetails);

          sendOrderStatusEmail(orderDetails, emailStatus, language).catch((emailError) => {
            console.error('Failed to send status update email:', emailError);
          });
        }
      } catch (emailError) {
        console.error('Error preparing email notification:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function buildItemsForEmail(existingOrder: any) {
  return Promise.all(
    (existingOrder.order_items || []).map(async (orderItem: any) => {
      let productInfo = {
        name: 'Unknown Product',
        brand: '',
        model: '',
        color: '',
        size: '',
        type: undefined as string | undefined,
        imageUrl: '/placeholder-image.jpg',
      };

      try {
        if (orderItem.productvariantid) {
          const { data: variant } = await supabaseAdmin
            .from('product_variants')
            .select(
              `
              sku,
              productid,
              price,
              products!inner (
                name
              ),
              product_variant_property_values (
                value,
                properties!inner (
                  name
                )
              )
            `
            )
            .eq('productvariantid', orderItem.productvariantid)
            .single();

          if (variant) {
            const productData = variant.products;
            productInfo.name = Array.isArray(productData)
              ? productData[0]?.name || variant.sku || 'Unknown Product'
              : (productData as any)?.name || variant.sku || 'Unknown Product';

            if (variant.product_variant_property_values && Array.isArray(variant.product_variant_property_values)) {
              variant.product_variant_property_values.forEach((pvv: any) => {
                const propName = pvv.properties?.name?.toLowerCase() || '';
                const value = pvv.value || '';

                if (propName.includes('color') || propName.includes('colour') || propName.includes('цвят')) {
                  productInfo.color = value;
                } else if (propName.includes('size') || propName.includes('размер')) {
                  productInfo.size = value;
                } else if (propName.includes('brand') || propName.includes('марка')) {
                  productInfo.brand = value;
                } else if (propName.includes('model') || propName.includes('модел')) {
                  productInfo.model = value;
                } else if (propName.includes('type') || propName.includes('тип')) {
                  productInfo.type = value;
                }
              });
            }

            if (!productInfo.brand && !productInfo.model) {
              const nameParts = productInfo.name.split(' ');
              productInfo.brand = nameParts[0] || '';
              productInfo.model = nameParts.slice(1).join(' ') || productInfo.name;
            }
          }
        } else if (orderItem.productid) {
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('name')
            .eq('productid', orderItem.productid)
            .single();

          if (product) {
            productInfo.name = product.name || 'Unknown Product';
            const nameParts = productInfo.name.split(' ');
            productInfo.brand = nameParts[0] || '';
            productInfo.model = nameParts.slice(1).join(' ') || productInfo.name;
          }
        }
      } catch (err) {
        console.error('Error fetching product details for email:', err);
      }

      return {
        id: orderItem.productvariantid || orderItem.productid || '',
        name: productInfo.name,
        brand: productInfo.brand || 'Unknown',
        model: productInfo.model || productInfo.name,
        color: productInfo.color || '',
        size: productInfo.size || '',
        type: productInfo.type,
        price: orderItem.price || 0,
        quantity: orderItem.quantity,
        imageUrl: productInfo.imageUrl,
      };
    })
  );
}

function buildOrderDetailsForEmail(
  id: string,
  existingOrder: any,
  customer: any,
  itemsWithDetails: any[]
) {
  return {
    orderId: id,
    customer: {
      firstName: customer.firstname || '',
      lastName: customer.lastname || '',
      email: customer.email || '',
      telephone: customer.telephone || '',
      country: customer.country || '',
      city: customer.city || '',
    },
    delivery: {
      type: existingOrder.deliverytype || 'office',
      notes: existingOrder.deliverynotes || '',
      street: existingOrder.deliverystreet || undefined,
      streetNumber: existingOrder.deliverystreetnumber || undefined,
      entrance: existingOrder.deliveryentrance || undefined,
      floor: existingOrder.deliveryfloor || undefined,
      apartment: existingOrder.deliveryapartment || undefined,
      econtOfficeId: existingOrder.econtoffice || undefined,
    },
    items: itemsWithDetails,
    totals: {
      subtotal: existingOrder.subtotal || 0,
      delivery: existingOrder.deliverycost || 0,
      total: existingOrder.total || 0,
    },
    orderDate: existingOrder.createdat || new Date().toISOString(),
  };
}

interface PatchAdminOrderBody {
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    city: string;
    region?: string;
    country?: string;
    econtOfficeId?: string;
    customerNote?: string;
  };
  internalNote?: string;
  deliveryType?: string;
  deliveryNotes?: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  items: Array<{
    productVariantId: string;
    quantity: number;
    unitPrice: number;
  }>;
  changedBy?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchAdminOrderBody;

    if (!body.customer?.fullName || !body.customer?.phone || !body.customer?.city) {
      return NextResponse.json(
        { success: false, error: 'Липсват задължителни полета за клиент (име, телефон, град).' },
        { status: 400 }
      );
    }
    if (!body.items?.length) {
      return NextResponse.json({ success: false, error: 'Добави поне един артикул.' }, { status: 400 });
    }

    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        order_items (
          orderitemid,
          quantity,
          price,
          productid,
          productvariantid
        )
      `
      )
      .eq('orderid', id)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const returnStockApplied = Boolean(
      (existingOrder as { return_stock_applied?: boolean }).return_stock_applied
    );
    const customerId = (existingOrder as { customerid?: string }).customerid;
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'Order has no customer' }, { status: 400 });
    }

    const oldItems = ((existingOrder as { order_items?: Array<{ productvariantid?: string; quantity?: number }> })
      .order_items || []) as Array<{ productvariantid?: string; quantity?: number }>;

    const newItemsPayload = body.items.map((line) => ({
      productvariantid: line.productVariantId,
      quantity: line.quantity,
    }));

    if (returnStockApplied && !orderItemsPayloadEqual(oldItems, newItemsPayload)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Поръчката е върната — артикулите не могат да се променят. Редактирай само клиент, доставка и бележки.',
        },
        { status: 400 }
      );
    }

    const { first, last } = splitCustomerName(body.customer.fullName);
    const phone = body.customer.phone.trim();
    const emailInput = body.customer.email?.trim();

    const { error: customerErr } = await supabaseAdmin
      .from('customers')
      .update({
        firstname: first,
        lastname: last,
        telephone: phone || null,
        city: body.customer.city.trim(),
        country: body.customer.country?.trim() || 'Bulgaria',
        ...(emailInput ? { email: emailInput } : {}),
        updatedat: new Date().toISOString(),
      })
      .eq('customerid', customerId);

    if (customerErr) {
      return NextResponse.json(
        { success: false, error: customerErr.message || 'Failed to update customer' },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    const deliveryType =
      body.deliveryType?.trim() ||
      (existingOrder as { deliverytype?: string }).deliverytype ||
      'office';

    const { error: orderErr } = await supabaseAdmin
      .from('orders')
      .update({
        deliverytype: deliveryType,
        deliverynotes: body.deliveryNotes?.trim() || null,
        econtoffice: body.customer.econtOfficeId?.trim() || null,
        delivery_region: body.customer.region?.trim() || null,
        customer_order_note: body.customer.customerNote?.trim() || null,
        internal_note: body.internalNote?.trim() || null,
        subtotal: body.subtotal,
        deliverycost: body.deliveryCost,
        total: body.total,
        updatedat: now,
      })
      .eq('orderid', id);

    if (orderErr) {
      return NextResponse.json(
        { success: false, error: orderErr.message || 'Failed to update order' },
        { status: 500 }
      );
    }

    if (!returnStockApplied) {
      const stockRes = await reconcileOrderItemsStock({
        orderId: id,
        oldItems,
        newItems: newItemsPayload,
        created_by: body.changedBy || null,
      });
      if (!stockRes.ok) {
        return NextResponse.json(
          { success: false, error: stockRes.error || 'Грешка при коригиране на наличност' },
          { status: 500 }
        );
      }
    }

    const rows = await Promise.all(
      body.items.map(async (line) => {
        const { data: variant } = await supabaseAdmin
          .from('product_variants')
          .select('productid, price')
          .eq('productvariantid', line.productVariantId)
          .single();
        const price = line.unitPrice ?? variant?.price ?? 0;
        return {
          orderid: id,
          productid: variant?.productid ?? null,
          productvariantid: line.productVariantId,
          quantity: line.quantity,
          price,
          createdat: now,
        };
      })
    );

    const { error: delItemsErr } = await supabaseAdmin.from('order_items').delete().eq('orderid', id);
    if (delItemsErr) {
      return NextResponse.json(
        { success: false, error: delItemsErr.message || 'Failed to replace order items' },
        { status: 500 }
      );
    }

    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(rows);
    if (itemsErr) {
      return NextResponse.json(
        { success: false, error: itemsErr.message || 'Failed to save order items' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orderId: id });
  } catch (e) {
    console.error('PATCH order:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Order id required' }, { status: 400 });
    }

    const result = await deleteOrderByOrderId(id);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Delete failed' },
        { status: result.error === 'Order not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE order:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
