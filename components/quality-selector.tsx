'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

type Quality = 's' | 'm' | 'l';
export type FpsOption = 1 | 2 | 5 | 10;

interface QualitySelectorProps {
  value: Quality;
  onChange: (quality: Quality) => void;
  fps?: FpsOption;
  onFpsChange?: (fps: FpsOption) => void;
  showFps?: boolean;
}

const QUALITY_OPTIONS: { value: Quality; label: string; width: number }[] = [
  { value: 's', label: 'S', width: 50 },
  { value: 'm', label: 'M', width: 100 },
  { value: 'l', label: 'L', width: 150 },
];

const FPS_OPTIONS: FpsOption[] = [1, 2, 5, 10];

export function QualitySelector({
  value,
  onChange,
  fps = 5,
  onFpsChange,
  showFps = false,
}: QualitySelectorProps) {
  return (
    <div className="flex flex-col gap-4">
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

      {showFps && onFpsChange && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium mr-2">FPS:</Label>
          <div className="flex rounded-md border border-border overflow-hidden">
            {FPS_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onFpsChange(option)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  fps === option
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            Higher FPS = smoother animation but larger file size
          </span>
        </div>
      )}
    </div>
  );
}

export const QUALITY_WIDTHS: Record<Quality, number> = {
  s: 50,
  m: 100,
  l: 150,
};
