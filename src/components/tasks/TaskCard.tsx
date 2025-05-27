
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

function TaskCardComponent({ task: initialTask, compact = false, className }: TaskCardProps) {
  const { updateTask, deleteTask, refreshTaskCounts } = useTaskStore();
  const { projects } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use a stable reference to the task to prevent sortable re-initialization
  const taskRef = useRef(initialTask);
  const [localTaskUpdates, setLocalTaskUpdates] = useState<Partial<Task>>({});
  
  // Update the ref when the task prop changes
  useEffect(() => {
    taskRef.current = initialTask;
    // Clear local updates when parent task changes
    setLocalTaskUpdates({});
  }, [initialTask]);
  
  // Merge task with local updates for rendering
  const currentTask = useMemo(() => ({
    ...taskRef.current,
    ...localTaskUpdates
  }), [localTaskUpdates]);
  
  // Stable sortable configuration
  const sortableConfig = useMemo(() => ({
    id: initialTask.id,
    data: {
      type: 'task',
      taskId: initialTask.id
    }
  }), [initialTask.id]);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable(sortableConfig);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Stable finishExiting callback
  const finishExiting = useCallback(() => {
    console.log(`TaskCard: finishExiting called for task ${currentTask.id}`);
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    setIsRemoved(true);
    
    updateTask({ 
      id: currentTask.id, 
      _isRemoved: true 
    }).then(() => {
      refreshTaskCounts();
    }).catch((error) => {
      console.error('Failed to mark task as removed:', error);
      setIsRemoved(false);
    });
  }, [currentTask.id, updateTask, refreshTaskCounts]);

  // Animation effect
  useEffect(() => {
    if (currentTask.status === TaskStatus.DONE && !isExiting && !isRemoved) {
      console.log(`TaskCard: Starting exit animation for task ${currentTask.id}`);
      setIsExiting(true);
      
      if (!animationTimeoutRef.current) {
        animationTimeoutRef.current = setTimeout(finishExiting, EXIT_ANIMATION_DURATION);
      }
    }
    
    if (currentTask.status !== TaskStatus.DONE && isExiting) {
      console.log(`TaskCard: Stopping animation for task ${currentTask.id}`);
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
  }, [currentTask.status, isExiting, isRemoved, finishExiting]);

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

  const projectName = useMemo(() => {
    return currentTask.projectId 
      ? projects.find(p => p.id === currentTask.projectId)?.name || 'Unknown Project'
      : null;
  }, [currentTask.projectId, projects]);

  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  const handleTaskClick = useCallback(() => {
    setIsTaskFormOpen(true);
  }, []);

  // Updated setTask function to work with local updates
  const setTask = useCallback((updateOrFunction: Partial<Task> | ((prev: Task) => Task)) => {
    if (typeof updateOrFunction === 'function') {
      const updatedTask = updateOrFunction(currentTask);
      setLocalTaskUpdates(prev => ({
        ...prev,
        ...updatedTask
      }));
    } else {
      setLocalTaskUpdates(prev => ({
        ...prev,
        ...updateOrFunction
      }));
    }
  }, [currentTask]);

  // Status click handler
  const handleStatusClickCallback = useCallback((e: React.MouseEvent) => {
    handleStatusClick({
      taskId: currentTask.id,
      taskTitle: currentTask.title,
      currentStatus: currentTask.status,
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
  }, [currentTask.id, currentTask.title, currentTask.status, lastClickTime, isExiting, isRemoved, updateTask, refreshTaskCounts, setTask]);
  
  // Don't render if task is done and removed
  if (currentTask.status === TaskStatus.DONE && isRemoved) {
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
            isDone={currentTask.status === TaskStatus.DONE}
            isExiting={isExiting}
            isRemoved={isRemoved}
            isArchived={currentTask.status === TaskStatus.ARCHIVED}
            completeTimeoutRef={completeTimeoutRef}
            onStatusClick={handleStatusClickCallback}
          />
          <div className="flex-1 min-w-0">
            <TaskCardHeader
              title={currentTask.title}
              isDone={currentTask.status === TaskStatus.DONE}
              isExpanded={isExpanded}
              onToggleExpanded={toggleExpanded}
            />
            <TaskCardDetails
              task={currentTask}
              projectName={projectName}
              isExpanded={isExpanded}
              compact={compact}
            />
            <TaskCardActions
              task={currentTask}
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
        initialTask={currentTask}
      />
    </>
  );
}

export const TaskCard = memo(TaskCardComponent, (prevProps, nextProps) => {
  // Only re-render if essential task properties change
  return prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.updatedAt === nextProps.task.updatedAt &&
    prevProps.compact === nextProps.compact &&
    prevProps.className === nextProps.className;
});
