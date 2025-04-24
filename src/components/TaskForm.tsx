
import { UnifiedTaskForm } from '@/components/unified/TaskForm';
import { TaskStatus } from '@/types/task';
import { ProjectSelector } from '@/components/tasks/ProjectSelector';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDueDate?: Date;
  initialStatus?: TaskStatus;
  initialProjectId?: string;
}

export function TaskForm({ open, onOpenChange, initialDueDate, initialStatus, initialProjectId }: TaskFormProps) {
  console.log("TaskForm wrapper - initialProjectId:", initialProjectId);
  
  return (
    <UnifiedTaskForm
      open={open}
      onOpenChange={onOpenChange}
      initialDueDate={initialDueDate}
      initialStatus={initialStatus}
      initialProjectId={initialProjectId}
    />
  );
}
