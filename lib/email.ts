import { sendEmail, getContactEmail, getAdminNotificationEmails, isEmailConfigured } from '@/lib/mail';
import { translations, Language } from '@/lib/translations';
import { getShippingEstimateMessage } from '@/lib/order-shipping-estimate';

interface OrderDetails {
  orderId: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    telephone: string;
    country: string;
    city: string;
  };
  delivery: {
    type: string;
    notes: string;
    street?: string;
    streetNumber?: string;
    entrance?: string;
    floor?: string;
    apartment?: string;
    econtOfficeId?: string;
  };
  items: Array<{
    id: string | number;
    name: string;
    brand: string;
    model: string;
    color: string;
    size?: string;
    type?: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }>;
  totals: {
    subtotal: number;
    delivery: number;
    total: number;
  };
  orderDate: string;
}

function getDeliveryTypeLabel(type: string, language: Language): string {
  const t = translations[language];
  const typeLower = type.toLowerCase();
  if (typeLower === 'office') {
    return t.deliveryOffice;
  } else if (typeLower === 'address') {
    return t.deliveryAddress;
  } else if (typeLower === 'econtomat') {
    return t.deliveryEcontomat || type;
  }
  return type;
}

export async function sendCustomerOrderEmail(orderDetails: OrderDetails, language: Language = 'en'): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('Skipping customer order email: email not configured');
    return;
  }

  const customerEmail = orderDetails.customer.email?.trim() || '';
  const isValidCustomerEmail =
    customerEmail.length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) &&
    !customerEmail.endsWith('@checkout.local');

  if (!isValidCustomerEmail) {
    console.log('Skipping customer order email: no valid customer email provided');
    return;
  }

  const t = translations[language];
  const contactEmail = getContactEmail();
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${orderDetails.orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; color: #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t.emailThankYouForOrder}</h1>
          <p>${t.orderNumber} #${orderDetails.orderId}</p>
        </div>

        <div class="content">
          <p>${language === 'bg' ? 'Уважаеми' : 'Dear'} ${orderDetails.customer.firstName} ${orderDetails.customer.lastName},</p>

          <p>${t.emailPendingIntro}</p>
          <p><strong>${t.emailPendingAwaitingConfirm}</strong></p>

          <div class="order-details">
            <h3>${t.emailOrderSummary}</h3>

            <div style="margin: 20px 0;">
              ${orderDetails.items.map(item => `
                <div class="item">
                  <div>
                    <strong>${item.brand} ${item.model}</strong><br>
                    <small>${item.color}${item.size ? ` • ${item.size}` : ''}${item.type ? ` • ${item.type}` : ''}</small>
                  </div>
                  <div style="text-align: right;">
                    <div>${item.quantity} × €${item.price.toFixed(2)}</div>
                    <div style="font-weight: bold;">€${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="item">
              <strong>${t.subtotal}:</strong>
              <span>€${orderDetails.totals.subtotal.toFixed(2)}</span>
            </div>

            <div class="item">
              <strong>${t.delivery} (${getDeliveryTypeLabel(orderDetails.delivery.type, language)}):</strong>
              <span>€${orderDetails.totals.delivery.toFixed(2)}</span>
            </div>

            <div class="item total">
              <strong>${t.total}:</strong>
              <span>€${orderDetails.totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div style="margin: 20px 0;">
            <h4>${t.emailDeliveryInformation}</h4>
            <p><strong>${t.emailMethod}</strong> ${getDeliveryTypeLabel(orderDetails.delivery.type, language)}</p>
            ${orderDetails.delivery.type === 'address' && (orderDetails.delivery.street || orderDetails.delivery.streetNumber) ? `
              <p><strong>${language === 'bg' ? 'Адрес' : 'Address'}:</strong> 
                ${orderDetails.delivery.street || ''} ${orderDetails.delivery.streetNumber || ''}
                ${orderDetails.delivery.entrance ? `, ${language === 'bg' ? 'вх.' : 'Entrance'} ${orderDetails.delivery.entrance}` : ''}
                ${orderDetails.delivery.floor ? `, ${language === 'bg' ? 'ет.' : 'Floor'} ${orderDetails.delivery.floor}` : ''}
                ${orderDetails.delivery.apartment ? `, ${language === 'bg' ? 'ап.' : 'Apt'} ${orderDetails.delivery.apartment}` : ''}
                <br>
                ${orderDetails.customer.city}, ${orderDetails.customer.country}
              </p>
            ` : orderDetails.delivery.type === 'office' && orderDetails.delivery.econtOfficeId ? `
              <p><strong>${t.econtOffice}:</strong> ${orderDetails.delivery.econtOfficeId}</p>
              <p><strong>${t.emailAddress}</strong> ${orderDetails.customer.city}, ${orderDetails.customer.country}</p>
            ` : `
              <p><strong>${t.emailAddress}</strong> ${orderDetails.customer.city}, ${orderDetails.customer.country}</p>
            `}
            ${orderDetails.delivery.notes ? `<p><strong>${t.emailNotes}</strong> ${orderDetails.delivery.notes}</p>` : ''}
          </div>

          <div style="margin: 20px 0;">
            <h4>${t.emailContactInformation}</h4>
            <p><strong>${t.email}:</strong> ${orderDetails.customer.email}</p>
            <p><strong>${t.emailPhone}</strong> ${orderDetails.customer.telephone}</p>
          </div>

          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>${t.emailWhatHappensNext}</strong></p>
            <ul>
              <li>${t.emailWillReceiveConfirmation}</li>
              <li>${t.emailOrderProcessed}</li>
              <li>${t.emailPendingAfterConfirm}</li>
            </ul>
          </div>

          <div class="footer">
            <p>${t.emailContactUs} ${contactEmail}</p>
            <p>${t.emailOrderDate} ${new Date(orderDetails.orderDate).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US')}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: customerEmail,
    subject: `${t.emailOrderReceivedSubject} - #${orderDetails.orderId}`,
    html: customerEmailHtml,
    replyTo: contactEmail,
  });

  console.log('Customer order email sent successfully to', customerEmail);
}

export async function sendAdminOrderEmail(orderDetails: OrderDetails, language: Language = 'en'): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('Skipping admin order email: email not configured');
    return;
  }

  const t = translations[language];
  const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order - ${orderDetails.orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .customer-info { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .total { font-weight: bold; font-size: 18px; color: #ee5a24; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t.emailNewOrderReceived}</h1>
          <p>${t.orderNumber} #${orderDetails.orderId}</p>
        </div>

        <div class="content">
          <p>${t.emailAdminAwaitingConfirmation}</p>

          <div class="customer-info">
            <h3>${t.emailCustomerInformation}</h3>
            <p><strong>${t.emailName}</strong> ${orderDetails.customer.firstName} ${orderDetails.customer.lastName}</p>
            <p><strong>${t.email}:</strong> ${orderDetails.customer.email}</p>
            <p><strong>${t.emailPhone}</strong> ${orderDetails.customer.telephone}</p>
            <p><strong>${t.emailAddress}</strong> ${orderDetails.customer.city}, ${orderDetails.customer.country}</p>
          </div>

          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>${t.emailDeliveryInformation}</h3>
            <p><strong>${t.emailMethod}</strong> ${getDeliveryTypeLabel(orderDetails.delivery.type, language)}</p>
            ${orderDetails.delivery.type === 'address' && (orderDetails.delivery.street || orderDetails.delivery.streetNumber) ? `
              <p><strong>${language === 'bg' ? 'Адрес' : 'Address'}:</strong> 
                ${orderDetails.delivery.street || ''} ${orderDetails.delivery.streetNumber || ''}
                ${orderDetails.delivery.entrance ? `, ${language === 'bg' ? 'вх.' : 'Entrance'} ${orderDetails.delivery.entrance}` : ''}
                ${orderDetails.delivery.floor ? `, ${language === 'bg' ? 'ет.' : 'Floor'} ${orderDetails.delivery.floor}` : ''}
                ${orderDetails.delivery.apartment ? `, ${language === 'bg' ? 'ап.' : 'Apt'} ${orderDetails.delivery.apartment}` : ''}
                <br>
                ${orderDetails.customer.city}, ${orderDetails.customer.country}
              </p>
            ` : orderDetails.delivery.type === 'office' && orderDetails.delivery.econtOfficeId ? `
              <p><strong>${t.econtOffice}:</strong> ${orderDetails.delivery.econtOfficeId}</p>
              <p><strong>${t.emailAddress}</strong> ${orderDetails.customer.city}, ${orderDetails.customer.country}</p>
            ` : `
              <p><strong>${t.emailAddress}</strong> ${orderDetails.customer.city}, ${orderDetails.customer.country}</p>
            `}
            ${orderDetails.delivery.notes ? `<p><strong>${t.emailNotes}</strong> ${orderDetails.delivery.notes}</p>` : ''}
          </div>

          <div class="order-details">
            <h3>${t.emailOrderDetails}</h3>

            <div style="margin: 20px 0;">
              ${orderDetails.items.map(item => `
                <div class="item">
                  <div>
                    <strong>${item.brand} ${item.model}</strong><br>
                    <small>${item.color}${item.size ? ` • ${item.size}` : ''}${item.type ? ` • ${item.type}` : ''}</small><br>
                    <small>SKU: ${item.id}</small>
                  </div>
                  <div style="text-align: right;">
                    <div>${item.quantity} × €${item.price.toFixed(2)}</div>
                    <div style="font-weight: bold;">€${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="item">
              <strong>${t.subtotal}:</strong>
              <span>€${orderDetails.totals.subtotal.toFixed(2)}</span>
            </div>

            <div class="item">
              <strong>${t.delivery} (${getDeliveryTypeLabel(orderDetails.delivery.type, language)}):</strong>
              <span>€${orderDetails.totals.delivery.toFixed(2)}</span>
            </div>

            <div class="item total">
              <strong>${t.total}:</strong>
              <span>€${orderDetails.totals.total.toFixed(2)}</span>
            </div>
          </div>

          ${orderDetails.delivery.notes ? `
          <div style="margin: 20px 0;">
            <h4>${t.emailOrderNotes}</h4>
            <p style="background: #f8f9fa; padding: 10px; border-radius: 4px;">${orderDetails.delivery.notes}</p>
          </div>
          ` : ''}

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>${t.emailActionRequired}</strong></p>
            <ul>
              <li>${t.emailProcessOrder}</li>
              <li>${t.emailUpdateInventory}</li>
              <li>${t.emailSendTracking}</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>${t.emailOrderDate} ${new Date(orderDetails.orderDate).toLocaleString(language === 'bg' ? 'bg-BG' : 'en-US')}</p>
            <p>${t.emailAutomatedNotification}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: getAdminNotificationEmails(),
    subject: `${t.emailNewOrderReceived} - #${orderDetails.orderId}`,
    html: adminEmailHtml,
  });

  console.log('Admin order email sent successfully');
}

export async function sendOrderStatusEmail(
  orderDetails: OrderDetails,
  status: 'confirmed' | 'shipped' | 'dispatched' | 'delivered' | 'cancelled',
  language: Language = 'en'
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('Skipping order status email: email not configured');
    return;
  }

  const t = translations[language];
  const contactEmail = getContactEmail();
  const emailStatus = status === 'shipped' ? 'dispatched' : status;
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    confirmed: {
      title: t.emailOrderConfirmed,
      message: t.emailOrderConfirmedMessage,
      color: '#667eea'
    },
    shipped: {
      title: t.emailOrderDispatched,
      message: t.emailOrderDispatchedMessage,
      color: '#48bb78'
    },
    dispatched: {
      title: t.emailOrderDispatched,
      message: t.emailOrderDispatchedMessage,
      color: '#48bb78'
    },
    delivered: {
      title: t.emailOrderDelivered,
      message: t.emailOrderDeliveredMessage,
      color: '#38a169'
    },
    cancelled: {
      title: t.emailOrderCancelled,
      message: t.emailOrderCancelledMessage,
      color: '#f56565'
    }
  };

  const statusInfo = statusMessages[emailStatus] || statusMessages.confirmed;
  const shippingEstimateHtml =
    emailStatus === 'confirmed'
      ? `
          <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
            <p><strong>${t.emailShippingScheduleTitle}</strong></p>
            <p>${getShippingEstimateMessage(orderDetails.orderDate, language)}</p>
          </div>
        `
      : '';

  const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order ${statusInfo.title} - ${orderDetails.orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
        .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; color: ${statusInfo.color}; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .status-badge { display: inline-block; padding: 8px 16px; background: ${statusInfo.color}; color: white; border-radius: 20px; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusInfo.title}</h1>
          <p>Order #${orderDetails.orderId}</p>
        </div>

        <div class="content">
          <p>${language === 'bg' ? 'Уважаеми' : 'Dear'} ${orderDetails.customer.firstName} ${orderDetails.customer.lastName},</p>

          <p>${statusInfo.message}</p>

          <div class="order-details">
            <h3>${t.emailOrderSummary}</h3>
            <div class="status-badge">${status === 'confirmed' ? t.confirmed : status === 'shipped' || status === 'dispatched' ? t.shipped : status === 'delivered' ? t.delivered : t.cancelled}</div>

            <div style="margin: 20px 0;">
              ${orderDetails.items.map(item => `
                <div class="item">
                  <div>
                    <strong>${item.brand} ${item.model}</strong><br>
                    <small>${item.color}${item.size ? ` • ${item.size}` : ''}${item.type ? ` • ${item.type}` : ''}</small>
                  </div>
                  <div style="text-align: right;">
                    <div>${item.quantity} × €${item.price.toFixed(2)}</div>
                    <div style="font-weight: bold;">€${(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="item total">
                        <strong>${t.total}:</strong>
                        <span>€${orderDetails.totals.total.toFixed(2)}</span>
                      </div>
                    </div>

                    ${shippingEstimateHtml}

                    ${(emailStatus === 'dispatched' || status === 'shipped') ? `
          <div style="background: #e6fffa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
            <p><strong>${t.emailTrackingInformation}</strong></p>
            <p>${t.emailOrderOnWay} ${t.emailTrackingDetailsSoon}</p>
          </div>
          ` : ''}

          ${emailStatus === 'delivered' ? `
          <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
            <p><strong>${t.emailHopeLovePurchase}</strong></p>
            <p>${t.emailContactSupport}</p>
          </div>
          ` : ''}

          ${emailStatus === 'cancelled' ? `
          <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
            <p><strong>${t.emailNeedHelp}</strong></p>
            <p>${t.emailQuestionsAboutCancellation}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>${t.emailContactUs} ${contactEmail}</p>
            <p>${t.emailOrderDate} ${new Date(orderDetails.orderDate).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US')}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: orderDetails.customer.email,
    subject: `Order ${statusInfo.title} - #${orderDetails.orderId}`,
    html: customerEmailHtml,
    replyTo: contactEmail,
  });

  console.log(`Order ${status} email sent successfully to ${orderDetails.customer.email}`);
}
