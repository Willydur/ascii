export const ASCII_CHARS = '@%#*+=-:. ';

export function getLuminance(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

export function pixelToChar(luminance: number, charSet: string): string {
  const index = Math.round((luminance / 255) * (charSet.length - 1));
  return charSet[Math.min(index, charSet.length - 1)];
}

export function canvasToAscii(canvas: HTMLCanvasElement, targetWidth: number): string {
  if (targetWidth <= 0) throw new Error('targetWidth must be positive');

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate scaling factor
  const scaleX = canvas.width / targetWidth;
  const targetHeight = Math.round(canvas.height / scaleX);

  let ascii = '';
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      // Sample from source canvas
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleX);
      const i = (srcY * canvas.width + srcX) * 4;

      // Composite against white background using alpha
      const a = data[i + 3] / 255;
      const r = Math.round(data[i] * a + 255 * (1 - a));
      const g = Math.round(data[i + 1] * a + 255 * (1 - a));
      const b = Math.round(data[i + 2] * a + 255 * (1 - a));

      const lum = getLuminance(r, g, b);
      ascii += pixelToChar(lum, ASCII_CHARS);
    }
    if (y < targetHeight - 1) ascii += '\n';
  }

  return ascii;
}

export async function imageToAscii(
  image: HTMLImageElement,
  targetWidth: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Calculate dimensions maintaining aspect ratio
  const aspectRatio = image.naturalHeight / image.naturalWidth;
  const width = targetWidth;
  const height = Math.round(width * aspectRatio * 0.5); // 0.5 for char aspect ratio

  canvas.width = width;
  canvas.height = height;

  // Draw image to canvas at target size
  ctx.drawImage(image, 0, 0, width, height);

  return canvasToAscii(canvas, width);
}
