
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ColorSelectorProps {
  value: string;
  onChange: (color: string) => void;
  colors: string[];
}

export function ColorSelector({ value, onChange, colors }: ColorSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-transform",
            value === color ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : ""
          )}
          style={{ backgroundColor: color }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            onChange(color);
          }}
        >
          {value === color && <Check className="h-4 w-4 text-white" />}
        </button>
      ))}
    </div>
  );
}
