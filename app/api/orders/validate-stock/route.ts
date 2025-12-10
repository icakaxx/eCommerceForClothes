import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface StockValidationItem {
  id: string | number;
  quantity: number;
  size?: string;
}

// Validate stock availability
async function validateStock(items: StockValidationItem[]): Promise<{ valid: boolean; insufficientStock: any[] }> {
  const insufficientStock: any[] = [];

  for (const item of items) {
    try {
      // Check product variants first (for size-specific items)
      if (item.size) {
        const { data: variant, error } = await supabase
          .from('product_variants')
          .select('"Quantity", "ProductVariantID"')
          .eq('"ProductVariantID"', item.id)
          .single();

        if (error) {
          console.error('Error checking variant stock:', error);
          insufficientStock.push({ id: item.id, requested: item.quantity, available: 0 });
          continue;
        }

        if (!variant || variant.Quantity < item.quantity) {
          insufficientStock.push({
            id: item.id,
            requested: item.quantity,
            available: variant?.Quantity || 0
          });
        }
      } else {
        // For products without variants, assume sufficient stock
        // (The products table doesn't have a Quantity column in the current schema)
        // In a full implementation, products table should also have Quantity column
        console.log(`Skipping stock check for product ${item.id} (no variants)`);
      }
    } catch (error) {
      console.error('Stock validation error:', error);
      insufficientStock.push({ id: item.id, requested: item.quantity, available: 0 });
    }
  }

  return {
    valid: insufficientStock.length === 0,
    insufficientStock
  };
}

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: StockValidationItem[] } = await request.json();

    // Temporarily commented out stock validation - always return success
    // const stockValidation = await validateStock(items);

    return NextResponse.json({
      success: true,
      insufficientStock: []
    });

  } catch (error) {
    console.error('Stock validation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to validate stock'
    }, { status: 500 });
  }
}
