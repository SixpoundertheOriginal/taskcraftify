
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PROJECT_COLORS = [
  '#6E59A5', // Purple
  '#7047EB', // Vivid Purple
  '#D946EF', // Magenta
  '#EC4899', // Pink
  '#F97316', // Orange
  '#FBBF24', // Yellow
  '#10B981', // Emerald
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#475569', // Slate
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "w-8 h-8 rounded-full transition-all border-2 hover:scale-110",
            value === color ? "border-primary ring-2 ring-primary/20" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
