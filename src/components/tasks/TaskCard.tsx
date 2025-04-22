
import { useState } from 'react';
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

export interface TaskCardProps {
  task: Task;
  compact?: boolean;
  className?: string;
}

export function TaskCard({ task, compact = false, className }: TaskCardProps) {
  const { updateTask, deleteTask } = useTaskStore();
  const { projects } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  // useSortable hook gives us the drag and drop functionality
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

  // Count completed subtasks
  const { completed, total } = countCompletedSubtasks(task);

  // Mark as done or revert to todo (checkbox-like)
  const handleMarkDoneToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    let newStatus: TaskStatus;

    if (task.status !== TaskStatus.DONE) {
      newStatus = TaskStatus.DONE;
    } else {
      newStatus = TaskStatus.TODO;
    }

    updateTask({ id: task.id, status: newStatus });
  };

  // Get the project name for this task
  const projectName = task.projectId 
    ? projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'
    : null;

  // Toggle the expanded state
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Handle opening the task edit form
  const handleTaskClick = () => {
    setIsTaskFormOpen(true);
  };

  // Checkbox/status circle visual
  function StatusCheckbox() {
    // Color palette per provided context:
    // - Done: filled purple with white check
    // - Not done: gray border, white bg

    const isDone = task.status === TaskStatus.DONE;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleMarkDoneToggle}
              className={cn(
                "flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1",
                "h-6 w-6 min-w-[1.5rem] min-h-[1.5rem] border-2 shadow-sm",
                isDone
                  ? "bg-[#9b87f5] border-[#9b87f5] text-white hover:bg-[#8d70eb] hover:border-[#8d70eb]" // purple
                  : "bg-white border-gray-300 text-[#8E9196] hover:border-[#9b87f5] hover:bg-purple-50",
                task.status === TaskStatus.ARCHIVED && "opacity-40 cursor-not-allowed"
              )}
              aria-label={isDone ? "Mark as not done" : "Mark as done"}
              disabled={task.status === TaskStatus.ARCHIVED}
              tabIndex={0}
            >
              {isDone ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                <span className="block rounded-full w-3 h-3 border border-gray-200 bg-white" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isDone ? "Mark as not done" : "Mark as done"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Truncate "Demo task for project testing..." repetitive description for demo tasks
  let description = task.description || '';
  if (description?.startsWith("Demo task for project testing")) {
    description = "";
  } else if (description.length > 100) {
    description = description.slice(0, 100) + "...";
  }

  // Priority flag with color based on priority
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
          className
        )}
        onClick={handleTaskClick}
        tabIndex={0}
      >
        <div className="flex items-start gap-2 p-2">
          {/* Checkbox-style status indicator */}
          <StatusCheckbox />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className={cn(
                "font-medium text-base leading-tight truncate",
                task.status === TaskStatus.DONE && "line-through opacity-70"
              )}>
                {task.title}
              </h3>
              {/* Keep expand/collapse, but smaller */}
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
            {/* Truncated description for demo tasks */}
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
                <DropdownMenuItem onClick={() => updateTask({ id: task.id, status: TaskStatus.TODO })}>
                  Mark as To Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateTask({ id: task.id, status: TaskStatus.IN_PROGRESS })}>
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateTask({ id: task.id, status: TaskStatus.DONE })}>
                  Mark as Done
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateTask({ id: task.id, status: TaskStatus.ARCHIVED })}>
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
            
            {/* Add priority flag indicator */}
            {task.priority !== undefined && task.priority !== null && (
              <div className="ml-auto">
                {getPriorityFlag()}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add task form dialog */}
      <TaskForm 
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        initialTask={task}
      />
    </>
  );
}
