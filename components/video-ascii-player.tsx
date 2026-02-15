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
    if (frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame((f) => (f + 1) % frames.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [frames.length, fps]);

  if (frames.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Original Video</p>
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          muted
          loop
          className="w-full rounded-md border"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">ASCII Animation</p>
          <p className="text-xs text-muted-foreground">
            Frame {currentFrame + 1} of {frames.length}
          </p>
        </div>
        <AsciiRenderer content={frames[currentFrame]} className="h-full min-h-[200px]" />
      </div>
    </div>
  );
}
