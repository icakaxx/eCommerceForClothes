export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DEFAULT_BUCKET } from '@/lib/supabaseStorage';

interface MediaFile {
  name: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  created_at: string;
  updated_at: string;
  folder?: string;
}

// Recursively list all files in a folder
async function listFilesRecursive(
  bucket: string,
  folderPath: string = '',
  allFiles: MediaFile[] = []
): Promise<MediaFile[]> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(folderPath, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    console.error(`Error listing files in ${folderPath}:`, error);
    return allFiles;
  }

  if (!data) {
    return allFiles;
  }

  for (const item of data) {
    const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;

    // If it's a folder, recurse into it
    if (item.id === null) {
      // It's a folder
      await listFilesRecursive(bucket, fullPath, allFiles);
    } else {
      // It's a file
      const { data: urlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(fullPath);

      const folder = folderPath || 'root';
      
      allFiles.push({
        name: item.name,
        path: fullPath,
        url: urlData.publicUrl,
        size: item.metadata?.size || 0,
        mimeType: item.metadata?.mimetype || 'unknown',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        folder
      });
    }
  }

  return allFiles;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';

    // List all files recursively
    const files = await listFilesRecursive(DEFAULT_BUCKET, folder);

    return NextResponse.json({
      success: true,
      files,
      total: files.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: 'File path is required'
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(DEFAULT_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete file'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}



