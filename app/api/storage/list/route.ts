import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DEFAULT_BUCKET } from '@/lib/supabaseStorage';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);
    const folders = searchParams.get('folders')?.split(',') || ['images', 'logos', 'hero-images'];
    const limit = parseInt(searchParams.get('limit') || '200');

    let allImageFiles: Array<{name: string, path: string, url: string, size: number, created_at: string}> = [];

    // List files from all specified folders
    console.log('🔍 DEBUG: Listing files from folders:', folders, 'in bucket:', DEFAULT_BUCKET);

    for (const folder of folders) {
      console.log(`🔍 DEBUG: Listing files from folder: ${folder}`);
      const { data: files, error } = await supabase.storage
        .from(DEFAULT_BUCKET)
        .list(folder, {
          limit: limit,
          sortBy: { column: 'created_at', order: 'desc' },
          offset: 0
        });

      console.log(`🔍 DEBUG: Files in ${folder}:`, files?.length || 0, 'files found');
      if (files && files.length > 0) {
        console.log('🔍 DEBUG: Sample files:', files.slice(0, 3).map(f => ({ name: f.name, size: f.metadata?.size })));
      }

      if (error) {
        console.error(`Error listing files from ${folder}:`, error);
        continue; // Skip this folder if there's an error
      }

      // Filter to only image files and get public URLs
      console.log(`🔍 DEBUG: All files in ${folder}:`, files?.map(f => ({ name: f.name, type: f.metadata?.mimetype })));

      const imageFiles = (files || [])
        .filter(file => {
          const name = file.name.toLowerCase();
          const mimeType = file.metadata?.mimetype?.toLowerCase() || '';
          const isImageByName = name.endsWith('.jpg') ||
                 name.endsWith('.jpeg') ||
                 name.endsWith('.png') ||
                 name.endsWith('.gif') ||
                 name.endsWith('.webp') ||
                 name.endsWith('.avif') ||
                 name.endsWith('.heic') ||
                 name.endsWith('.heif') ||
                 name.endsWith('.svg') ||
                 name.endsWith('.bmp');

          const isImageByMime = mimeType.startsWith('image/');

          const isImage = isImageByName || isImageByMime;

          console.log(`🔍 DEBUG: File ${name}: mime=${mimeType}, isImageByName=${isImageByName}, isImageByMime=${isImageByMime}, isImage=${isImage}`);

          return isImage;
        });

      console.log(`🔍 DEBUG: After filtering, ${imageFiles.length} image files in ${folder}`);

      const processedImageFiles = imageFiles
        .map(file => {
          const filePath = `${folder}/${file.name}`;
          const { data } = supabase.storage
            .from(DEFAULT_BUCKET)
            .getPublicUrl(filePath);
          
          return {
            name: file.name,
            path: filePath,
            url: data.publicUrl,
            size: file.metadata?.size || 0,
            created_at: file.created_at || ''
          };
        });

      allImageFiles = [...allImageFiles, ...processedImageFiles];
    }

    // Sort by created_at descending
    allImageFiles.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    // Limit total results
    allImageFiles = allImageFiles.slice(0, limit);

    console.log('🔍 DEBUG: Returning', allImageFiles.length, 'total image files');
    if (allImageFiles.length > 0) {
      console.log('🔍 DEBUG: Sample returned files:', allImageFiles.slice(0, 3).map(f => ({ name: f.name, url: f.url.substring(0, 50) + '...' })));
    }

    return NextResponse.json({
      success: true,
      files: allImageFiles
    });

  } catch (error) {
    console.error('Failed to list files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

