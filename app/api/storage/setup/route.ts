import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DEFAULT_BUCKET } from '@/lib/supabaseStorage';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const bucketExists = buckets?.some(b => b.name === DEFAULT_BUCKET);

    if (bucketExists) {
      console.log(`✅ Bucket "${DEFAULT_BUCKET}" already exists`);
      return NextResponse.json({
        success: true,
        message: `Bucket "${DEFAULT_BUCKET}" already exists`,
        bucket: DEFAULT_BUCKET
      });
    }

    // Create bucket
    console.log(`📦 Creating bucket "${DEFAULT_BUCKET}"...`);
    console.log('📋 Bucket creation options:', {
      name: DEFAULT_BUCKET,
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760
    });
    
    const { data: bucket, error: createError } = await supabase.storage.createBucket(DEFAULT_BUCKET, {
      public: true, // Make bucket public so images can be accessed
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
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
          error: createError.message,
          details: createError,
          bucketName: DEFAULT_BUCKET
        },
        { status: 500 }
      );
    }

    console.log(`✅ Bucket "${DEFAULT_BUCKET}" created successfully:`, bucket);
    
    // Verify bucket was created
    const { data: verifyBuckets } = await supabase.storage.listBuckets();
    const verified = verifyBuckets?.some(b => b.name === DEFAULT_BUCKET);
    console.log('🔍 Verification:', { verified, allBuckets: verifyBuckets?.map(b => b.name) });

    return NextResponse.json({
      success: true,
      message: `Bucket "${DEFAULT_BUCKET}" created successfully`,
      bucket: DEFAULT_BUCKET
    });

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    );
  }
}

// GET - Check bucket status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const bucketExists = buckets?.some(b => b.name === DEFAULT_BUCKET);

    return NextResponse.json({
      success: true,
      bucketExists,
      bucketName: DEFAULT_BUCKET,
      allBuckets: buckets?.map(b => ({ name: b.name, public: b.public })) || []
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Check failed' },
      { status: 500 }
    );
  }
}

