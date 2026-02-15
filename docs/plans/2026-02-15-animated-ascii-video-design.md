# Animated ASCII Video - Design Document

## Overview

Extend the ASCII Art Converter to support full video conversion to animated ASCII art components. Instead of extracting just the first frame, the app will extract multiple frames at a user-selected frame rate and export a React component that animates through them.

## Requirements

- **Input**: Video files (any format browser supports)
- **Processing**: Extract frames at selectable FPS (1, 2, 5, 10 fps)
- **Output**: React component with embedded frame array that auto-plays
- **Preview**: Side-by-side video player with synchronized ASCII animation
- **Limits**: Warn users if frame count exceeds 200 frames

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Page (app/page.tsx)                                    │
│  ├─ DropZone           (file upload)                    │
│  ├─ VideoAsciiPlayer   (NEW: video + ASCII animation)   │
│  ├─ QualitySelector    (EXTENDED: + FPS selector)       │
│  └─ ExportPanel        (EXTENDED: animated component)   │
│      └─ AnimatedComponentGenerator                      │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Core Logic (lib/ascii.ts)                              │
│  ├─ extractVideoFrames()  (extract all frames at FPS)   │
│  ├─ framesToAscii()       (batch convert with progress) │
│  └─ generateAnimatedComponent()  (React with useEffect) │
└─────────────────────────────────────────────────────────┘
```

## Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `VideoAsciiPlayer` | `videoSrc: string, frames: string[], fps: number` | Shows original video with synchronized ASCII animation side-by-side. Uses `useEffect` interval to cycle frames. |
| `QualitySelector` | `value: Quality, fps: number, onQualityChange, onFpsChange` | Extended with FPS dropdown (1, 2, 5, 10 fps). |
| `ProgressIndicator` | `current: number, total: number` | Shows frame extraction/conversion progress. |

## State Management

Additions to `page.tsx` state:
- `asciiFrames: string[]` — array of ASCII frames
- `fps: number` — selected frame rate (default: 2)
- `isProcessingFrames: boolean` — for progress indication
- `processingProgress: {current: number, total: number}`

## Data Flow

1. User drops video file
2. Detect video and set `isAnimated: true`
3. Extract frames at selected FPS using `seek` + `drawImage`
4. Convert each frame to ASCII sequentially (show progress)
5. Store frames in `asciiFrames` state
6. Render `VideoAsciiPlayer` with video + animated frames
7. On export, call `generateAnimatedReactComponent(frames, fps, componentName)`

## Core Functions (lib/ascii.ts)

### `extractVideoFrames(video, fps): Promise<HTMLCanvasElement[]>`
- Calculate total frames: `duration * fps`
- If > 200 frames, warn user and suggest lower FPS
- Seek to each timestamp, draw to canvas, store canvas
- Return array of canvases

### `framesToAscii(frames, width): Promise<string[]>`
- Map each canvas through `canvasToAscii`
- Process sequentially to avoid memory issues
- Return array of ASCII strings

### `generateAnimatedReactComponent(frames, fps, componentName): string`
- Escape backticks in each frame
- Generate component with `useState` for current frame index
- `useEffect` with `setInterval` at `1000/fps` ms
- Loop through frames with modulo

## Export Format

```tsx
export function VideoAsciiArt() {
  const frames = [
    \`frame1 ASCII content...\`,
    \`frame2 ASCII content...\`,
    // ... all frames
  ];

  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(f => (f + 1) % frames.length);
    }, 500); // 2fps = 500ms per frame

    return () => clearInterval(interval);
  }, []);

  return (
    <pre className="font-mono text-xs leading-none whitespace-pre">
      {frames[currentFrame]}
    </pre>
  );
}
```

## Edge Cases

- **Long videos**: Warn if `duration * fps > 200`. Suggest lower FPS or trimming.
- **Processing cancellation**: Allow user to cancel mid-processing.
- **Memory during extraction**: Extract and convert one frame at a time, don't hold all canvases.
- **Video format errors**: Graceful handling of unsupported codecs.
- **Component size**: Large frame counts = large file size. Document this trade-off.

## Performance Considerations

- Process frames sequentially, not in parallel (memory constraint)
- Use `requestAnimationFrame` for smooth progress updates
- Consider throttling ASCII conversion for very large frames
- Default FPS is 2 (conservative), users can increase if they want smoother animation

## Future Considerations

- Pause/play controls in exported component
- Seek/slider to jump to specific frames
- Export as actual video file (canvas recording)
- Web Worker for non-blocking frame processing
- Progress bar in exported component while frames "load"
