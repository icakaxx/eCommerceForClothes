import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { DEFAULT_BUCKET } from '@/lib/supabaseStorage';
import { logger } from '@/lib/logger';
import { apiErrorResponse } from '@/lib/api-error';


export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      logger.error('Error listing buckets:', listError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: listError });
    }

    const bucketExists = buckets?.some(b => b.name === DEFAULT_BUCKET);

    if (bucketExists) {
      return NextResponse.json({
        success: true,
        message: `Bucket "${DEFAULT_BUCKET}" already exists`,
        bucket: DEFAULT_BUCKET
      });
    }

    // Create bucket
    
    const { data: bucket, error: createError } = await supabase.storage.createBucket(DEFAULT_BUCKET, {
      public: true, // Make bucket public so images can be accessed
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (createError) {
      logger.error('Error creating bucket', createError);
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: createError });
    }

    
    // Verify bucket was created
    const { data: verifyBuckets } = await supabase.storage.listBuckets();
    const verified = verifyBuckets?.some(b => b.name === DEFAULT_BUCKET);

    return NextResponse.json({
      success: true,
      message: `Bucket "${DEFAULT_BUCKET}" created successfully`,
      bucket: DEFAULT_BUCKET
    });

  } catch (error) {
    logger.error('Setup failed:', error);
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}

// GET - Check bucket status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error: error });
    }

    const bucketExists = buckets?.some(b => b.name === DEFAULT_BUCKET);

    return NextResponse.json({
      success: true,
      bucketExists,
      bucketName: DEFAULT_BUCKET,
      allBuckets: buckets?.map(b => ({ name: b.name, public: b.public })) || []
    });

  } catch (error) {
    return apiErrorResponse({ code: 'INTERNAL_ERROR', status: 500, error });
  }
}

