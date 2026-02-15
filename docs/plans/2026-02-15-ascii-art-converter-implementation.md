# ASCII Art Converter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a client-side webapp that converts images/videos to ASCII art and exports as React components.

**Architecture:** Single-page Next.js app with Canvas-based image processing. State managed in page component, processing logic in utility module. Side-by-side preview with quality selector and code export.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui components

---

## Task 1: Create ASCII conversion utilities

**Files:**
- Create: `lib/ascii.ts`
- Test: `lib/ascii.test.ts`

**Step 1: Write the failing test**

Create `lib/ascii.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `npm test lib/ascii.test.ts`

Expected: FAIL with "Cannot find module './ascii'"

**Step 3: Write minimal implementation**

Create `lib/ascii.ts`:

```typescript
export const ASCII_CHARS = '@%#*+=-:. ';

export function getLuminance(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

export function pixelToChar(luminance: number, charSet: string): string {
  const index = Math.floor((luminance / 255) * (charSet.length - 1));
  return charSet[Math.min(index, charSet.length - 1)];
}
```

**Step 4: Run test to verify it passes**

Run: `npm test lib/ascii.test.ts`

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add lib/ascii.ts lib/ascii.test.ts
git commit -m "feat: add ASCII conversion utilities"
```

---

## Task 2: Add canvasToAscii function

**Files:**
- Modify: `lib/ascii.ts`
- Test: `lib/ascii.test.ts`

**Step 1: Write the failing test**

Add to `lib/ascii.test.ts`:

```typescript
import { canvasToAscii, getLuminance, pixelToChar, ASCII_CHARS } from './ascii';

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
```

**Step 2: Run test to verify it fails**

Run: `npm test lib/ascii.test.ts::canvasToAscii`

Expected: FAIL with "canvasToAscii is not defined"

**Step 3: Write minimal implementation**

Add to `lib/ascii.ts`:

```typescript
export function canvasToAscii(canvas: HTMLCanvasElement, width: number): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let ascii = '';
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = getLuminance(r, g, b);
      ascii += pixelToChar(lum, ASCII_CHARS);
    }
    if (y < canvas.height - 1) ascii += '\n';
  }

  return ascii;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test lib/ascii.test.ts::canvasToAscii`

Expected: PASS

**Step 5: Commit**

```bash
git add lib/ascii.ts lib/ascii.test.ts
git commit -m "feat: add canvasToAscii function"
```

---

## Task 3: Add imageToAscii function

**Files:**
- Modify: `lib/ascii.ts`

**Step 1: Write the failing test**

Add to `lib/ascii.test.ts`:

```typescript
describe('imageToAscii', () => {
  it('converts an image element to ASCII', async () => {
    // Create a small test image
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'gray';
    ctx.fillRect(0, 0, 10, 10);

    // Convert canvas to blob then to image
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png')
    );
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.src = url;
    await new Promise((resolve) => { img.onload = resolve; });

    const { imageToAscii } = await import('./ascii');
    const result = await imageToAscii(img, 5);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    URL.revokeObjectURL(url);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test lib/ascii.test.ts::imageToAscii`

Expected: FAIL with "imageToAscii is not defined"

**Step 3: Write minimal implementation**

Add to `lib/ascii.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test lib/ascii.test.ts::imageToAscii`

Expected: PASS

**Step 5: Commit**

```bash
git add lib/ascii.ts lib/ascii.test.ts
git commit -m "feat: add imageToAscii function"
```

---

## Task 4: Add video frame extraction

**Files:**
- Modify: `lib/ascii.ts`

**Step 1: Write the failing test**

Skip this test (video testing is complex in JSDOM) - add implementation directly.

**Step 2: Add implementation**

Add to `lib/ascii.ts`:

```typescript
export function extractVideoFrame(
  video: HTMLVideoElement,
  time: number = 0
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const handleSeeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      video.removeEventListener('seeked', handleSeeked);
      resolve(canvas);
    };

    video.addEventListener('seeked', handleSeeked);
    video.currentTime = time;
  });
}

export async function videoFrameToAscii(
  video: HTMLVideoElement,
  targetWidth: number,
  time: number = 0
): Promise<string> {
  const canvas = await extractVideoFrame(video, time);

  // Resize canvas to target width
  const resizedCanvas = document.createElement('canvas');
  const ctx = resizedCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const aspectRatio = canvas.height / canvas.width;
  const width = targetWidth;
  const height = Math.round(width * aspectRatio * 0.5);

  resizedCanvas.width = width;
  resizedCanvas.height = height;
  ctx.drawImage(canvas, 0, 0, width, height);

  return canvasToAscii(resizedCanvas, width);
}
```

**Step 3: Commit**

```bash
git add lib/ascii.ts
git commit -m "feat: add video frame extraction"
```

---

## Task 5: Add React component generator

**Files:**
- Modify: `lib/ascii.ts`
- Test: `lib/ascii.test.ts`

**Step 1: Write the failing test**

Add to `lib/ascii.test.ts`:

```typescript
describe('generateReactComponent', () => {
  it('generates a valid React component string', () => {
    const { generateReactComponent } = require('./ascii');
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
```

**Step 2: Run test to verify it fails**

Run: `npm test lib/ascii.test.ts::generateReactComponent`

Expected: FAIL with "generateReactComponent is not defined"

**Step 3: Write minimal implementation**

Add to `lib/ascii.ts`:

```typescript
export function generateReactComponent(ascii: string, componentName: string): string {
  // Escape backticks in ASCII
  const escapedAscii = ascii.replace(/`/g, '\\`');

  return `export function ${componentName}() {
  const art = \`${escapedAscii}\`;
  return (
    <pre className="font-mono text-xs leading-none whitespace-pre">
      {art}
    </pre>
  );
}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test lib/ascii.test.ts::generateReactComponent`

Expected: PASS

**Step 5: Commit**

```bash
git add lib/ascii.ts lib/ascii.test.ts
git commit -m "feat: add React component generator"
```

---

## Task 6: Create DropZone component

**Files:**
- Create: `components/drop-zone.tsx`

**Step 1: Create component**

Create `components/drop-zone.tsx`:

```typescript
'use client';

import { useCallback } from 'react';
import { UploadIcon } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export function DropZone({ onFileSelect, accept = 'image/*,video/*' }: DropZoneProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        id="file-input"
      />
      <label htmlFor="file-input" className="cursor-pointer block">
        <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Drop an image or video here</p>
        <p className="text-sm text-muted-foreground mt-2">
          or click to browse
        </p>
      </label>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/drop-zone.tsx
git commit -m "feat: add DropZone component"
```

---

## Task 7: Create QualitySelector component

**Files:**
- Create: `components/quality-selector.tsx`

**Step 1: Create component**

Create `components/quality-selector.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';

type Quality = 's' | 'm' | 'l';

interface QualitySelectorProps {
  value: Quality;
  onChange: (quality: Quality) => void;
}

const QUALITY_OPTIONS: { value: Quality; label: string; width: number }[] = [
  { value: 's', label: 'S', width: 50 },
  { value: 'm', label: 'M', width: 100 },
  { value: 'l', label: 'L', width: 150 },
];

export function QualitySelector({ value, onChange }: QualitySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium mr-2">Quality:</span>
      <div className="flex rounded-md border border-border overflow-hidden">
        {QUALITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              value === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            )}
          >
            {option.label}
            <span className="ml-1 text-xs opacity-60">(~{option.width}px)</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const QUALITY_WIDTHS: Record<Quality, number> = {
  s: 50,
  m: 100,
  l: 150,
};
```

**Step 2: Commit**

```bash
git add components/quality-selector.tsx
git commit -m "feat: add QualitySelector component"
```

---

## Task 8: Create ExportPanel component

**Files:**
- Create: `components/export-panel.tsx`

**Step 1: Create component**

Create `components/export-panel.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { CopyIcon, DownloadIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ExportPanelProps {
  code: string;
  fileName: string;
}

export function ExportPanel({ code, fileName }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Export Component</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            Download .tsx
          </Button>
        </div>
      </div>
      <Textarea
        value={code}
        readOnly
        className="font-mono text-xs min-h-[200px] resize-none"
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/export-panel.tsx
git commit -m "feat: add ExportPanel component"
```

---

## Task 9: Create AsciiRenderer component

**Files:**
- Create: `components/ascii-renderer.tsx`

**Step 1: Create component**

Create `components/ascii-renderer.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';

interface AsciiRendererProps {
  content: string;
  className?: string;
}

export function AsciiRenderer({ content, className }: AsciiRendererProps) {
  return (
    <pre
      className={cn(
        'font-mono text-xs leading-none whitespace-pre overflow-auto',
        'bg-muted p-4 rounded-md',
        className
      )}
    >
      {content}
    </pre>
  );
}
```

**Step 2: Commit**

```bash
git add components/ascii-renderer.tsx
git commit -m "feat: add AsciiRenderer component"
```

---

## Task 10: Build main page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Replace page content**

Replace `app/page.tsx`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { DropZone } from '@/components/drop-zone';
import { QualitySelector, QUALITY_WIDTHS } from '@/components/quality-selector';
import { ExportPanel } from '@/components/export-panel';
import { AsciiRenderer } from '@/components/ascii-renderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { imageToAscii, videoFrameToAscii, generateReactComponent } from '@/lib/ascii';

type Quality = 's' | 'm' | 'l';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [ascii, setAscii] = useState<string>('');
  const [quality, setQuality] = useState<Quality>('m');
  const [isVideo, setIsVideo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setIsVideo(selectedFile.type.startsWith('video/'));
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      setDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  useEffect(() => {
    if (!dataUrl) return;

    const process = async () => {
      setIsProcessing(true);
      setError('');

      try {
        if (isVideo) {
          const video = document.createElement('video');
          video.src = dataUrl;
          video.crossOrigin = 'anonymous';

          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error('Failed to load video'));
          });

          const result = await videoFrameToAscii(video, QUALITY_WIDTHS[quality]);
          setAscii(result);
        } else {
          const img = new Image();
          img.src = dataUrl;

          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
          });

          const result = await imageToAscii(img, QUALITY_WIDTHS[quality]);
          setAscii(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Processing failed');
        setAscii('');
      } finally {
        setIsProcessing(false);
      }
    };

    process();
  }, [dataUrl, quality, isVideo]);

  const componentName = file
    ? file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '') + 'Ascii'
    : 'AsciiArt';

  const exportCode = generateReactComponent(ascii, componentName);

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">ASCII Art Converter</h1>
        <p className="text-muted-foreground">
          Convert images and videos to ASCII art and export as React components
        </p>
      </div>

      {!file && <DropZone onFileSelect={handleFileSelect} />}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {file && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview: {file.name}</span>
                <button
                  onClick={() => {
                    setFile(null);
                    setDataUrl('');
                    setAscii('');
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QualitySelector value={quality} onChange={setQuality} />

              {isProcessing && (
                <div className="text-center py-8 text-muted-foreground">
                  Processing...
                </div>
              )}

              {!isProcessing && ascii && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Original</p>
                    {isVideo ? (
                      <video
                        src={dataUrl}
                        className="max-w-full rounded-md"
                        controls
                      />
                    ) : (
                      <img
                        src={dataUrl}
                        alt="Original"
                        className="max-w-full rounded-md"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">ASCII</p>
                    <AsciiRenderer content={ascii} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {ascii && (
            <Card>
              <CardContent className="pt-6">
                <ExportPanel code={exportCode} fileName={componentName} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add main page with full ASCII conversion flow"
```

---

## Task 11: Update layout metadata

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Update metadata**

In `app/layout.tsx`, change:

```typescript
export const metadata: Metadata = {
  title: 'ASCII Art Converter',
  description: 'Convert images and videos to ASCII art',
};
```

**Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "chore: update page metadata"
```

---

## Task 12: Add vitest for testing

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Step 1: Install vitest**

Run: `npm install -D vitest @vitejs/plugin-react jsdom`

**Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Step 3: Add test script to package.json**

Add to `package.json` scripts:

```json
"test": "vitest"
```

**Step 4: Commit**

```bash
git add package.json vitest.config.ts
git commit -m "chore: add vitest for testing"
```

---

## Task 13: Run all tests

**Files:**
- None

**Step 1: Run tests**

Run: `npm test -- --run`

Expected: All tests pass

**Step 2: Commit if any fixes needed**

If tests fail, fix and commit.

---

## Task 14: Final verification

**Files:**
- None

**Step 1: Build the app**

Run: `npm run build`

Expected: Build succeeds with no errors

**Step 2: Run dev server and test manually**

Run: `npm run dev`

Test:
1. Drop an image file
2. Verify preview shows original + ASCII
3. Change quality (S/M/L)
4. Verify ASCII updates
5. Click Copy - verify code copied
6. Click Download - verify .tsx file downloads
7. Clear and try a video file

**Step 3: Final commit**

```bash
git commit -m "feat: complete ASCII art converter implementation" --allow-empty
```

---

## Summary

This plan builds a complete ASCII art converter with:
- Canvas-based image processing utilities (tested)
- Drag-and-drop file upload
- Quality selector (S/M/L = 50/100/150px)
- Side-by-side preview (original + ASCII)
- React component export with copy/download

All processing happens client-side using the Canvas API.
