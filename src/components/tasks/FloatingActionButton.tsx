
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskForm } from './TaskForm';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  className?: string;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  initialDueDate?: Date;
}

export function FloatingActionButton({ 
  className,
  open,
  onOpenChange,
  initialDueDate 
}: FloatingActionButtonProps) {
  // Use internal state if external state is not provided
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Determine if we should use internal or external state
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isTaskFormOpen = isControlled ? open : internalIsOpen;
  
  const handleOpenChange = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalIsOpen(value);
    }
  };
  
  return (
    <>
      <Button
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl",
          "transition-all duration-200 hover:scale-105 active:scale-95 z-50",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          className
        )}
        onClick={() => handleOpenChange(true)}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Add new task</span>
      </Button>
      
      <TaskForm 
        open={isTaskFormOpen} 
        onOpenChange={handleOpenChange}
        initialDueDate={initialDueDate}
      />
    </>
  );
}
