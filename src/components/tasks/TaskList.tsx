
import { memo } from 'react';
import { useTaskStore } from '@/store';
import { TaskGroup } from './TaskGroup';
import { TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';

export function TaskList() {
  const taskStore = useTaskStore();
  const filteredTasks = taskStore.getFilteredTasks();

  // Group tasks by status
  const todoTasks = filteredTasks.filter(task => task.status === TaskStatus.TODO);
  const inProgressTasks = filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const doneTasks = filteredTasks.filter(task => task.status === TaskStatus.DONE);
  const backlogTasks = filteredTasks.filter(task => task.status === TaskStatus.BACKLOG);
  
  return (
    <div className="space-y-8 mb-8">
      <TaskGroup 
        title="To Do" 
        count={todoTasks.length}
        isEmpty={todoTasks.length === 0}
        emptyState={<p className="text-sm text-muted-foreground py-4 text-center">No tasks to do</p>}
      >
        {todoTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskGroup>
      
      <TaskGroup 
        title="In Progress" 
        count={inProgressTasks.length}
        isEmpty={inProgressTasks.length === 0}
        emptyState={<p className="text-sm text-muted-foreground py-4 text-center">No tasks in progress</p>}
      >
        {inProgressTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskGroup>
      
      <TaskGroup 
        title="Done" 
        count={doneTasks.length}
        isEmpty={doneTasks.length === 0}
        emptyState={<p className="text-sm text-muted-foreground py-4 text-center">No completed tasks</p>}
      >
        {doneTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskGroup>
      
      <TaskGroup 
        title="Backlog" 
        count={backlogTasks.length}
        isEmpty={backlogTasks.length === 0}
        emptyState={<p className="text-sm text-muted-foreground py-4 text-center">Backlog is empty</p>}
      >
        {backlogTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskGroup>
    </div>
  );
}

// Apply memo for performance optimization
export default memo(TaskList);
