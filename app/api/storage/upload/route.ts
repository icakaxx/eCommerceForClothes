import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DEFAULT_BUCKET } from '@/lib/supabaseStorage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'images';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Create server client (uses service role key, bypasses RLS)
    const supabase = createServerClient();

    console.log(`📤 Uploading file to "${DEFAULT_BUCKET}/${fileName}"...`);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(DEFAULT_BUCKET)
      .getPublicUrl(data.path);

    console.log('✅ File uploaded successfully:', {
      path: data.path,
      url: urlData.publicUrl
    });

    return NextResponse.json({
      success: true,
      path: data.path,
      url: urlData.publicUrl,
      fileName: file.name
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

