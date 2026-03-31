"use client";

export type CategoryFilter = "200km" | "100km" | "50km";

const CATEGORY_OPTIONS: Array<{ value: CategoryFilter; label: string; color: string }> = [
  { value: "200km", label: "200km", color: "#22d3ee" },
  { value: "100km", label: "100km", color: "#4ade80" },
  { value: "50km", label: "50km", color: "#fb923c" },
];

interface CategoryFilterBarProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

export function CategoryFilterBar({ value, onChange }: CategoryFilterBarProps) {
  return (
    <div className="sticky top-0 z-30 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-md border-b border-border/40">
      <div className="flex items-center gap-2">
        {CATEGORY_OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`relative rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${
                isActive
                  ? "text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: opt.color,
                      color: "#000",
                      boxShadow: `0 0 12px ${opt.color}40`,
                    }
                  : undefined
              }
            >
              {opt.label}
              {isActive && (
                <span
                  className="absolute inset-x-2 -bottom-1.5 h-0.5 rounded-full"
                  style={{ backgroundColor: opt.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
