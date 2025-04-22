
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
      // Simply mark as removed when the animation completes
      setIsExiting(false);
      setIsRemoved(true);
      console.log(`Task ${task.id} animation complete, marked as removed`);
    }
  };

  // Synchronize with initialTask prop changes
  useEffect(() => {
    if (initialTask.id === task.id) {
      // Always update the task state with the latest from props
      console.log(`Task ${initialTask.id} updated from props, status: ${initialTask.status}`);
      setTask(initialTask);
      
      // Handle DONE status specifically
      if (initialTask.status === TaskStatus.DONE) {
        if (!isExiting && !isRemoved && !completeTimeoutRef.current) {
          // Initiate exit animation for newly completed tasks
          console.log(`Task ${initialTask.id} is now DONE, starting exit animation`);
          setIsExiting(true);
        }
      } else {
        // Reset states when a task is no longer DONE
        console.log(`Task ${initialTask.id} is not DONE anymore, resetting states`);
        setIsExiting(false);
        setIsRemoved(false);
        if (completeTimeoutRef.current) {
          clearTimeout(completeTimeoutRef.current);
          completeTimeoutRef.current = null;
        }
      }
    }
  }, [initialTask]);
  
  // Cleanup timeouts on unmount
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

    // Handle double-click to undo completion
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

    // Handle marking a task as done
    if (task.status !== TaskStatus.DONE) {
      console.log(`Marking task ${task.id} as done`);
      
      // Update local state immediately for UI feedback
      setTask(prevTask => ({
        ...prevTask,
        status: TaskStatus.DONE
      }));
      setIsExiting(true);
      setIsRemoved(false);

      // Delay the API call until animation completes
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
            // We don't need to set isRemoved here anymore - the animation finishExiting handler will do that
          })
          .catch(() => {
            // Revert state on error
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

    // Handle reopening a done task
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

  function StatusCheckbox() {
    const isDone = task.status === TaskStatus.DONE;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleStatusClick}
              className={cn(
                "flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1",
                "h-6 w-6 min-w-[1.5rem] min-h-[1.5rem] border-2 shadow-sm",
                isDone
                  ? "bg-[#9b87f5] border-[#9b87f5] text-white hover:bg-[#8d70eb] hover:border-[#8d70eb]"
                  : "bg-white border-gray-300 text-[#8E9196] hover:border-[#9b87f5] hover:bg-purple-50",
                task.status === TaskStatus.ARCHIVED && "opacity-40 cursor-not-allowed"
              )}
              aria-label={isDone ? (completeTimeoutRef.current ? "Double click to undo" : "Mark as not done") : "Mark as done"}
              disabled={task.status === TaskStatus.ARCHIVED}
              tabIndex={0}
              type="button"
            >
              {isDone ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                <span className="block rounded-full w-3 h-3 border border-gray-200 bg-white" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {task.status === TaskStatus.DONE && completeTimeoutRef.current
              ? "Double click to undo completion"
              : isDone
                ? "Click to mark as not done"
                : "Click to mark as done"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  let description = task.description || '';
  if (description?.startsWith("Demo task for project testing")) {
    description = "";
  } else if (description.length > 100) {
    description = description.slice(0, 100) + "...";
  }

  const getPriorityFlag = () => {
    if (!task.priority) return null;
    const colorMap = {
      [TaskPriority.LOW]: "text-green-500",
      [TaskPriority.MEDIUM]: "text-blue-500",
      [TaskPriority.HIGH]: "text-orange-500",
      [TaskPriority.URGENT]: "text-red-500",
    };

    const priorityLabel = TaskPriority[task.priority];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex">
              <Flag className={cn("h-4 w-4", colorMap[task.priority])} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {priorityLabel} Priority
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Simplified visibility logic - a task should be hidden if it's both DONE and removed
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
          "group relative flex flex-col bg-card rounded-md border shadow-sm transition-all cursor-pointer",
          "hover:shadow-md hover:bg-muted/20 hover:border-primary/30",
          task.status === TaskStatus.DONE && "opacity-80 bg-muted/40",
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
          <StatusCheckbox />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className={cn(
                "font-medium text-base leading-tight truncate",
                task.status === TaskStatus.DONE && "line-through opacity-70"
              )}>
                {task.title}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
                className="h-6 w-6 shrink-0 text-muted-foreground hidden group-hover:flex"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle details</span>
              </Button>
            </div>
            {description && (
              <div
                className={cn(
                  "text-sm text-muted-foreground mt-1 break-words truncate",
                  task.status === TaskStatus.DONE && "line-through opacity-70",
                  !isExpanded && "hidden"
                )}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {description || 'No description'}
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden opacity-0 group-hover:opacity-100 group-hover:flex h-6 text-xs mt-2 text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => {
                  setTask(prevTask => ({
                    ...prevTask,
                    status: TaskStatus.TODO
                  }));
                  setIsExiting(false);
                  setIsRemoved(false);
                  updateTask({ id: task.id, status: TaskStatus.TODO });
                }}>
                  Mark as To Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setTask(prevTask => ({
                    ...prevTask,
                    status: TaskStatus.IN_PROGRESS
                  }));
                  setIsExiting(false);
                  setIsRemoved(false);
                  updateTask({ id: task.id, status: TaskStatus.IN_PROGRESS });
                }}>
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setTask(prevTask => ({
                    ...prevTask,
                    status: TaskStatus.DONE
                  }));
                  setIsExiting(true);
                  updateTask({ id: task.id, status: TaskStatus.DONE });
                }}>
                  Mark as Done
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setTask(prevTask => ({
                    ...prevTask,
                    status: TaskStatus.ARCHIVED
                  }));
                  updateTask({ id: task.id, status: TaskStatus.ARCHIVED });
                }}>
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteTask(task.id)}>
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isExpanded && !compact && (
          <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5 items-center">
            {task.dueDate && (
              <div className={cn(
                "flex items-center text-xs rounded-full px-2 py-0.5 font-medium",
                new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE 
                  ? "bg-red-50 text-red-700 border border-red-200" 
                  : "text-muted-foreground"
              )}>
                <Clock className="h-3 w-3 mr-1" />
                {format(new Date(task.dueDate), 'MMM d')}
              </div>
            )}
            
            {projectName && (
              <Badge 
                variant="outline" 
                className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
              >
                {projectName}
              </Badge>
            )}
            
            {total > 0 && (
              <Badge 
                variant="outline" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                {completed}/{total}
              </Badge>
            )}
            
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1">
                <Tag className="h-3 w-3 text-muted-foreground" />
                {task.tags.slice(0, 3).map((tag, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="text-xs bg-muted/40 hover:bg-muted"
                  >
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{task.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {task.priority !== undefined && task.priority !== null && (
              <div className="ml-auto">
                {getPriorityFlag()}
              </div>
            )}
          </div>
        )}
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
