
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
  const handleSelect = () => {
    console.log(`ProjectSelectorItem - Selected: ${id}, ${name}`);
    onSelect(id);
  };
  
  // This is the critical part - ensure we have a valid non-empty string value
  // Empty string values can cause iteration issues with the Command component
  const itemValue = id !== undefined && id !== '' ? id : 'no-project-id';
  
  return (
    <CommandItem
      className="flex items-center gap-2 cursor-pointer"
      onSelect={handleSelect}
      value={itemValue}
    >
      {color ? (
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: color }}
        />
      ) : icon ? (
        icon
      ) : null}
      
      <span>{name}</span>
      {isSelected && <Check className="ml-auto h-4 w-4" />}
    </CommandItem>
  );
}
