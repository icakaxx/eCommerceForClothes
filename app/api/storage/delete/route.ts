import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DEFAULT_BUCKET } from '@/lib/supabaseStorage';

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

    console.log(`🗑️ Deleting file from "${DEFAULT_BUCKET}/${path}"...`);

    // Create server client (uses service role key, bypasses RLS)
    const supabase = createServerClient();

    // Delete file from storage
    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .remove([path]);

    if (error) {
      console.error('❌ Delete error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: error.message, 
          details: error 
        },
        { status: 500 }
      );
    }

    console.log('✅ File deleted successfully:', {
      path: path,
      bucket: DEFAULT_BUCKET,
      deletedFiles: data
    });

    return NextResponse.json({
      success: true,
      path: path,
      bucket: DEFAULT_BUCKET,
      deletedFiles: data
    });

  } catch (error) {
    console.error('❌ Delete failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed' 
      },
      { status: 500 }
    );
  }
}
