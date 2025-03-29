
import { useState, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle, 
  Circle,
  Clock, 
  Loader2, 
  MoreHorizontal, 
  Tag,
  Trash,
  ListChecks,
  MessageSquare,
  GripVertical,
  // New icons for status badges
  CircleCheck,
  AlertCircle,
  ArrowRight,
  Clock3,
  Archive,
  // New icons for priority badges
  Flag,
  AlertTriangle,
  Flame,
  ArrowDown
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, countCompletedSubtasks } from '@/types/task';
import { 
  formatDate, 
  getPriorityColor, 
  getPriorityLabel, 
  getStatusColor, 
  getStatusLabel, 
  isOverdue 
} from '@/lib/utils';
import { useTaskStore, useProjectStore } from '@/store';
import { cn } from '@/lib/utils';
import { ProjectBadge } from '@/components/projects';
import { toast } from '@/hooks/use-toast';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useIsMobile } from '@/hooks/use-mobile';
import { TaskForm } from './TaskForm';
import { useDraggable } from '@dnd-kit/core';
import { Separator } from '@/components/ui/separator';

interface TaskCardProps {
  task: Task;
  isCompact?: boolean; // For optionally showing a more compact view
}

// Helper function to get status icon
const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.TODO:
      return <Clock3 className="h-3 w-3" />;
    case TaskStatus.IN_PROGRESS:
      return <ArrowRight className="h-3 w-3" />;
    case TaskStatus.DONE:
      return <CircleCheck className="h-3 w-3" />;
    case TaskStatus.ARCHIVED:
      return <Archive className="h-3 w-3" />;
    case TaskStatus.BACKLOG:
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <Clock3 className="h-3 w-3" />;
  }
};

// Helper function to get priority icon
const getPriorityIcon = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.LOW:
      return <ArrowDown className="h-3 w-3" />;
    case TaskPriority.MEDIUM:
      return <Flag className="h-3 w-3" />;
    case TaskPriority.HIGH:
      return <AlertTriangle className="h-3 w-3" />;
    case TaskPriority.URGENT:
      return <Flame className="h-3 w-3" />;
    default:
      return <Flag className="h-3 w-3" />;
  }
};

function TaskCardComponent({ task, isCompact = false }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { updateTask, deleteTask } = useTaskStore();
  const { projects } = useProjectStore();
  const isMobile = useIsMobile();
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      task
    }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
    opacity: 0.8,
    boxShadow: '0 5px 10px rgba(0, 0, 0, 0.15)'
  } : undefined;
  
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  
  const subtaskCounts = countCompletedSubtasks(task);
  
  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    try {
      setIsUpdating(true);
      await updateTask({ id: task.id, status });
      toast({
        title: "Task updated",
        description: `Task status changed to ${getStatusLabel(status)}`
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  }, [task.id, updateTask]);

  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteTask(task.id);
      toast({
        title: "Task deleted",
        description: "Task has been successfully deleted"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Failed to delete task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  }, [task.id, deleteTask]);

  const handleCheckboxClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    let newStatus = TaskStatus.DONE;
    if (task.status === TaskStatus.DONE) {
      newStatus = TaskStatus.TODO;
    }
    await handleStatusChange(newStatus);
  }, [task.status, handleStatusChange]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (
      !isDragging && 
      e.target instanceof Element && 
      !e.target.closest('button') && 
      !e.target.closest('select') && 
      !e.target.closest('input') && 
      !e.target.closest('textarea') &&
      !e.target.closest('[role="combobox"]') && 
      !e.target.closest('[data-radix-popper-content-wrapper]') &&
      !e.target.closest('[role="tab"]') &&
      !e.target.closest('label') &&
      !e.target.closest('.drag-handle')
    ) {
      setIsTaskModalOpen(true);
    }
  }, [isDragging]);

  const titleClassName = cn(
    "font-medium text-base text-balance mr-2",
    task.status === TaskStatus.DONE && "line-through text-muted-foreground"
  );

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={{ 
          ...style,
          ...(project ? { borderLeftColor: project.color } : {})
        }}
        className={cn(
          "group w-full transition-all duration-200 border border-border/40 shadow-sm",
          "hover:shadow-md hover:border-border/80 cursor-pointer",
          "hover:bg-muted/30", // Subtle background change on hover
          project ? `border-l-4` : '',
          isDragging ? "shadow-lg opacity-80" : "",
          (isUpdating || isDeleting) ? 'opacity-70' : '',
          isHovered ? "bg-muted/10" : ""
        )}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={0}
        role="button"
        aria-label={`Task: ${task.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsTaskModalOpen(true);
          }
        }}
      >
        <CardContent className="p-4 relative">
          <div className="flex items-start gap-3">
            <button
              onClick={handleCheckboxClick}
              className={cn(
                "mt-0.5 flex-shrink-0 transition-all duration-150",
                "hover:scale-110", // Scale effect on hover
                "active:scale-95" // Press effect
              )}
              disabled={isUpdating || isDeleting}
              aria-label={task.status === TaskStatus.DONE ? "Mark as not done" : "Mark as done"}
            >
              {task.status === TaskStatus.DONE ? (
                <CheckCircle className="h-5 w-5 text-primary animate-scale-in" />
              ) : (
                <Circle className={cn(
                  "h-5 w-5 text-muted-foreground",
                  "hover:text-primary hover:drop-shadow-sm", // Enhanced hover effect
                  isHovered ? "text-primary/70" : ""
                )} />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start w-full">
                <div className="flex-1 min-w-0">
                  <h3 className={titleClassName}>
                    {task.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 z-10 ml-auto shrink-0">
                  <div 
                    className="drag-handle h-6 flex items-center justify-center cursor-grab opacity-50 hover:opacity-100 pr-1"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
                  {(isUpdating || isDeleting) ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-1" />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full opacity-70 hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Task actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(TaskStatus.TODO); }}>
                          Mark as To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(TaskStatus.IN_PROGRESS); }}>
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(TaskStatus.DONE); }}>
                          Mark as Done
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(TaskStatus.ARCHIVED); }}>
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsTaskModalOpen(true); }}>
                          View/Edit Task
                        </DropdownMenuItem>
                        <Separator className="my-1 bg-muted-foreground/20" />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-destructive">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 my-2">
                <Badge 
                  variant="outline" 
                  size="sm" 
                  className={cn(getStatusColor(task.status), "flex items-center gap-1")}
                >
                  {getStatusIcon(task.status)}
                  <span>{getStatusLabel(task.status)}</span>
                </Badge>
                
                <Badge 
                  variant="outline" 
                  size="sm" 
                  className={cn(getPriorityColor(task.priority), "flex items-center gap-1")}
                >
                  {getPriorityIcon(task.priority)}
                  <span>{getPriorityLabel(task.priority)}</span>
                </Badge>
                
                {task.projectId && (
                  <ProjectBadge projectId={task.projectId} />
                )}
                
                {subtaskCounts.total > 0 && (
                  <Badge 
                    variant="outline" 
                    size="sm" 
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center gap-1"
                  >
                    <ListChecks className="h-3 w-3" />
                    <span>{subtaskCounts.completed}/{subtaskCounts.total}</span>
                  </Badge>
                )}
                
                {task.comments && task.comments.length > 0 && (
                  <Badge 
                    variant="outline" 
                    size="sm" 
                    className="bg-green-50 text-green-600 hover:bg-green-100 flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>{task.comments.length}</span>
                  </Badge>
                )}
              </div>
              
              <Separator className="my-2 bg-muted-foreground/10" />
              
              <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {task.dueDate && (
                    <div className={cn(
                      "flex items-center",
                      isOverdue(task.dueDate) ? 'text-destructive' : ''
                    )}>
                      <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                  
                  {subtaskCounts.total > 0 && (
                    <div className="flex items-center">
                      <ListChecks className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>{subtaskCounts.completed}/{subtaskCounts.total}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {task.comments && task.comments.length > 0 && (
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>{task.comments.length}</span>
                    </div>
                  )}
                  
                  {task.tags && task.tags.length > 0 && !isCompact && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center cursor-help">
                          <Tag className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[80px]">
                            {task.tags.length > 1 
                              ? `${task.tags[0]} +${task.tags.length - 1}` 
                              : task.tags[0]}
                          </span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-auto p-2">
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <TaskForm 
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        taskToEdit={task}
      />
    </>
  );
}

export const TaskCard = memo(TaskCardComponent);
