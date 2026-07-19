import sharp from 'sharp';

/** Longest side after resize — enough for retina product cards / zoom. */
const MAX_DIMENSION = 1600;
/** WebP quality balance: good detail, much smaller files. */
const WEBP_QUALITY = 80;

export type CompressedImage = {
  buffer: Buffer;
  contentType: string;
  extension: string;
  originalBytes: number;
  compressedBytes: number;
};

/**
 * Compress and normalize an uploaded image for storage.
 * - Auto-orients from EXIF
 * - Resizes so the longest side is ≤ 1600px
 * - Converts to WebP
 * Returns null to keep the original file (SVG, failed decode, or no size win).
 */
export async function compressImageForUpload(
  input: Buffer,
  mimeType: string
): Promise<CompressedImage | null> {
  const type = (mimeType || '').toLowerCase();

  // Leave vector / already-tiny formats alone
  if (type.includes('svg') || type === 'image/gif') {
    return null;
  }

  try {
    const image = sharp(input, { failOn: 'none', animated: false }).rotate();
    const meta = await image.metadata();

    let pipeline = sharp(input, { failOn: 'none', animated: false }).rotate();

    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const compressed = await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();

    // Prefer original only if compression made the file larger
    if (compressed.length >= input.length) {
      return null;
    }

    return {
      buffer: compressed,
      contentType: 'image/webp',
      extension: 'webp',
      originalBytes: input.length,
      compressedBytes: compressed.length,
    };
  } catch (error) {
    console.warn('Image compression skipped, uploading original:', error);
    return null;
  }
}
