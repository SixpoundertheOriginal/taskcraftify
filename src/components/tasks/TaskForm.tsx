
import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Task } from '@/types/task';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Partial<Task>;
  initialDueDate?: Date;
  taskToEdit?: Task;
}

export function TaskForm({ open, onOpenChange, initialTask, initialDueDate, taskToEdit }: TaskFormProps) {
  // This component now simply forwards to the UnifiedTaskForm component
  // This maintains backward compatibility with existing code
  
  return (
    <UnifiedTaskForm 
      open={open} 
      onOpenChange={onOpenChange} 
      initialTask={taskToEdit} 
      initialDueDate={initialDueDate}
    />
  );
}

// Import at the top to avoid circular dependencies
import { UnifiedTaskForm } from '@/components/unified/TaskForm';
