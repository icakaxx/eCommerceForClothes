/**
 * Generate a test image and upload it to Supabase Storage (development utility).
 */

export async function generateAndUploadTestImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Test Image', canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = '24px Arial';
  ctx.fillText('Generated: ' + new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 20);

  ctx.font = '18px Arial';
  ctx.fillText('Supabase Storage Test', canvas.width / 2, canvas.height / 2 + 60);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(150, 150, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(canvas.width - 150, canvas.height - 150, 50, 0, Math.PI * 2);
  ctx.fill();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate image blob'));
      }
    }, 'image/png', 0.95);
  });
}
