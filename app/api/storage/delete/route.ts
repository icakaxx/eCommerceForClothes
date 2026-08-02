import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DEFAULT_BUCKET } from '@/lib/supabaseStorage';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      );
    }


    // Create server client (uses service role key, bypasses RLS)
    const supabase = createServerClient();

    // Delete file from storage
    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .remove([path]);

    if (error) {
      logger.error('Delete error:', error);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }


    return NextResponse.json({
      success: true,
      path: path,
      bucket: DEFAULT_BUCKET,
      deletedFiles: data
    });

  } catch (error) {
    logger.error('Delete failed:', error);
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}
