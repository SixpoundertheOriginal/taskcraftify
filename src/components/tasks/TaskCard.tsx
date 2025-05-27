
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

  // Stable finishExiting callback that doesn't change unless absolutely necessary
  const finishExiting = useCallback(() => {
    console.log(`TaskCard: finishExiting called for task ${task.id}`);
    
    if (!isRemoved) {
      console.log(`TaskCard: Marking task ${task.id} as removed`);
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
    }
  }, [task.id, isRemoved, updateTask, refreshTaskCounts]);

  // Update task when initialTask changes (but avoid infinite loops)
  useEffect(() => {
    if (initialTask.id === task.id) {
      const hasChanged = JSON.stringify(initialTask) !== JSON.stringify(task);
      if (hasChanged) {
        setTask(initialTask);
      }
    }
  }, [initialTask.id, initialTask.status, initialTask.title, initialTask.description]);

  // Handle task status effects with better guards
  useEffect(() => {
    // Only trigger animation for newly completed tasks
    if (task.status === TaskStatus.DONE && !isExiting && !isRemoved) {
      console.log(`TaskCard: Task ${task.id} marked as done, starting animation`);
      setIsExiting(true);
    }
    // Reset animation states when task is no longer done
    else if (task.status !== TaskStatus.DONE && (isExiting || isRemoved)) {
      console.log(`TaskCard: Task ${task.id} no longer done, resetting states`);
      setIsExiting(false);
      setIsRemoved(false);
      
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    }
  }, [task.status, task.id]); // Removed isExiting and isRemoved from deps to prevent loops

  // Cleanup effect
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

  // Stable status click handler
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
  }, [task.id, task.title, task.status, lastClickTime]); // Removed isExiting and isRemoved from deps
  
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
      
      {/* Only render animation component when needed */}
      {isExiting && !isRemoved && (
        <TaskCardAnimation 
          isExiting={isExiting}
          finishExiting={finishExiting}
          EXIT_ANIMATION_DURATION={EXIT_ANIMATION_DURATION}
        />
      )}
    </>
  );
}

export const TaskCard = memo(TaskCardComponent);
