'use client';

import { cn } from '@/lib/utils';

type Quality = 's' | 'm' | 'l';

interface QualitySelectorProps {
  value: Quality;
  onChange: (quality: Quality) => void;
}

const QUALITY_OPTIONS: { value: Quality; label: string; width: number }[] = [
  { value: 's', label: 'S', width: 50 },
  { value: 'm', label: 'M', width: 100 },
  { value: 'l', label: 'L', width: 150 },
];

export function QualitySelector({ value, onChange }: QualitySelectorProps) {
  return (
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
  );
}

export const QUALITY_WIDTHS: Record<Quality, number> = {
  s: 50,
  m: 100,
  l: 150,
};
