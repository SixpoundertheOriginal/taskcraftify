
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskForm } from './TaskForm';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  
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
        onClick={() => setIsTaskFormOpen(true)}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Add new task</span>
      </Button>
      
      <TaskForm 
        open={isTaskFormOpen} 
        onOpenChange={setIsTaskFormOpen} 
      />
    </>
  );
}
