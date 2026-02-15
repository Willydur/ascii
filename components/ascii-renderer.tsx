"use client";

import { cn } from "@/lib/utils";

interface AsciiRendererProps {
  content: string;
  className?: string;
}

export function AsciiRenderer({ content, className }: AsciiRendererProps) {
  return (
    <pre
      className={cn(
        "font-mono text-xs leading-none whitespace-pre overflow-auto",
        "bg-muted p-4 rounded-md",
        className,
      )}
    >
      {content}
    </pre>
  );
}
