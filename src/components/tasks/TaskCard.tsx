
import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
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
import { handleStatusClick } from "./TaskStatusHandler";

const EXIT_ANIMATION_DURATION = 3000;

export interface TaskCardProps {
  task: Task;
  compact?: boolean;
  className?: string;
}

function TaskCardComponent({ task, compact = false, className }: TaskCardProps) {
  const { updateTask, deleteTask, refreshTaskCounts } = useTaskStore();
  const { projects } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Stabilize the sortable data object to prevent infinite re-renders
  const sortableData = useMemo(() => ({
    type: 'task' as const,
    taskId: task.id
  }), [task.id]);

  // Use stable sortable configuration
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    data: sortableData
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Stable finishExiting callback
  const finishExiting = useCallback(() => {
    console.log(`TaskCard: finishExiting called for task ${task.id}`);
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    setIsRemoved(true);
    
    updateTask({ 
      id: task.id, 
      _isRemoved: true 
    }).then(() => {
      refreshTaskCounts();
    }).catch((error) => {
      console.error('Failed to mark task as removed:', error);
      setIsRemoved(false);
    });
  }, [task.id, updateTask, refreshTaskCounts]);

  // Simplified animation effect
  useEffect(() => {
    if (task.status === TaskStatus.DONE && !isExiting && !isRemoved) {
      console.log(`TaskCard: Starting exit animation for task ${task.id}`);
      setIsExiting(true);
      
      if (!animationTimeoutRef.current) {
        animationTimeoutRef.current = setTimeout(finishExiting, EXIT_ANIMATION_DURATION);
      }
    }
    
    if (task.status !== TaskStatus.DONE && isExiting) {
      console.log(`TaskCard: Stopping animation for task ${task.id}`);
      setIsExiting(false);
      setIsRemoved(false);
      
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    }
  }, [task.status, task.id, isExiting, isRemoved, finishExiting]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
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

  // Simplified setTask function - just a no-op since we don't need local state
  const setTask = useCallback(() => {
    // No-op - we're using the task from props directly
  }, []);

  // Status click handler
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
  }, [task.id, task.title, task.status, lastClickTime, isExiting, isRemoved, updateTask, refreshTaskCounts, setTask]);
  
  // Don't render if task is done and removed
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
    </>
  );
}

// Simplified memo comparison - only check essential properties that would require a re-render
export const TaskCard = memo(TaskCardComponent, (prevProps, nextProps) => {
  // Only re-render if the task ID changes (which should never happen) or essential properties change
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.compact === nextProps.compact &&
    prevProps.className === nextProps.className
  );
});
