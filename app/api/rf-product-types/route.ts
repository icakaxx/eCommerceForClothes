import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET - Fetch all RF product types (main categories)
export async function GET() {
  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('rfproducttype')
      .select('*')
      .order('rfproducttypeid', { ascending: true });

    if (error) {
      console.error('Error fetching RF product types:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rfProductTypes: data
    });

  } catch (error) {
    console.error('Failed to fetch RF product types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






