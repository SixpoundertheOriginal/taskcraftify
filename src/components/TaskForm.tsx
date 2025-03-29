
import { UnifiedTaskForm } from '@/components/unified/TaskForm';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDueDate?: Date;
}

export function TaskForm({ open, onOpenChange, initialDueDate }: TaskFormProps) {
  return (
    <UnifiedTaskForm
      open={open}
      onOpenChange={onOpenChange}
      initialDueDate={initialDueDate}
    />
  );
}
