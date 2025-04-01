
import { UnifiedTaskForm } from '@/components/unified/TaskForm';
import { Task, TaskStatus } from '@/types/task';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Task;
  initialDueDate?: Date;
  initialStatus?: TaskStatus;
}

export function TaskForm({ open, onOpenChange, initialTask, initialDueDate, initialStatus }: TaskFormProps) {
  return (
    <UnifiedTaskForm
      open={open}
      onOpenChange={onOpenChange}
      initialTask={initialTask}
      initialDueDate={initialDueDate}
      initialStatus={initialStatus}
    />
  );
}
