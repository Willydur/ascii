# ASCII Art Converter

A client-side web application that converts images and videos into ASCII art and exports them as ready-to-use React components.

![ASCII Art Converter](https://img.shields.io/badge/React-19-blue) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Features

- **Image to ASCII** - Convert any image to static ASCII art
- **Video to Animated ASCII** - Convert videos to animated ASCII art components
- **Client-side Processing** - All processing happens in the browser (no server required)
- **Export as React Components** - Copy-paste ready React code with TypeScript support
- **Quality Control** - Three quality levels (Small/Medium/Large) for output size
- **Frame Rate Selection** - Choose FPS (1/2/5/10) for video animations
- **Real-time Preview** - See results before exporting
- **Progress Indicator** - Track frame extraction and conversion progress

## Usage

1. **Upload** - Drag and drop or click to select an image or video file
2. **Configure** - Select quality (S/M/L) and frame rate (for videos)
3. **Preview** - View the original and ASCII output side-by-side
4. **Export** - Copy or download the generated React component

## Exported Components

### Static Image Component

```tsx
export function MyImageAscii() {
  const art = `....ASCII art content here....`;
  return (
    <pre className="font-mono text-xs leading-none whitespace-pre">
      {art}
    </pre>
  );
}
```

### Animated Video Component

```tsx
import { useState, useEffect } from 'react';

export function MyVideoAscii() {
  const frames = [
    `....frame 1....`,
    `....frame 2....`,
    `....frame 3....`,
  ];

  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(f => (f + 1) % frames.length);
    }, 500); // 2 FPS

    return () => clearInterval(interval);
  }, []);

  return (
    <pre className="font-mono text-xs leading-none whitespace-pre">
      {frames[currentFrame]}
    </pre>
  );
}
```

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vitest](https://vitest.dev/) - Testing

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
├── app/                    # Next.js app router
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ascii-renderer.tsx
│   ├── drop-zone.tsx
│   ├── export-panel.tsx
│   ├── quality-selector.tsx
│   └── video-ascii-player.tsx
├── lib/                   # Utility functions
│   └── ascii.ts          # ASCII conversion logic
├── tests/                 # Test files
│   ├── ascii.test.ts
│   └── video-ascii-player.test.tsx
└── docs/plans/           # Design documents
```

## How It Works

### Image Conversion

1. Draw image to HTML5 Canvas at target resolution
2. Extract pixel data using `getImageData()`
3. Calculate luminance for each pixel: `0.299*r + 0.587*g + 0.114*b`
4. Map luminance (0-255) to ASCII characters: `@%#*+=-:. `
5. Join rows with newlines to form final ASCII string

### Video Conversion

1. Extract frames at specified FPS using HTML5 Video API
2. Convert each frame to ASCII (same process as images)
3. Generate React component with `useEffect` timer for frame cycling
4. Component auto-plays with `setInterval` and loops infinitely

### Character Set

The converter uses 10 characters ordered by brightness:
```
@%#*+=-:.
```
(darkest to lightest)

## Limitations

- **Maximum 200 frames** for video conversion (to prevent browser memory issues)
- **Client-side only** - Processing speed depends on device performance
- **Black & White** - No color ASCII support (yet)

## License

MIT
