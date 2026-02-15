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
