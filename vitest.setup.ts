import { Image, createCanvas } from 'canvas';

// Override jsdom's Image with node-canvas's Image
globalThis.Image = Image as any;

// Override document.createElement to use node-canvas for canvas elements
const originalCreateElement = document.createElement.bind(document);
document.createElement = function(tagName: string) {
  if (tagName.toLowerCase() === 'canvas') {
    // Return a node-canvas canvas instead of jsdom's canvas
    return createCanvas(0, 0) as any;
  }
  return originalCreateElement(tagName);
};
