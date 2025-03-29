
import { UnifiedTaskForm } from '@/components/unified/TaskForm';
import { TaskStatus } from '@/types/task';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDueDate?: Date;
  initialStatus?: TaskStatus;
}

export function TaskForm({ open, onOpenChange, initialDueDate, initialStatus }: TaskFormProps) {
  return (
    <UnifiedTaskForm
      open={open}
      onOpenChange={onOpenChange}
      initialDueDate={initialDueDate}
      initialStatus={initialStatus}
    />
  );
}
