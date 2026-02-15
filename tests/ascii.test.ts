import { describe, it, expect, vi } from "vitest";
import {
  canvasToAscii,
  getLuminance,
  pixelToChar,
  ASCII_CHARS,
  imageToAscii,
  generateReactComponent,
  extractVideoFrames,
  framesToAscii,
  generateAnimatedReactComponent,
} from "@/lib/ascii";

describe("getLuminance", () => {
  it("returns 0 for black", () => {
    expect(getLuminance(0, 0, 0)).toBe(0);
  });

  it("returns 255 for white", () => {
    expect(getLuminance(255, 255, 255)).toBe(255);
  });

  it("calculates correct luminance for gray", () => {
    expect(getLuminance(128, 128, 128)).toBeCloseTo(128, 0);
  });
});

describe("pixelToChar", () => {
  it("returns darkest char for black", () => {
    expect(pixelToChar(0, ASCII_CHARS)).toBe("@");
  });

  it("returns lightest char for white", () => {
    expect(pixelToChar(255, ASCII_CHARS)).toBe(" ");
  });

  it("returns middle char for mid-gray", () => {
    const midIndex = Math.floor(ASCII_CHARS.length / 2);
    const midLum = Math.floor((255 * midIndex) / (ASCII_CHARS.length - 1));
    expect(pixelToChar(midLum, ASCII_CHARS)).toBe(ASCII_CHARS[midIndex]);
  });
});

describe("canvasToAscii", () => {
  it("converts a canvas to ASCII string", () => {
    // Create a 2x2 canvas with known colors
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext("2d")!;

    // Fill with black and white
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 1, 1, 1);
    ctx.fillRect(1, 1, 1, 1);

    const result = canvasToAscii(canvas, 2);
    const lines = result.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("@@"); // black = darkest char
    expect(lines[1]).toBe("  "); // white = lightest char
  });

  it("scales canvas to target width", () => {
    // Create a 4x4 canvas with a checkerboard pattern
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext("2d")!;

    // Fill with black and white checkerboard
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "black" : "white";
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Scale down to 2x2
    const result = canvasToAscii(canvas, 2);
    const lines = result.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveLength(2);
    expect(lines[1]).toHaveLength(2);
  });

  it("handles transparent pixels by compositing against white", () => {
    // Create a 2x2 canvas with transparent pixels
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext("2d")!;

    // Fill with fully transparent black
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, 2, 2);

    const result = canvasToAscii(canvas, 2);
    const lines = result.split("\n");

    // Fully transparent should appear as white (lightest char)
    expect(lines[0]).toBe("  ");
    expect(lines[1]).toBe("  ");
  });
});

describe("imageToAscii", () => {
  it("converts an image element to ASCII", async () => {
    // Create a small test image
    const canvas = document.createElement("canvas");
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "gray";
    ctx.fillRect(0, 0, 10, 10);

    // Convert canvas to data URL then to image
    const dataUrl = canvas.toDataURL("image/png");

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

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("generateReactComponent", () => {
  it("generates a valid React component string", () => {
    const ascii = "@@\n  ";
    const componentName = "TestArt";

    const result = generateReactComponent(ascii, componentName);

    expect(result).toContain("export function TestArt()");
    expect(result).toContain("const art = `@@");
    expect(result).toContain("<pre");
    expect(result).toContain("font-mono");
    expect(result).toContain("whitespace-pre");
  });
});

describe("extractVideoFrames", () => {
  it("extracts frames at specified fps", async () => {
    // Track how many times seeked is triggered
    let seekCount = 0;

    // Create a small canvas to use as a mock video frame
    const mockFrameCanvas = document.createElement("canvas");
    mockFrameCanvas.width = 10;
    mockFrameCanvas.height = 10;

    // Create a mock video element that properly simulates the seeked behavior
    const mockVideo = {
      duration: 2,
      videoWidth: 10,
      videoHeight: 10,
      _currentTime: 0,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "seeked") {
          // Store handler to be called after setting currentTime
          (mockVideo as any)._seekedHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    } as unknown as HTMLVideoElement & { _seekedHandler?: () => void };

    // Override currentTime setter to trigger seeked
    Object.defineProperty(mockVideo, "currentTime", {
      get() {
        return (mockVideo as any)._currentTime || 0;
      },
      set(value: number) {
        (mockVideo as any)._currentTime = value;
        seekCount++;
        // Trigger seeked handler asynchronously
        setTimeout(() => {
          const handler = (mockVideo as any)._seekedHandler;
          if (handler) handler();
        }, 0);
      },
    });

    // Mock canvas getContext to return a context that accepts our mock video
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      (tagName: string) => {
        if (tagName.toLowerCase() === "canvas") {
          const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
          const originalGetContext = canvas.getContext.bind(canvas);
          canvas.getContext = vi.fn((contextId: string) => {
            const ctx = originalGetContext(contextId);
            if (ctx && contextId === "2d") {
              // Mock drawImage to handle the mock video element
              const originalDrawImage = ctx.drawImage.bind(ctx);
              vi.spyOn(ctx, "drawImage").mockImplementation(
                (
                  image: CanvasImageSource,
                  dx: number,
                  dy?: number,
                  dWidth?: number,
                  dHeight?: number,
                ) => {
                  // If it's our mock video, draw the mock frame canvas instead
                  if (image === mockVideo) {
                    if (
                      typeof dy === "number" &&
                      typeof dWidth === "number" &&
                      typeof dHeight === "number"
                    ) {
                      return originalDrawImage(
                        mockFrameCanvas,
                        dx,
                        dy,
                        dWidth,
                        dHeight,
                      );
                    } else if (typeof dy === "number") {
                      return originalDrawImage(mockFrameCanvas, dx, dy);
                    } else {
                      return originalDrawImage(mockFrameCanvas, dx);
                    }
                  }
                  return originalDrawImage(
                    image,
                    dx,
                    dy as number,
                    dWidth as number,
                    dHeight as number,
                  );
                },
              );
            }
            return ctx;
          }) as any;
          return canvas;
        }
        return originalCreateElement(tagName);
      },
    );

    const frames = await extractVideoFrames(mockVideo, 2);

    // Restore the mock
    vi.restoreAllMocks();

    // 2 second video at 2fps = 4 frames (at timestamps 0, 0.5, 1, 1.5)
    expect(frames).toHaveLength(4);
    // Each frame should be a canvas (node-canvas Canvas in test env)
    frames.forEach((frame) => {
      expect(frame).toHaveProperty("width");
      expect(frame).toHaveProperty("height");
      expect(typeof frame.getContext).toBe("function");
    });
    // Verify we sought to 4 different timestamps
    expect(seekCount).toBe(4);
  });

  it("throws error if frame count exceeds 200", async () => {
    const mockVideo = {
      duration: 100, // 100 seconds
      videoWidth: 100,
      videoHeight: 100,
      currentTime: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLVideoElement;

    // 100 seconds at 3fps = 300 frames, which exceeds 200 limit
    await expect(extractVideoFrames(mockVideo, 3)).rejects.toThrow(
      "Frame count (300) exceeds maximum (200)",
    );
  });
});

describe("framesToAscii", () => {
  it("converts multiple canvases to ASCII strings", async () => {
    // Create 3 test canvases with different patterns
    const frames: HTMLCanvasElement[] = [];

    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext("2d")!;

      // Fill with different shades
      if (i === 0) {
        ctx.fillStyle = "black";
      } else if (i === 1) {
        ctx.fillStyle = "gray";
      } else {
        ctx.fillStyle = "white";
      }
      ctx.fillRect(0, 0, 4, 4);
      frames.push(canvas);
    }

    const result = await framesToAscii(frames, 2);

    expect(result).toHaveLength(3);
    expect(typeof result[0]).toBe("string");
    expect(typeof result[1]).toBe("string");
    expect(typeof result[2]).toBe("string");

    // Black frame should have dark chars, white frame light chars
    expect(result[0]).not.toBe(result[2]); // Black and white should differ
  });

  it("calls onProgress callback for each frame", async () => {
    const onProgress = vi.fn();

    // Create 3 test canvases
    const frames: HTMLCanvasElement[] = [];
    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 2, 2);
      frames.push(canvas);
    }

    await framesToAscii(frames, 2, onProgress);

    // Should be called once per frame
    expect(onProgress).toHaveBeenCalledTimes(3);

    // Check progress values
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
    expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
  });

  it("processes frames sequentially", async () => {
    const processingOrder: number[] = [];

    // Create 3 test canvases
    const frames: HTMLCanvasElement[] = [];
    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 2, 2);
      frames.push(canvas);
    }

    const onProgress = (current: number, total: number) => {
      processingOrder.push(current);
    };

    await framesToAscii(frames, 2, onProgress);

    // Should process in order
    expect(processingOrder).toEqual([1, 2, 3]);
  });

  it("works without onProgress callback", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 2, 2);

    const result = await framesToAscii([canvas], 2);

    expect(result).toHaveLength(1);
    expect(typeof result[0]).toBe("string");
  });
});

describe("generateAnimatedReactComponent", () => {
  it("generates a valid animated React component string", () => {
    const frames = ["frame1", "frame2", "frame3"];
    const fps = 10;
    const componentName = "AnimatedAscii";

    const result = generateAnimatedReactComponent(frames, fps, componentName);

    expect(result).toContain("export function AnimatedAscii()");
    expect(result).toContain("const frames =");
    expect(result).toContain("useState");
    expect(result).toContain("useEffect");
    expect(result).toContain("setInterval");
    expect(result).toContain("100"); // 1000/10 = 100ms
  });

  it("calculates correct interval for different fps values", () => {
    const frames = ["frame1"];

    const result30fps = generateAnimatedReactComponent(frames, 30, "Test");
    expect(result30fps).toContain("33"); // 1000/30 = 33.33 -> 33

    const result60fps = generateAnimatedReactComponent(frames, 60, "Test");
    expect(result60fps).toContain("17"); // 1000/60 = 16.67 -> 17

    const result1fps = generateAnimatedReactComponent(frames, 1, "Test");
    expect(result1fps).toContain("1000"); // 1000/1 = 1000
  });

  it("escapes backticks in frames", () => {
    const frames = ["frame with `backtick`"];
    const fps = 10;
    const componentName = "Test";

    const result = generateAnimatedReactComponent(frames, fps, componentName);

    expect(result).toContain("frame with \\`backtick\\`");
    expect(result).not.toContain("`backtick`"); // Should not have unescaped backticks
  });

  it("includes proper React imports", () => {
    const frames = ["frame1"];
    const fps = 10;
    const componentName = "Test";

    const result = generateAnimatedReactComponent(frames, fps, componentName);

    expect(result).toContain('import { useState, useEffect } from "react"');
  });

  it("includes frames array in the generated component", () => {
    const frames = ["frame1", "frame2"];
    const fps = 10;
    const componentName = "Test";

    const result = generateAnimatedReactComponent(frames, fps, componentName);

    expect(result).toContain("`frame1`");
    expect(result).toContain("`frame2`");
  });
});
