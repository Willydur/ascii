import { describe, it, expect } from 'vitest';
import { canvasToAscii, getLuminance, pixelToChar, ASCII_CHARS, imageToAscii, generateReactComponent } from './ascii';

describe('getLuminance', () => {
  it('returns 0 for black', () => {
    expect(getLuminance(0, 0, 0)).toBe(0);
  });

  it('returns 255 for white', () => {
    expect(getLuminance(255, 255, 255)).toBe(255);
  });

  it('calculates correct luminance for gray', () => {
    expect(getLuminance(128, 128, 128)).toBeCloseTo(128, 0);
  });
});

describe('pixelToChar', () => {
  it('returns darkest char for black', () => {
    expect(pixelToChar(0, ASCII_CHARS)).toBe('@');
  });

  it('returns lightest char for white', () => {
    expect(pixelToChar(255, ASCII_CHARS)).toBe(' ');
  });

  it('returns middle char for mid-gray', () => {
    const midIndex = Math.floor(ASCII_CHARS.length / 2);
    const midLum = Math.floor((255 * midIndex) / (ASCII_CHARS.length - 1));
    expect(pixelToChar(midLum, ASCII_CHARS)).toBe(ASCII_CHARS[midIndex]);
  });
});

describe('canvasToAscii', () => {
  it('converts a canvas to ASCII string', () => {
    // Create a 2x2 canvas with known colors
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d')!;

    // Fill with black and white
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 1, 1, 1);
    ctx.fillRect(1, 1, 1, 1);

    const result = canvasToAscii(canvas, 2);
    const lines = result.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('@@'); // black = darkest char
    expect(lines[1]).toBe('  '); // white = lightest char
  });

  it('scales canvas to target width', () => {
    // Create a 4x4 canvas with a checkerboard pattern
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext('2d')!;

    // Fill with black and white checkerboard
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? 'black' : 'white';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Scale down to 2x2
    const result = canvasToAscii(canvas, 2);
    const lines = result.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveLength(2);
    expect(lines[1]).toHaveLength(2);
  });

  it('handles transparent pixels by compositing against white', () => {
    // Create a 2x2 canvas with transparent pixels
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d')!;

    // Fill with fully transparent black
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, 2, 2);

    const result = canvasToAscii(canvas, 2);
    const lines = result.split('\n');

    // Fully transparent should appear as white (lightest char)
    expect(lines[0]).toBe('  ');
    expect(lines[1]).toBe('  ');
  });
});

describe('imageToAscii', () => {
  it('converts an image element to ASCII', async () => {
    // Create a small test image
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, 10, 10);

    // Convert canvas to data URL then to image
    const dataUrl = canvas.toDataURL('image/png');

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      // Check if already loaded (node-canvas loads data URLs synchronously)
      if ((img as any).complete) {
        resolve(undefined);
        return;
      }
      img.onload = () => resolve(undefined);
      img.onerror = reject;
    });

    const result = await imageToAscii(img, 5);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('generateReactComponent', () => {
  it('generates a valid React component string', () => {
    const ascii = '@@\n  ';
    const componentName = 'TestArt';

    const result = generateReactComponent(ascii, componentName);

    expect(result).toContain('export function TestArt()');
    expect(result).toContain('const art = `@@');
    expect(result).toContain('<pre');
    expect(result).toContain('font-mono');
    expect(result).toContain('whitespace-pre');
  });
});
