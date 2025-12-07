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

    // Validate file type - support all image formats
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
      'image/x-icon'
    ];

    const isValidImage = supportedImageTypes.includes(file.type.toLowerCase()) || 
                        file.type.startsWith('image/') ||
                        /\.(jpg|jpeg|png|gif|webp|avif|heic|heif|svg|bmp|tiff?|ico)$/i.test(file.name);

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'File must be an image (JPG, PNG, GIF, WebP, AVIF, HEIC, etc.)' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Create server client (uses service role key, bypasses RLS)
    const supabase = createServerClient();

    // Check if bucket exists, create if not
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return NextResponse.json(
        { error: `Failed to list buckets: ${listError.message}` },
        { status: 500 }
      );
    }
    
    const bucketExists = buckets?.some(b => b.name === DEFAULT_BUCKET);
    console.log('🔍 Bucket check:', {
      bucketName: DEFAULT_BUCKET,
      exists: bucketExists,
      availableBuckets: buckets?.map(b => b.name) || []
    });
    
    if (!bucketExists) {
      console.log(`📦 Bucket "${DEFAULT_BUCKET}" not found, creating...`);
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(DEFAULT_BUCKET, {
        public: true,
        fileSizeLimit: 10485760 // 10MB - Don't restrict MIME types, we validate on our end
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', {
          message: createError.message,
          error: createError,
          bucketName: DEFAULT_BUCKET,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        });
        return NextResponse.json(
          { 
            error: `Bucket "${DEFAULT_BUCKET}" does not exist and could not be created: ${createError.message}`,
            details: createError
          },
          { status: 500 }
        );
      }
      console.log(`✅ Bucket "${DEFAULT_BUCKET}" created successfully:`, newBucket);
      
      // Verify creation
      const { data: verifyBuckets } = await supabase.storage.listBuckets();
      const verified = verifyBuckets?.some(b => b.name === DEFAULT_BUCKET);
      console.log('🔍 Bucket creation verified:', { verified });
    }

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

    const publicUrl = urlData.publicUrl;

    console.log('✅ File uploaded successfully:', {
      path: data.path,
      url: publicUrl,
      bucket: DEFAULT_BUCKET,
      fileName: file.name
    });

    // Verify URL is accessible
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.warn('⚠️ Public URL may not be accessible:', {
          url: publicUrl,
          status: testResponse.status,
          statusText: testResponse.statusText
        });
      } else {
        console.log('✅ Public URL is accessible');
      }
    } catch (urlError) {
      console.warn('⚠️ Could not verify URL accessibility:', urlError);
    }

    return NextResponse.json({
      success: true,
      path: data.path,
      url: publicUrl,
      fileName: file.name,
      bucket: DEFAULT_BUCKET
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

