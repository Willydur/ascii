import { describe, it, expect } from 'vitest';
import { getLuminance, pixelToChar, ASCII_CHARS } from './ascii';

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
