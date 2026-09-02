// Tooth Number Grid — checkbox grid for selecting affected teeth in Case records.
// Uses FDI notation: quadrants 11-18, 21-28, 31-38, 41-48.

"use client";

import { Checkbox } from "@/components/ui/checkbox";

const QUADRANTS = [
  { label: "Upper Right", teeth: [11, 12, 13, 14, 15, 16, 17, 18] },
  { label: "Upper Left", teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  { label: "Lower Left", teeth: [31, 32, 33, 34, 35, 36, 37, 38] },
  { label: "Lower Right", teeth: [41, 42, 43, 44, 45, 46, 47, 48] },
];

interface ToothNumberGridProps {
  selected: string;
  onChange: (teeth: string) => void;
  disabled?: boolean;
}

export function ToothNumberGrid({ selected, onChange, disabled }: ToothNumberGridProps) {
  const selectedSet = new Set(
    selected ? selected.split(",").map((t) => t.trim()) : []
  );

  function toggle(tooth: number) {
    const next = new Set(selectedSet);
    const key = tooth.toString();
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(Array.from(next).sort().join(","));
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {QUADRANTS.map((q) => (
        <div key={q.label} className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{q.label}</p>
          <div className="flex flex-wrap gap-1">
            {q.teeth.map((tooth) => {
              const key = tooth.toString();
              return (
                <label
                  key={tooth}
                  className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-medium transition-colors cursor-pointer select-none ${
                    selectedSet.has(key)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-foreground hover:bg-muted"
                  } ${disabled ? "pointer-events-none opacity-50" : ""}`}
                >
                  <Checkbox
                    checked={selectedSet.has(key)}
                    onCheckedChange={() => toggle(tooth)}
                    disabled={disabled}
                    className="sr-only"
                  />
                  {tooth}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
