import { describe, it, expect } from 'vitest';
import { canvasToAscii, getLuminance, pixelToChar, ASCII_CHARS } from './ascii';

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
});
