
import { useState, useRef, useEffect, useCallback } from 'react';
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

export function TaskCard({ task: initialTask, compact = false, className }: TaskCardProps) {
  const { updateTask, deleteTask, refreshTaskCounts } = useTaskStore();
  const { projects } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [task, setTask] = useState(initialTask);
  const [isExiting, setIsExiting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  // Use MutableRefObject type for completeTimeoutRef
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

  const finishExiting = useCallback(() => {
    console.log(`Animation ended for task ${task.id}, status: ${task.status}, isExiting: ${isExiting}`);
    if (isExiting) {
      setIsExiting(false);
      setIsRemoved(true);
      
      updateTask({ 
        id: task.id, 
        _isRemoved: true 
      });
      
      refreshTaskCounts();
      
      console.log(`Task ${task.id} animation complete, marked as removed`);
    }
  }, [task.id, task.status, isExiting, updateTask, refreshTaskCounts]);

  useEffect(() => {
    if (initialTask.id === task.id) {
      setTask(initialTask);
      
      if (initialTask.status === TaskStatus.DONE) {
        if (!isExiting && !isRemoved && !completeTimeoutRef.current) {
          setIsExiting(true);
        }
      } else {
        setIsExiting(false);
        setIsRemoved(false);
        
        if (initialTask._isRemoved) {
          updateTask({ id: task.id, _isRemoved: false });
          refreshTaskCounts();
        }
        
        if (completeTimeoutRef.current) {
          clearTimeout(completeTimeoutRef.current);
          completeTimeoutRef.current = null;
        }
      }
    }
  }, [initialTask, task.id, isExiting, isRemoved, updateTask, refreshTaskCounts]);
  
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

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleTaskClick = () => {
    setIsTaskFormOpen(true);
  };

  const shouldHideTask = task.status === TaskStatus.DONE && isRemoved;
  
  if (shouldHideTask) {
    console.log(`Task ${task.id} is hidden because it's done and removed`);
    return null;
  }

  console.log(`Rendering task ${task.id}, status: ${task.status}, isRemoved: ${isRemoved}, isExiting: ${isExiting}`);
  
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
        onAnimationEnd={finishExiting}
        aria-disabled={isExiting ? true : undefined}
      >
        <div className="flex items-start gap-2 p-2">
          <StatusCheckbox
            isDone={task.status === TaskStatus.DONE}
            isExiting={isExiting}
            isRemoved={isRemoved}
            isArchived={task.status === TaskStatus.ARCHIVED}
            completeTimeoutRef={completeTimeoutRef}
            onStatusClick={(e) => {
              e.stopPropagation();
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
            }}
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
      
      <TaskCardAnimation 
        isExiting={isExiting}
        finishExiting={finishExiting}
        EXIT_ANIMATION_DURATION={EXIT_ANIMATION_DURATION}
      />
    </>
  );
}
