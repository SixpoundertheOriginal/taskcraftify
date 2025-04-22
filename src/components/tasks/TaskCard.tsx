import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Check,
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Tag,
  Clock,
  Flag,
  Circle,
  CheckCircle,
  CircleDashed,
  AlertCircle
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { countCompletedSubtasks } from '@/types/task';
import { useTaskStore } from '@/store';
import { useProjectStore } from '@/store';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { StatusCheckbox } from "./StatusCheckbox";
import { TaskCardHeader } from "./TaskCardHeader";
import { TaskCardDetails } from "./TaskCardDetails";
import { TaskCardActions } from "./TaskCardActions";

const EXIT_ANIMATION_DURATION = 3000;

export interface TaskCardProps {
  task: Task;
  compact?: boolean;
  className?: string;
}

export function TaskCard({ task: initialTask, compact = false, className }: TaskCardProps) {
  const { updateTask, deleteTask } = useTaskStore();
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
    isDragging
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

  const { completed, total } = countCompletedSubtasks(task);
  
  const finishExiting = () => {
    console.log(`Animation ended for task ${task.id}, status: ${task.status}, isExiting: ${isExiting}`);
    if (isExiting) {
      setIsExiting(false);
      setIsRemoved(true);
      console.log(`Task ${task.id} animation complete, marked as removed`);
    }
  };

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
        if (completeTimeoutRef.current) {
          clearTimeout(completeTimeoutRef.current);
          completeTimeoutRef.current = null;
        }
      }
    }
  }, [initialTask]);
  
  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
      }
    };
  }, []);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === TaskStatus.ARCHIVED) return;

    const currentTime = new Date().getTime();
    const isDoubleClick = currentTime - lastClickTime < 350;
    setLastClickTime(currentTime);

    if ((isDoubleClick || isExiting) && task.status === TaskStatus.DONE) {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
      
      console.log(`Undoing completion for task ${task.id}`);
      setTask(prevTask => ({ ...prevTask, status: TaskStatus.TODO }));
      setIsExiting(false);
      setIsRemoved(false);

      updateTask({ id: task.id, status: TaskStatus.TODO })
        .then(() => {
          toast({
            title: "Task restored",
            description: `"${task.title}" moved back to todo.`,
            variant: "default"
          });
        })
        .catch(() => {
          setTask(prevTask => ({ ...prevTask, status: TaskStatus.DONE }));
          setIsExiting(false);
          setIsRemoved(false);
          toast({
            title: "Restore failed",
            description: "Failed to restore task. Please try again.",
            variant: "destructive"
          });
        });
      return;
    }

    if (task.status !== TaskStatus.DONE) {
      console.log(`Marking task ${task.id} as done`);
      
      setTask(prevTask => ({
        ...prevTask,
        status: TaskStatus.DONE
      }));
      setIsExiting(true);
      setIsRemoved(false);

      completeTimeoutRef.current = setTimeout(() => {
        console.log(`Timeout completed for task ${task.id}, sending API update`);
        updateTask({ id: task.id, status: TaskStatus.DONE })
          .then(() => {
            toast({
              title: "Task completed",
              description: `"${task.title}" has been marked as done.`,
              variant: "default"
            });
            completeTimeoutRef.current = null;
          })
          .catch(() => {
            setTask(prevTask => ({ ...prevTask, status: TaskStatus.TODO }));
            setIsExiting(false);
            setIsRemoved(false);
            completeTimeoutRef.current = null;
            toast({
              title: "Status update failed",
              description: "Failed to update task status. Please try again.",
              variant: "destructive"
            });
          });
      }, EXIT_ANIMATION_DURATION);
      return;
    }

    if (task.status === TaskStatus.DONE && !completeTimeoutRef.current) {
      console.log(`Reopening already-done task ${task.id}`);
      setIsRemoved(false);
      setTask(prevTask => ({
        ...prevTask,
        status: TaskStatus.TODO
      }));
      updateTask({ id: task.id, status: TaskStatus.TODO })
        .then(() => {
          toast({
            title: "Task reopened",
            description: `"${task.title}" has been marked as to do.`,
            variant: "default"
          });
        })
        .catch(() => {
          setTask(prevTask => ({ ...prevTask, status: TaskStatus.DONE }));
          setIsRemoved(true);
          toast({
            title: "Status update failed", 
            description: "Failed to update task status. Please try again.",
            variant: "destructive"
          });
        });
      return;
    }
  };

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
          "bg-[hsl(var(--card))] text-card-foreground",
          isDragging && "shadow-lg z-50 opacity-90",
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
            onStatusClick={handleStatusClick}
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
      <style>
        {`
        @keyframes fade-slide-out {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 0.8;
            transform: translateY(0.25rem);
          }
          100% {
            opacity: 0;
            transform: translateY(0.5rem);
          }
        }
        .animate-fade-slide-out {
          animation: fade-slide-out ${EXIT_ANIMATION_DURATION}ms cubic-bezier(0.4,0,0.2,1);
        }
        `}
      </style>
    </>
  );
}
