
import { format } from 'date-fns';
import { Tag, Clock, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { countCompletedSubtasks } from '@/types/task';

interface TaskCardDetailsProps {
  task: Task;
  projectName: string | null;
  isExpanded: boolean;
  compact?: boolean;
}

export function TaskCardDetails({
  task,
  projectName,
  isExpanded,
  compact = false,
}: TaskCardDetailsProps) {
  const { completed, total } = countCompletedSubtasks(task);

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

  let description = task.description || "";
  if (description?.startsWith("Demo task for project testing")) {
    description = "";
  } else if (description.length > 100) {
    description = description.slice(0, 100) + "...";
  }

  return (
    <>
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
          {description || "No description"}
        </div>
      )}
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
    </>
  );
}
