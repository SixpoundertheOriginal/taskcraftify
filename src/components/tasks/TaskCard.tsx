
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Task, TaskStatus } from '@/types/task';
import { useTaskStore } from '@/store';
import { useProjectStore } from '@/store';
import { TaskForm } from '@/components/tasks/TaskForm';
import { StatusCheckbox } from "./StatusCheckbox";
import { TaskCardHeader } from "./TaskCardHeader";
import { TaskCardDetails } from "./TaskCardDetails";
import { TaskCardActions } from "./TaskCardActions";
import { TaskCardAnimation } from "./TaskCardAnimation";
import { handleStatusClick } from "./TaskStatusHandler";

const EXIT_ANIMATION_DURATION = 3000;

export interface TaskCardProps {
  task: Task;
  compact?: boolean;
  className?: string;
}

function TaskCardComponent({ task: initialTask, compact = false, className }: TaskCardProps) {
  const { updateTask, deleteTask, refreshTaskCounts } = useTaskStore();
  const { projects } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [task, setTask] = useState(initialTask);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Memoize the finishExiting callback to prevent it from changing on every render
  const finishExiting = useCallback(() => {
    if (isExiting && !isRemoved) {
      console.log(`Animation ended for task ${task.id}, marking as removed`);
      setIsRemoved(true);
      
      updateTask({ 
        id: task.id, 
        _isRemoved: true 
      }).then(() => {
        refreshTaskCounts();
      });
    }
  }, [task.id, isExiting, isRemoved, updateTask, refreshTaskCounts]);

  // Handle initialTask updates separately from state updates
  useEffect(() => {
    if (initialTask.id === task.id && 
        JSON.stringify(initialTask) !== JSON.stringify(task)) {
      setTask(initialTask);
    }
  }, [initialTask, task.id]);

  // Handle task status changes with clear conditions to prevent loops
  useEffect(() => {
    // Only transition to exiting state once and only if not already removed
    if (task.status === TaskStatus.DONE && !isExiting && !isRemoved && !completeTimeoutRef.current) {
      setIsExiting(true);
    } 
    // Reset states when task is no longer DONE
    else if (task.status !== TaskStatus.DONE && (isExiting || isRemoved)) {
      setIsExiting(false);
      setIsRemoved(false);
      
      // Only update in the database if needed
      if (task._isRemoved) {
        updateTask({ id: task.id, _isRemoved: false })
          .then(() => refreshTaskCounts());
      }
      
      // Always clean up timeout
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    }
  }, [task.status, isExiting, isRemoved, task.id, task._isRemoved, updateTask, refreshTaskCounts]);

  // Dedicated cleanup effect
  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    };
  }, []);

  const projectName = task.projectId 
    ? projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'
    : null;

  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  const handleTaskClick = useCallback(() => {
    setIsTaskFormOpen(true);
  }, []);

  // Memoized handler for status changes to prevent recreation on each render
  const handleStatusClickCallback = useCallback((e: React.MouseEvent) => {
    handleStatusClick({
      taskId: task.id,
      taskTitle: task.title,
      currentStatus: task.status,
      isExiting,
      isRemoved,
      lastClickTime,
      completeTimeoutRef,
      updateTask,
      refreshTaskCounts,
      setTask,
      setIsExiting,
      setIsRemoved,
      setLastClickTime
    });
  }, [task.id, task.title, task.status, isExiting, isRemoved, lastClickTime, updateTask, refreshTaskCounts]);
  
  // If task is done and removed, don't render it
  if (task.status === TaskStatus.DONE && isRemoved) {
    return null;
  }
  
  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "group relative flex flex-col rounded-md border shadow-sm transition-all cursor-pointer",
          "hover:shadow-md",
          "bg-white text-card-foreground",
          "border-gray-200",
          className,
          isExiting && "animate-fade-slide-out"
        )}
        onClick={handleTaskClick}
        tabIndex={0}
        aria-disabled={isExiting ? true : undefined}
      >
        <div className="flex items-start gap-2 p-2">
          <StatusCheckbox
            isDone={task.status === TaskStatus.DONE}
            isExiting={isExiting}
            isRemoved={isRemoved}
            isArchived={task.status === TaskStatus.ARCHIVED}
            completeTimeoutRef={completeTimeoutRef}
            onStatusClick={handleStatusClickCallback}
          />
          <div className="flex-1 min-w-0">
            <TaskCardHeader
              title={task.title}
              isDone={task.status === TaskStatus.DONE}
              isExpanded={isExpanded}
              onToggleExpanded={toggleExpanded}
            />
            <TaskCardDetails
              task={task}
              projectName={projectName}
              isExpanded={isExpanded}
              compact={compact}
            />
            <TaskCardActions
              task={task}
              setTask={setTask}
              setIsExiting={setIsExiting}
              setIsRemoved={setIsRemoved}
              updateTask={updateTask}
              deleteTask={deleteTask}
            />
          </div>
        </div>
      </div>
      
      <TaskForm 
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        initialTask={task}
      />
      
      {isExiting && (
        <TaskCardAnimation 
          isExiting={isExiting}
          finishExiting={finishExiting}
          EXIT_ANIMATION_DURATION={EXIT_ANIMATION_DURATION}
        />
      )}
    </>
  );
}

// Apply memoization to prevent unnecessary re-renders
export const TaskCard = memo(TaskCardComponent);
