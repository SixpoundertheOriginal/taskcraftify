import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Tag 
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
  
  // Toggle the task status between TODO, IN_PROGRESS, and DONE
  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    let newStatus = TaskStatus.TODO;
    
    if (task.status === TaskStatus.TODO) {
      newStatus = TaskStatus.IN_PROGRESS;
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      newStatus = TaskStatus.DONE;
    } else if (task.status === TaskStatus.DONE) {
      newStatus = TaskStatus.TODO;
    }
    
    updateTask({
      id: task.id,
      status: newStatus
    });
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

  // Status dot with tooltip; replace icon/text with dot indicator
  const statusDotColor = {
    [TaskStatus.TODO]: "bg-gray-300",
    [TaskStatus.IN_PROGRESS]: "bg-blue-400",
    [TaskStatus.DONE]: "bg-green-400",
    [TaskStatus.ARCHIVED]: "bg-muted",
  }[task.status] || "bg-gray-300";

  // Truncate "Demo task for project testing..." repetitive description for demo tasks
  let description = task.description || '';
  if (description?.startsWith("Demo task for project testing")) {
    description = description.split('\n')[0].slice(0, 45) + (description.length > 45 ? "…" : "");
  }

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "group relative flex flex-col bg-card rounded-md border shadow-sm hover:shadow-md transition-all cursor-grab",
          task.status === TaskStatus.DONE && "opacity-80 bg-muted/40",
          isDragging && "shadow-lg z-50 opacity-90",
          className
        )}
        onClick={handleTaskClick}
      >
        <div className="flex items-start gap-2 p-2">
          {/* Replace check-circle with only a color bullet/status */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-block w-3 h-3 rounded-full border border-gray-300 cursor-pointer mt-1 mr-1",
                    statusDotColor
                  )}
                  aria-label={TaskStatus[task.status]}
                  tabIndex={0}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                {TaskStatus[task.status].replace(/_/g, " ")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className="font-medium text-base leading-tight truncate">
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
            <div
              className={cn(
                "text-sm text-muted-foreground mt-1 break-words",
                task.status === TaskStatus.DONE && "line-through opacity-70",
                !isExpanded && "hidden"
              )}
            >
              {description || 'No description'}
            </div>

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
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {format(task.dueDate, 'MMM d')}
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
          </div>
        )}
        
        {/* Priority indicator */}
        <div className="absolute top-0 right-0">
          <Badge 
            className={cn(
              "h-2 w-2 rounded-full absolute top-1 right-1 p-0 border-0",
              task.priority === TaskPriority.LOW && "bg-green-500",
              task.priority === TaskPriority.MEDIUM && "bg-blue-500",
              task.priority === TaskPriority.HIGH && "bg-orange-500",
              task.priority === TaskPriority.URGENT && "bg-red-500"
            )}
          />
          
          <Badge 
            className="absolute top-1 right-1 opacity-0 h-0 w-0"
          >
            {task.priority}
          </Badge>
        </div>
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
