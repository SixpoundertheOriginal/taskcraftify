
import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Task, TaskStatus } from '@/types/task';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Partial<Task>;
  initialDueDate?: Date;
  taskToEdit?: Task;
  initialStatus?: TaskStatus;
}

export function TaskForm({ open, onOpenChange, initialTask, initialDueDate, taskToEdit, initialStatus }: TaskFormProps) {
  // This component now simply forwards to the UnifiedTaskForm component
  // This maintains backward compatibility with existing code
  
  return (
    <UnifiedTaskForm 
      open={open} 
      onOpenChange={onOpenChange} 
      initialTask={taskToEdit} 
      initialDueDate={initialDueDate}
      initialStatus={initialStatus}
    />
  );
}

// Import at the top to avoid circular dependencies
import { UnifiedTaskForm } from '@/components/unified/TaskForm';
