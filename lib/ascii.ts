export const ASCII_CHARS = '@%#*+=-:. ';

export function getLuminance(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

export function pixelToChar(luminance: number, charSet: string): string {
  const index = Math.round((luminance / 255) * (charSet.length - 1));
  return charSet[Math.min(index, charSet.length - 1)];
}

export function canvasToAscii(canvas: HTMLCanvasElement, targetWidth: number): string {
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
