import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DEFAULT_BUCKET } from '@/lib/supabaseStorage';
import { compressImageForUpload } from '@/lib/compress-image';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'images';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const supportedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/heic',
      'image/heif',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
      'image/x-icon',
    ];

    const isValidImage =
      supportedImageTypes.includes(file.type.toLowerCase()) ||
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp|avif|heic|heif|svg|bmp|tiff?|ico)$/i.test(file.name);

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'File must be an image (JPG, PNG, GIF, WebP, AVIF, HEIC, etc.)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    const compressed = await compressImageForUpload(originalBuffer, file.type);

    const uploadBuffer = compressed?.buffer ?? originalBuffer;
    const contentType = compressed?.contentType ?? file.type;
    const originalExt = file.name.split('.').pop() || 'jpg';
    const fileExt = compressed?.extension ?? originalExt;

    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const supabase = createServerClient();

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return NextResponse.json(
        { error: `Failed to list buckets: ${listError.message}` },
        { status: 500 }
      );
    }

    const bucketExists = buckets?.some((b) => b.name === DEFAULT_BUCKET);
    console.log('🔍 Bucket check:', {
      bucketName: DEFAULT_BUCKET,
      exists: bucketExists,
      availableBuckets: buckets?.map((b) => b.name) || [],
    });

    if (!bucketExists) {
      console.log(`📦 Bucket "${DEFAULT_BUCKET}" not found, creating...`);
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(
        DEFAULT_BUCKET,
        {
          public: true,
          fileSizeLimit: 10485760,
        }
      );

      if (createError) {
        console.error('❌ Error creating bucket:', {
          message: createError.message,
          error: createError,
          bucketName: DEFAULT_BUCKET,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        });
        return NextResponse.json(
          {
            error: `Bucket "${DEFAULT_BUCKET}" does not exist and could not be created: ${createError.message}`,
            details: createError,
          },
          { status: 500 }
        );
      }
      console.log(`✅ Bucket "${DEFAULT_BUCKET}" created successfully:`, newBucket);
    }

    if (compressed) {
      const savedPercent = Math.round(
        (1 - compressed.compressedBytes / compressed.originalBytes) * 100
      );
      console.log(
        `🗜️ Compressed image: ${(compressed.originalBytes / 1024).toFixed(0)}KB → ${(compressed.compressedBytes / 1024).toFixed(0)}KB (−${savedPercent}%)`
      );
    } else {
      console.log('📤 Uploading original image (compression skipped or not beneficial)');
    }

    console.log(`📤 Uploading file to "${DEFAULT_BUCKET}/${fileName}"...`);

    const { data, error } = await supabase.storage
      .from(DEFAULT_BUCKET)
      .upload(fileName, uploadBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(DEFAULT_BUCKET)
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    console.log('✅ File uploaded successfully:', {
      path: data.path,
      url: publicUrl,
      bucket: DEFAULT_BUCKET,
      fileName: file.name,
      compressed: !!compressed,
    });

    return NextResponse.json({
      success: true,
      path: data.path,
      url: publicUrl,
      fileName: file.name,
      bucket: DEFAULT_BUCKET,
      compressed: !!compressed,
      ...(compressed
        ? {
            originalBytes: compressed.originalBytes,
            compressedBytes: compressed.compressedBytes,
          }
        : {}),
    });
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
