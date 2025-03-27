
import { TaskCard as UnifiedTaskCard } from '@/components/tasks/TaskCard';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
}

// This is a wrapper for backwards compatibility
// It ensures existing code that imports from this path still works
export function TaskCard({ task }: TaskCardProps) {
  return <UnifiedTaskCard task={task} />;
}
