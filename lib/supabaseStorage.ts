import { supabase } from './supabase';

// Default bucket name - change this to match your bucket name
// Note: Supabase Storage bucket names should be lowercase
const DEFAULT_BUCKET = 'products';

/**
 * Test connection to Supabase Storage bucket
 */
export async function testStorageConnection(bucketName: string = DEFAULT_BUCKET) {
  try {
    console.log(`🔌 Testing Storage connection to bucket: "${bucketName}"...`);
    
    // Check if bucket exists and is accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Storage connection error:', listError);
      return {
        success: false,
        error: listError,
        message: 'Failed to list buckets'
      };
    }

    console.log('📦 Available buckets:', buckets?.map(b => b.name) || []);

    // Check if our bucket exists
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.warn(`⚠️ Bucket "${bucketName}" not found. Available buckets:`, buckets?.map(b => b.name));
      return {
        success: false,
        error: null,
        message: `Bucket "${bucketName}" does not exist`,
        availableBuckets: buckets?.map(b => b.name) || []
      };
    }

    // Try to list files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (filesError) {
      console.error('❌ Error listing files:', filesError);
      return {
        success: false,
        error: filesError,
        message: 'Bucket exists but cannot list files (check permissions)'
      };
    }

    console.log(`✅ Storage connection successful!`);
    console.log(`📁 Bucket "${bucketName}" contains ${files?.length || 0} files/folders`);
    
    if (files && files.length > 0) {
      console.log('📄 Sample files:', files.slice(0, 5).map(f => ({
        name: f.name,
        size: f.metadata?.size || 'unknown',
        type: f.metadata?.mimetype || 'unknown'
      })));
    }

    return {
      success: true,
      bucketName,
      fileCount: files?.length || 0,
      files: files || []
    };
  } catch (error) {
    console.error('❌ Storage connection failed:', error);
    return {
      success: false,
      error,
      message: 'Unexpected error testing storage connection'
    };
  }
}

/**
 * Get public URL for a file in storage
 */
export function getStorageUrl(bucketName: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Upload file to storage bucket via API route (bypasses RLS)
 */
export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File | Blob,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
) {
  try {
    console.log(`📤 Uploading file to "${bucketName}/${filePath}"...`);
    
    // Use API route to upload (bypasses RLS with service role key)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', filePath.split('/')[0] || 'images');

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ Upload error:', result.error);
      return { 
        success: false, 
        error: result.error || new Error('Upload failed'), 
        data: null 
      };
    }

    console.log('✅ File uploaded successfully:', result.path);
    return { 
      success: true, 
      data: { path: result.path }, 
      error: null,
      url: result.url
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return { success: false, error, data: null };
  }
}

/**
 * List files in a storage bucket
 */
export async function listFiles(
  bucketName: string,
  folderPath: string = '',
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        sortBy: options?.sortBy || { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('❌ List files error:', error);
      return { success: false, error, data: null };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('❌ List files failed:', error);
    return { success: false, error, data: null };
  }
}

/**
 * Delete file from storage bucket
 */
export async function deleteFile(bucketName: string, filePath: string) {
  try {
    console.log(`🗑️ Deleting file "${bucketName}/${filePath}"...`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return { success: false, error };
    }

    console.log('✅ File deleted successfully');
    return { success: true, data, error: null };
  } catch (error) {
    console.error('❌ Delete failed:', error);
    return { success: false, error };
  }
}

/**
 * Download file from storage bucket
 */
export async function downloadFile(bucketName: string, filePath: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('❌ Download error:', error);
      return { success: false, error, data: null };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('❌ Download failed:', error);
    return { success: false, error, data: null };
  }
}

// Export default bucket name for convenience
export { DEFAULT_BUCKET };

