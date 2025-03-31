
import { TaskView } from '@/components/tasks/TaskView';
import { memo } from 'react';

// This is a wrapper to maintain backward compatibility with old imports
function TaskListComponent() {
  return <TaskView />;
}

// Apply memo for performance optimization
export const TaskList = memo(TaskListComponent);
