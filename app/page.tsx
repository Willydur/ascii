'use client';

import { useState, useEffect, useCallback } from 'react';
import { DropZone } from '@/components/drop-zone';
import { QualitySelector, QUALITY_WIDTHS, type FpsOption } from '@/components/quality-selector';
import { ExportPanel } from '@/components/export-panel';
import { AsciiRenderer } from '@/components/ascii-renderer';
import { VideoAsciiPlayer } from '@/components/video-ascii-player';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { imageToAscii, generateReactComponent, extractVideoFrames, framesToAscii, generateAnimatedReactComponent } from '@/lib/ascii';

type Quality = 's' | 'm' | 'l';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [ascii, setAscii] = useState<string>('');
  const [quality, setQuality] = useState<Quality>('m');
  const [isVideo, setIsVideo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  // Video animation state
  const [fps, setFps] = useState<FpsOption>(2);
  const [asciiFrames, setAsciiFrames] = useState<string[]>([]);
  const [isProcessingFrames, setIsProcessingFrames] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setIsVideo(selectedFile.type.startsWith('video/'));
    setError('');
    // Clear video animation state when file changes
    setAsciiFrames([]);
    setFps(2);
    setProcessingProgress({ current: 0, total: 0 });

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

          // Calculate total frames
          const totalFrames = Math.floor(video.duration * fps);

          if (totalFrames > 200) {
            throw new Error(
              `Frame count (${totalFrames}) exceeds maximum (200). Try a lower FPS or shorter video.`
            );
          }

          // Extract and process frames
          setIsProcessingFrames(true);
          setProcessingProgress({ current: 0, total: totalFrames });

          const frameCanvases = await extractVideoFrames(video, fps);

          const asciiFramesResult = await framesToAscii(
            frameCanvases,
            QUALITY_WIDTHS[quality],
            (current, total) => {
              setProcessingProgress({ current, total });
            }
          );

          setAsciiFrames(asciiFramesResult);
          setAscii(asciiFramesResult[0] || '');
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
        setAsciiFrames([]);
      } finally {
        setIsProcessing(false);
        setIsProcessingFrames(false);
      }
    };

    process();
  }, [dataUrl, quality, isVideo, fps]);

  const componentName = file
    ? file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '') + 'Ascii'
    : 'AsciiArt';

  // Use animated component generator for videos, static for images
  const exportCode = isVideo && asciiFrames.length > 0
    ? generateAnimatedReactComponent(asciiFrames, fps, componentName)
    : generateReactComponent(ascii, componentName);

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
                    setAsciiFrames([]);
                    setFps(2);
                    setProcessingProgress({ current: 0, total: 0 });
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QualitySelector
                value={quality}
                onChange={setQuality}
                fps={fps}
                onFpsChange={setFps}
                showFps={isVideo}
              />

              {isProcessing && (
                <div className="text-center py-8 text-muted-foreground">
                  {isProcessingFrames ? (
                    <div className="space-y-2">
                      <p>Processing frames...</p>
                      <div className="w-full max-w-md mx-auto bg-muted rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{
                            width: `${processingProgress.total > 0 ? (processingProgress.current / processingProgress.total) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <p className="text-sm">
                        {processingProgress.current} / {processingProgress.total} frames
                      </p>
                    </div>
                  ) : (
                    'Processing...'
                  )}
                </div>
              )}

              {!isProcessing && ascii && (
                <>
                  {isVideo && asciiFrames.length > 0 ? (
                    <VideoAsciiPlayer
                      videoSrc={dataUrl}
                      frames={asciiFrames}
                      fps={fps}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Original</p>
                        <img
                          src={dataUrl}
                          alt="Original"
                          className="max-w-full rounded-md"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">ASCII</p>
                        <AsciiRenderer content={ascii} />
                      </div>
                    </div>
                  )}
                </>
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
