# ASCII Art Converter - Design Document

## Overview

A client-side web application that converts images and video frames into ASCII art and exports the result as a pre-rendered React component.

## Requirements

- **Input**: Images (any format browser supports) and videos
- **Processing**: Entirely client-side using Canvas API
- **Output**: React component containing static ASCII art in a `<pre>` tag
- **Quality Levels**: 3 options - Small (~50px), Medium (~100px), Large (~150px width)
- **Color**: Black/white only (no color ASCII for MVP)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Page (app/page.tsx)                                    │
│  ├─ DropZone      (file upload + drag-and-drop)        │
│  ├─ PreviewArea   (original + ASCII side-by-side)      │
│  │   └─ VideoPlayer OR ImageDisplay                     │
│  │   └─ AsciiRenderer                                   │
│  ├─ Controls      (quality: S/M/L selector)            │
│  └─ ExportPanel   (code preview + copy/download)       │
│      └─ CodeBlock                                       │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Core Logic (lib/ascii.ts)                              │
│  ├─ imageToAscii()    (canvas → grayscale → chars)     │
│  ├─ videoToAscii()    (frame extraction + batch conv)  │
│  └─ generateComponent() (wraps ASCII in React code)    │
└─────────────────────────────────────────────────────────┘
```

## Components

| Component         | Props                                                                          | Purpose                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `DropZone`        | `onFileSelect: (file: File) => void`                                           | Drag-and-drop + click to upload. Validates file type (image/_, video/_). Shows file name once selected. |
| `PreviewArea`     | `original: string` (data URL), `ascii: string` (ASCII art), `isVideo: boolean` | Side-by-side display. Left shows `<img>` or `<video>`, right shows `<pre>` with ASCII.                  |
| `QualitySelector` | `value: 's' \| 'm' \| 'l'`, `onChange: (q) => void`                            | Three buttons/segmented control. Labels: "S", "M", "L".                                                 |
| `ExportPanel`     | `ascii: string, fileName: string`                                              | Shows generated React code. Copy button + download as `.tsx` file.                                      |
| `AsciiRenderer`   | `content: string, className?: string`                                          | Renders `<pre>` with monospace font. Handles whitespace preservation.                                   |

## Utility Functions (lib/ascii.ts)

- `getLuminance(r, g, b)` - brightness from RGB
- `pixelToChar(luminance, charSet)` - map 0-255 to ASCII chars
- `canvasToAscii(canvas, width)` - main conversion function
- `extractVideoFrame(video, time)` - grab single frame for preview
- `generateReactComponent(ascii, fileName)` - wrap in component boilerplate

## Data Flow

1. User drops/selects file
2. File read as Data URL
3. Detect type (image vs video)
4. Convert to ASCII using selected quality
5. Show preview (original + ASCII side-by-side)
6. User changes quality → re-convert
7. User clicks export → generate .tsx code
8. Show in export panel with copy/download

## State Management

State lives in `page.tsx`:

- `file: File | null`
- `dataUrl: string` (for preview)
- `ascii: string` (current output)
- `quality: 's' | 'm' | 'l'`
- `isVideo: boolean`

Processing happens in `useEffect` when `file` or `quality` changes.

## Error Handling

- **Invalid file type**: Reject non-image/video files with clear message
- **File too large**: Warn if >50MB (browser memory limits)
- **Video frame extraction fails**: Fallback to showing "Video preview unavailable, ASCII still generated"
- **Canvas security (CORS)**: Handle cross-origin images gracefully
- **Empty ASCII output**: Edge case for tiny images, show warning

## ASCII Conversion Algorithm

1. Draw image/frame to canvas at target width (maintaining aspect ratio)
2. Get pixel data with `getImageData()`
3. For each pixel:
   - Convert RGB to luminance: `0.299*r + 0.587*g + 0.114*b`
   - Map luminance (0-255) to character from set
4. Join rows with newlines

**Character set**: `@%#*+=-:. ` (10 levels from dark to light)

**Quality mapping**:

- S: 50 chars wide
- M: 100 chars wide
- L: 150 chars wide

## Export Format

```tsx
export function AsciiArt() {
  const art = \`[ASCII content here]\`;
  return (
    <pre className="font-mono text-xs leading-none whitespace-pre">
      {art}
    </pre>
  );
}
```

## Decisions & Trade-offs

- **Client-side only**: Simpler, no server costs, works offline. Limited by browser memory for large videos.
- **Single-page flow**: Fastest for repeat use. No wizard overhead for single-setting adjustment.
- **Static export**: Pre-rendered string means zero runtime dependencies for exported component.
- **B&W only**: Color ASCII requires CSS color spans, more complex export. Can add later.
- **3 quality levels**: Balances control with simplicity. User just picks output size.

## Future Considerations

- Color ASCII with CSS color spans
- Invert brightness (dark on light)
- Custom character sets
- Animated ASCII for video (sequence of frames)
- Batch processing multiple frames
