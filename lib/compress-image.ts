import sharp from 'sharp';

/** Longest side after resize — enough for retina product cards / zoom. */
const MAX_DIMENSION = 1600;
/** WebP quality balance: good detail, much smaller files. */
const WEBP_QUALITY = 80;

export type CompressedImage = {
  /** Plain transferable bytes (never SharedArrayBuffer-backed). */
  bytes: Uint8Array;
  contentType: string;
  extension: string;
  originalBytes: number;
  compressedBytes: number;
};

/** Copy into a standalone Uint8Array so uploads never use SharedArrayBuffer. */
export function toPlainUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  const source = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

  // Fresh allocation — never share the underlying buffer with Node/native pools
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy;
}

/**
 * Compress and normalize an uploaded image for storage.
 * - Auto-orients from EXIF
 * - Resizes so the longest side is ≤ 1600px
 * - Converts to WebP
 * Returns null to keep the original file (SVG, failed decode, or no size win).
 */
export async function compressImageForUpload(
  input: Uint8Array,
  mimeType: string
): Promise<CompressedImage | null> {
  const type = (mimeType || '').toLowerCase();

  // Leave vector / already-tiny formats alone
  if (type.includes('svg') || type === 'image/gif') {
    return null;
  }

  try {
    // sharp accepts Uint8Array; keep a plain copy for safety across Node/Next runtimes
    const source = toPlainUint8Array(input);
    const meta = await sharp(source, { failOn: 'none', animated: false })
      .rotate()
      .metadata();

    let pipeline = sharp(source, { failOn: 'none', animated: false }).rotate();

    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const compressedBuffer = await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();

    const compressed = toPlainUint8Array(compressedBuffer);

    // Prefer original only if compression made the file larger
    if (compressed.byteLength >= source.byteLength) {
      return null;
    }

    return {
      bytes: compressed,
      contentType: 'image/webp',
      extension: 'webp',
      originalBytes: source.byteLength,
      compressedBytes: compressed.byteLength,
    };
  } catch (error) {
    console.warn('Image compression skipped, uploading original:', error);
    return null;
  }
}
