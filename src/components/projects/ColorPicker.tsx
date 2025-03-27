
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
  '#84cc16', // Lime
  '#ef4444', // Red
  '#64748b', // Slate
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#14b8a6', // Teal
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(value);
  
  // Update internal state when external value changes
  useEffect(() => {
    setSelectedColor(value);
  }, [value]);
  
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onChange(color);
  };
  
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {PROJECT_COLORS.map((color) => (
        <motion.button
          key={color}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative h-8 w-8 rounded-full transition-all border-2",
            selectedColor === color ? "border-primary ring-2 ring-primary/20" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          onClick={() => handleColorSelect(color)}
          aria-label={`Select color ${color}`}
        >
          {selectedColor === color && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check className="h-4 w-4 text-white drop-shadow-sm" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}
