
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskForm } from './TaskForm';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();
  
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
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl",
          "transition-all duration-300 hover:scale-110 active:scale-95 z-50",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "fixed bottom-6 right-6", // Always fixed position for all screen sizes
          "animate-fade-in",
          isHovered ? "shadow-xl shadow-primary/20" : "",
          className
        )}
        onClick={() => handleOpenChange(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Plus className={cn(
          "h-6 w-6 transition-transform duration-300",
          isHovered ? "rotate-90" : ""
        )} />
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
