
import { memo, useEffect } from 'react';
import { useTaskStore } from '@/store';
import { TaskGroup } from './TaskGroup';
import { TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';

export function TaskList() {
  const taskStore = useTaskStore();
  const filteredTasks = taskStore.getFilteredTasks();
  
  // Refresh task counts when the component mounts or tasks change
  useEffect(() => {
    taskStore.refreshTaskCounts();
  }, [taskStore.tasks]);

  // Group tasks by status
  const todoTasks = filteredTasks.filter(task => task.status === TaskStatus.TODO);
  const inProgressTasks = filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const doneTasks = filteredTasks.filter(task => task.status === TaskStatus.DONE);
  const backlogTasks = filteredTasks.filter(task => task.status === TaskStatus.BACKLOG);
  
  return (
    <div className="space-y-8 mb-8 px-1">
      <TaskGroup 
        title="To Do" 
        count={todoTasks.length}
        status={TaskStatus.TODO}
        isEmpty={todoTasks.length === 0}
        emptyState={<p className="text-sm text-muted-foreground py-4 text-center bg-white">No tasks to do</p>}
        className="bg-white rounded-md p-3 shadow-sm"
      >
        {todoTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskGroup>
      
      <TaskGroup 
        title="In Progress" 
        count={inProgressTasks.length}
        status={TaskStatus.IN_PROGRESS}
        isEmpty={inProgressTasks.length === 0}
        emptyState={<p className="text-sm text-muted-foreground py-4 text-center bg-white">No tasks in progress</p>}
        className="bg-white rounded-md p-3 shadow-sm"
      >
        {inProgressTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskGroup>
      
      <TaskGroup 
        title="Done" 
        count={doneTasks.length}
        status={TaskStatus.DONE}
        isEmpty={doneTasks.length === 0}
        emptyState={<p className="text-sm text-muted-foreground py-4 text-center bg-white">No completed tasks</p>}
        className="bg-white rounded-md p-3 shadow-sm"
      >
        {doneTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskGroup>
      
      <TaskGroup 
        title="Backlog" 
        count={backlogTasks.length}
        status={TaskStatus.BACKLOG}
        isEmpty={backlogTasks.length === 0}
        emptyState={<p className="text-sm text-muted-foreground py-4 text-center bg-white">Backlog is empty</p>}
        className="bg-white rounded-md p-3 shadow-sm"
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
