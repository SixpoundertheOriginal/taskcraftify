
import { TaskView } from './TaskView';
import { memo } from 'react';

// This is a wrapper component to maintain backward compatibility
// while we transition to the new TaskView
export function TaskList() {
  return <TaskView />;
}

// Apply memo for performance optimization
export default memo(TaskList);
