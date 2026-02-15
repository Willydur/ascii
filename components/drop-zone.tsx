"use client";

import { useCallback } from "react";
import { UploadIcon } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export function DropZone({
  onFileSelect,
  accept = "image/*,video/*",
}: DropZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

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
        <p className="text-sm text-muted-foreground mt-2">or click to browse</p>
      </label>
    </div>
  );
}
