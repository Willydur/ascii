# Animated ASCII Video Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the ASCII Art Converter to convert full videos into animated ASCII art React components with selectable frame rates.

**Architecture:** Add frame extraction and batch processing to lib/ascii.ts, create VideoAsciiPlayer component for synchronized preview, extend QualitySelector with FPS control, and generate React components with useEffect-based frame animation.

**Tech Stack:** Next.js 15, TypeScript, React 19, HTML5 Video API, Canvas API, Vitest for testing

---

## Task 1: Add Video Frame Extraction Function

**Files:**
- Modify: `lib/ascii.ts:130-131` (append after generateReactComponent)
- Test: `lib/ascii.test.ts` (add new test)

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('extractVideoFrames', () => {
  it('should extract frames at specified fps', async () => {
    const mockVideo = {
      duration: 2,
      videoWidth: 100,
      videoHeight: 100,
      currentTime: 0,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'seeked') {
          setTimeout(() => handler(), 0);
        }
      }),
      removeEventListener: vi.fn(),
    };

    const frames = await extractVideoFrames(mockVideo as unknown as HTMLVideoElement, 2);
    expect(frames).toHaveLength(4); // 2 seconds * 2 fps
  });

  it('should throw error if frame count exceeds 200', async () => {
    const mockVideo = {
      duration: 100,
      videoWidth: 100,
      videoHeight: 100,
    };

    await expect(
      extractVideoFrames(mockVideo as unknown as HTMLVideoElement, 5)
    ).rejects.toThrow('Frame count exceeds maximum');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- lib/ascii.test.ts -t "extractVideoFrames"`
Expected: FAIL with "extractVideoFrames is not defined"

**Step 3: Write minimal implementation**

```typescript
export async function extractVideoFrames(
  video: HTMLVideoElement,
  fps: number
): Promise<HTMLCanvasElement[]> {
  const totalFrames = Math.floor(video.duration * fps);
  const MAX_FRAMES = 200;

  if (totalFrames > MAX_FRAMES) {
    throw new Error(
      `Frame count (${totalFrames}) exceeds maximum (${MAX_FRAMES}). ` +
      `Try a lower FPS or shorter video.`
    );
  }

  const frames: HTMLCanvasElement[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;
    const canvas = await extractVideoFrame(video, time);
    frames.push(canvas);
  }

  return frames;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- lib/ascii.test.ts -t "extractVideoFrames"`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/ascii.ts lib/ascii.test.ts
git commit -m "feat: add extractVideoFrames function with max frame limit"
```

---

## Task 2: Add Batch Frame to ASCII Conversion

**Files:**
- Modify: `lib/ascii.ts` (append after extractVideoFrames)
- Test: `lib/ascii.test.ts`

**Step 1: Write the failing test**

```typescript
describe('framesToAscii', () => {
  it('should convert multiple canvases to ASCII', async () => {
    // Create a simple mock canvas
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 10, 10);

    const frames = [canvas, canvas];
    const onProgress = vi.fn();

    const result = await framesToAscii(frames, 5, onProgress);

    expect(result).toHaveLength(2);
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith(1, 2);
    expect(onProgress).toHaveBeenCalledWith(2, 2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- lib/ascii.test.ts -t "framesToAscii"`
Expected: FAIL with "framesToAscii is not defined"

**Step 3: Write minimal implementation**

```typescript
export async function framesToAscii(
  frames: HTMLCanvasElement[],
  targetWidth: number,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const asciiFrames: string[] = [];

  for (let i = 0; i < frames.length; i++) {
    const canvas = frames[i];

    // Resize to target width
    const resizedCanvas = document.createElement('canvas');
    const ctx = resizedCanvas.getContext('2d')!;

    const aspectRatio = canvas.height / canvas.width;
    const width = targetWidth;
    const height = Math.round(width * aspectRatio * 0.5);

    resizedCanvas.width = width;
    resizedCanvas.height = height;
    ctx.drawImage(canvas, 0, 0, width, height);

    const ascii = canvasToAscii(resizedCanvas, width);
    asciiFrames.push(ascii);

    onProgress?.(i + 1, frames.length);
  }

  return asciiFrames;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- lib/ascii.test.ts -t "framesToAscii"`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/ascii.ts lib/ascii.test.ts
git commit -m "feat: add framesToAscii with progress callback"
```

---

## Task 3: Add Animated Component Generator

**Files:**
- Modify: `lib/ascii.ts` (append after framesToAscii)
- Test: `lib/ascii.test.ts`

**Step 1: Write the failing test**

```typescript
describe('generateAnimatedReactComponent', () => {
  it('should generate component with frames and fps', () => {
    const frames = ['frame1', 'frame2', 'frame3'];
    const result = generateAnimatedReactComponent(frames, 2, 'TestVideo');

    expect(result).toContain('export function TestVideo()');
    expect(result).toContain('const frames = [');
    expect(result).toContain('frame1');
    expect(result).toContain('frame2');
    expect(result).toContain('frame3');
    expect(result).toContain('useState(0)');
    expect(result).toContain('useEffect');
    expect(result).toContain('setInterval');
    expect(result).toContain('500'); // 1000 / 2fps = 500ms
    expect(result).toContain('(f + 1) % frames.length');
  });

  it('should escape backticks in frames', () => {
    const frames = ['frame`with`backticks'];
    const result = generateAnimatedReactComponent(frames, 1, 'Test');

    expect(result).toContain('frame\\`with\\`backticks');
    expect(result).not.toContain('frame`with`backticks');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- lib/ascii.test.ts -t "generateAnimatedReactComponent"`
Expected: FAIL with "generateAnimatedReactComponent is not defined"

**Step 3: Write minimal implementation**

```typescript
export function generateAnimatedReactComponent(
  frames: string[],
  fps: number,
  componentName: string
): string {
  const intervalMs = Math.round(1000 / fps);
  const escapedFrames = frames.map(f => f.replace(/`/g, '\\`'));
  const framesString = escapedFrames.map(f => `    \`${f}\``).join(',\n');

  return `import { useState, useEffect } from 'react';

export function ${componentName}() {
  const frames = [
${framesString}
  ];

  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(f => (f + 1) % frames.length);
    }, ${intervalMs});

    return () => clearInterval(interval);
  }, []);

  return (
    <pre className="font-mono text-xs leading-none whitespace-pre">
      {frames[currentFrame]}
    </pre>
  );
}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- lib/ascii.test.ts -t "generateAnimatedReactComponent"`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/ascii.ts lib/ascii.test.ts
git commit -m "feat: add generateAnimatedReactComponent for video export"
```

---

## Task 4: Extend QualitySelector with FPS Control

**Files:**
- Modify: `components/quality-selector.tsx`

**Step 1: Read current implementation**

Read: `components/quality-selector.tsx`

**Step 2: Modify component to add FPS selector**

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const QUALITY_WIDTHS = {
  s: 50,
  m: 100,
  l: 150,
} as const;

export const FPS_OPTIONS = [1, 2, 5, 10] as const;

export type Quality = keyof typeof QUALITY_WIDTHS;
export type FpsOption = typeof FPS_OPTIONS[number];

interface QualitySelectorProps {
  quality: Quality;
  fps?: FpsOption;
  showFps?: boolean;
  onQualityChange: (quality: Quality) => void;
  onFpsChange?: (fps: FpsOption) => void;
}

export function QualitySelector({
  quality,
  fps = 2,
  showFps = false,
  onQualityChange,
  onFpsChange,
}: QualitySelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Quality (Width)</Label>
        <div className="flex gap-2">
          {(['s', 'm', 'l'] as Quality[]).map((q) => (
            <Button
              key={q}
              variant={quality === q ? 'default' : 'outline'}
              onClick={() => onQualityChange(q)}
              className="flex-1"
            >
              {q.toUpperCase()} ({QUALITY_WIDTHS[q]}px)
            </Button>
          ))}
        </div>
      </div>

      {showFps && onFpsChange && (
        <div className="space-y-2">
          <Label>Frame Rate (FPS)</Label>
          <div className="flex gap-2">
            {FPS_OPTIONS.map((f) => (
              <Button
                key={f}
                variant={fps === f ? 'default' : 'outline'}
                onClick={() => onFpsChange(f)}
                className="flex-1"
              >
                {f} fps
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Higher FPS = smoother animation but larger file size
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify component renders**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 4: Commit**

```bash
git add components/quality-selector.tsx
git commit -m "feat: extend QualitySelector with FPS control for video"
```

---

## Task 5: Create VideoAsciiPlayer Component

**Files:**
- Create: `components/video-ascii-player.tsx`

**Step 1: Create component file**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { AsciiRenderer } from './ascii-renderer';

interface VideoAsciiPlayerProps {
  videoSrc: string;
  frames: string[];
  fps: number;
}

export function VideoAsciiPlayer({ videoSrc, frames, fps }: VideoAsciiPlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const intervalMs = 1000 / fps;
    const interval = setInterval(() => {
      setCurrentFrame(f => (f + 1) % frames.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [frames.length, fps]);

  // Sync video to frame position when video is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const time = currentFrame / fps;
    if (Math.abs(video.currentTime - time) > 0.1) {
      video.currentTime = time;
    }
  }, [currentFrame, fps]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-sm font-medium mb-2">Original Video</p>
        <video
          ref={videoRef}
          src={videoSrc}
          className="max-w-full rounded-md"
          controls
          muted
          loop
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">
          ASCII Animation (Frame {currentFrame + 1} of {frames.length})
        </p>
        <AsciiRenderer content={frames[currentFrame]} />
      </div>
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/video-ascii-player.tsx
git commit -m "feat: add VideoAsciiPlayer component for synchronized preview"
```

---

## Task 6: Update Page with Video Animation Support

**Files:**
- Modify: `app/page.tsx`

**Step 1: Read current page.tsx**

Read: `app/page.tsx`

**Step 2: Update imports and state**

Add imports:
```typescript
import { VideoAsciiPlayer } from '@/components/video-ascii-player';
import { FPS_OPTIONS, type FpsOption } from '@/components/quality-selector';
import {
  extractVideoFrames,
  framesToAscii,
  generateAnimatedReactComponent,
} from '@/lib/ascii';
```

Add state:
```typescript
const [fps, setFps] = useState<FpsOption>(2);
const [asciiFrames, setAsciiFrames] = useState<string[]>([]);
const [isProcessingFrames, setIsProcessingFrames] = useState(false);
const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
```

**Step 3: Update video processing effect**

Replace the video processing section in useEffect with:

```typescript
if (isVideo) {
  const video = document.createElement('video');
  video.src = dataUrl;
  video.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
  });

  // Check frame count
  const totalFrames = Math.floor(video.duration * fps);
  if (totalFrames > 200) {
    throw new Error(
      `Video would generate ${totalFrames} frames (max 200). ` +
      `Try a lower FPS or shorter video.`
    );
  }

  // Extract and convert frames
  setIsProcessingFrames(true);
  setProcessingProgress({ current: 0, total: totalFrames });

  try {
    const frameCanvases = await extractVideoFrames(video, fps);
    const asciiResult = await framesToAscii(
      frameCanvases,
      QUALITY_WIDTHS[quality],
      (current, total) => setProcessingProgress({ current, total })
    );
    setAsciiFrames(asciiResult);
    setAscii(asciiResult[0]); // Show first frame in single view
  } finally {
    setIsProcessingFrames(false);
  }
}
```

**Step 4: Update QualitySelector usage**

Replace QualitySelector with:
```typescript
<QualitySelector
  quality={quality}
  fps={fps}
  showFps={isVideo}
  onQualityChange={setQuality}
  onFpsChange={setFps}
/>
```

**Step 5: Update preview section**

Replace the preview grid with conditional rendering:

```typescript
{isProcessing && (
  <div className="text-center py-8 text-muted-foreground">
    {isProcessingFrames ? (
      <div className="space-y-2">
        <p>Processing frames...</p>
        <p className="text-sm">
          {processingProgress.current} of {processingProgress.total}
        </p>
        <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${(processingProgress.current / processingProgress.total) * 100}%`,
            }}
          />
        </div>
      </div>
    ) : (
      'Processing...'
    )}
  </div>
)}

{!isProcessing && asciiFrames.length > 0 && isVideo && (
  <VideoAsciiPlayer
    videoSrc={dataUrl}
    frames={asciiFrames}
    fps={fps}
  />
)}

{!isProcessing && ascii && !isVideo && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* existing image preview */}
  </div>
)}
```

**Step 6: Update export code generation**

Replace exportCode with:
```typescript
const exportCode = isVideo && asciiFrames.length > 0
  ? generateAnimatedReactComponent(asciiFrames, fps, componentName)
  : generateReactComponent(ascii, componentName);
```

**Step 7: Clear frames on file change**

Add to handleFileSelect:
```typescript
setAsciiFrames([]);
setFps(2);
```

**Step 8: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add app/page.tsx
git commit -m "feat: integrate animated video ASCII into main page"
```

---

## Task 7: Add Tests for VideoAsciiPlayer

**Files:**
- Create: `components/video-ascii-player.test.tsx`

**Step 1: Create test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { VideoAsciiPlayer } from './video-ascii-player';

describe('VideoAsciiPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should display first frame initially', () => {
    const frames = ['frame1', 'frame2', 'frame3'];
    render(<VideoAsciiPlayer videoSrc="test.mp4" frames={frames} fps={1} />);

    expect(screen.getByText('frame1')).toBeInTheDocument();
    expect(screen.getByText('Frame 1 of 3')).toBeInTheDocument();
  });

  it('should cycle through frames at specified fps', () => {
    const frames = ['frame1', 'frame2', 'frame3'];
    render(<VideoAsciiPlayer videoSrc="test.mp4" frames={frames} fps={1} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('frame2')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('frame3')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('frame1')).toBeInTheDocument(); // Loops back
  });

  it('should render video element', () => {
    const frames = ['frame1'];
    render(<VideoAsciiPlayer videoSrc="test.mp4" frames={frames} fps={1} />);

    const video = screen.getByRole('video');
    expect(video).toHaveAttribute('src', 'test.mp4');
  });
});
```

**Step 2: Run tests**

Run: `npm test -- components/video-ascii-player.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add components/video-ascii-player.test.tsx
git commit -m "test: add tests for VideoAsciiPlayer component"
```

---

## Task 8: Run Full Test Suite

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Build application**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit any final changes**

```bash
git commit -m "feat: complete animated ASCII video implementation" || echo "No changes to commit"
```

---

## Summary

This implementation adds:
1. `extractVideoFrames()` - extracts frames from video at specified FPS
2. `framesToAscii()` - batch converts frames with progress callback
3. `generateAnimatedReactComponent()` - generates React component with frame animation
4. Extended `QualitySelector` with FPS control
5. `VideoAsciiPlayer` component for synchronized preview
6. Updated main page with video animation support and progress indicator

The exported component uses `useState` and `useEffect` with `setInterval` to cycle through frames at the selected FPS, creating a smooth ASCII animation.
