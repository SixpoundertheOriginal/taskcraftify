
import { TaskCard as UnifiedTaskCard } from '@/components/tasks/TaskCard';
import { Task } from '@/types/task';
import { memo } from 'react';

interface TaskCardProps {
  task: Task;
}

// This is a wrapper for backwards compatibility
// It ensures existing code that imports from this path still works
function TaskCardComponent({ task }: TaskCardProps) {
  return <UnifiedTaskCard task={task} />;
}

// Apply memo to prevent unnecessary rerenders
export const TaskCard = memo(TaskCardComponent);
