import { supabase } from './supabase';
import { logger } from './logger';

export const DEFAULT_BUCKET = 'products';

export function getStorageUrl(bucketName: string, filePath: string): string {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Test connection to Supabase Storage bucket
 */
export async function testStorageConnection(bucketName: string = DEFAULT_BUCKET) {
  try {
    logger.debug(`Testing Storage connection to bucket: "${bucketName}"`);

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      logger.error('Storage connection error');
      return {
        success: false,
        error: listError,
        message: 'Failed to list buckets',
      };
    }

    const bucketExists = buckets?.some((b) => b.name === bucketName);

    if (!bucketExists) {
      return {
        success: false,
        message: `Bucket "${bucketName}" does not exist`,
        availableBuckets: buckets?.map((b) => b.name) || [],
      };
    }

    const { data: files, error: filesError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 10 });

    if (filesError) {
      logger.error('Storage file list error');
      return {
        success: false,
        error: filesError,
        message: 'Failed to list files in bucket',
      };
    }

    return {
      success: true,
      bucketName,
      fileCount: files?.length || 0,
      availableBuckets: buckets?.map((b) => b.name) || [],
    };
  } catch (error) {
    logger.error('Storage connection test failed', error);
    return {
      success: false,
      error,
      message: 'Unexpected error testing storage connection',
    };
  }
}

/**
 * Upload a file to Supabase Storage.
 * @param bucketName - Storage bucket name
 * @param filePath - Path within the bucket
 * @param file - File or Blob to upload
 */
export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File | Blob
): Promise<{ success: boolean; path?: string; url?: string; error?: unknown }> {
  try {
    logger.debug(`Uploading file to "${bucketName}/${filePath}"`);

    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      logger.error('File upload failed');
      return { success: false, error };
    }

    const url = getStorageUrl(bucketName, data.path);

    return {
      success: true,
      path: data.path,
      url,
    };
  } catch (error) {
    logger.error('File upload failed', error);
    return { success: false, error };
  }
}

export async function deleteFile(
  filePath: string,
  bucketName: string = DEFAULT_BUCKET
): Promise<{ success: boolean; error?: unknown }> {
  try {
    logger.debug(`Deleting file "${bucketName}/${filePath}"`);

    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error) {
      logger.error('File delete failed');
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    logger.error('File delete failed', error);
    return { success: false, error };
  }
}

/**
 * List files in a bucket folder. Returns Supabase-style { data, error }.
 */
export async function listFiles(
  bucketName: string = DEFAULT_BUCKET,
  folder: string = ''
) {
  return supabase.storage.from(bucketName).list(folder, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  });
}
