
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';

interface ProjectSelectorItemProps {
  id: string | undefined;
  name: string;
  color?: string;
  isSelected: boolean;
  onSelect: (id: string | undefined) => void;
  icon?: React.ReactNode;
}

export function ProjectSelectorItem({
  id,
  name,
  color,
  isSelected,
  onSelect,
  icon
}: ProjectSelectorItemProps) {
  // Ensure name is always a string
  const safeName = name || 'Unnamed Project';
  
  const handleSelect = () => {
    console.log(`ProjectSelectorItem - Selected: ${id}, ${safeName}`);
    onSelect(id);
  };
  
  // Generate a reliable value string even if id is undefined
  // This is critical for the Command component which needs a string value
  // Using random suffix to ensure uniqueness
  const safeValue = id || 
    `project-${safeName.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <CommandItem
      className="flex items-center gap-2 cursor-pointer"
      onSelect={handleSelect}
      value={safeValue}
    >
      {color ? (
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color }}
        />
      ) : icon ? (
        icon
      ) : null}
      
      <span>{safeName}</span>
      {isSelected && <Check className="ml-auto h-4 w-4" />}
    </CommandItem>
  );
}
