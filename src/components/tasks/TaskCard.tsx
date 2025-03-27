
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
  ChevronDown,
  ChevronUp,
  Loader2, 
  MoreHorizontal, 
  Tag,
  CalendarIcon,
  Edit,
  Trash
} from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { 
  formatDate, 
  getPriorityColor, 
  getPriorityLabel, 
  getStatusColor, 
  getStatusLabel, 
  isOverdue 
} from '@/lib/utils';
import { useTaskStore } from '@/store';
import { cn } from '@/lib/utils';
import { ProjectBadge } from '@/components/projects';
import { useProjectStore } from '@/store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  isCompact?: boolean; // For optionally showing a more compact view
}

function TaskCardComponent({ task, isDragging = false, isCompact = false }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateTask, deleteTask } = useTaskStore();
  const { projects } = useProjectStore();
  
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  
  // Handle status change with optimistic UI updates
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

  // Handle task deletion with confirmation and optimistic UI
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

  // Handle checkbox click for quickly toggling completion
  const handleCheckboxClick = useCallback(async () => {
    let newStatus = TaskStatus.DONE;
    if (task.status === TaskStatus.DONE) {
      newStatus = TaskStatus.TODO;
    }
    await handleStatusChange(newStatus);
  }, [task.status, handleStatusChange]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <Card 
      className={cn(
        "group w-full transition-all duration-200 border border-border/40 shadow-sm hover:shadow-md hover:border-border/80",
        project ? `border-l-4` : '',
        isUpdating || isDeleting ? 'opacity-70' : '',
        isDragging ? 'opacity-80 rotate-1 scale-105 shadow-md z-50' : '',
        isExpanded ? 'shadow-md' : ''
      )}
      style={project ? { borderLeftColor: project.color } : {}}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={handleCheckboxClick}
              className="mt-0.5 flex-shrink-0 transition-all duration-150"
              disabled={isUpdating || isDeleting}
              aria-label={task.status === TaskStatus.DONE ? "Mark as not done" : "Mark as done"}
            >
              {task.status === TaskStatus.DONE ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
              )}
            </button>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className={cn(
                    "font-medium text-base text-balance mr-2",
                    task.status === TaskStatus.DONE && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-1">
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-full"
                      aria-label={isExpanded ? "Collapse task" : "Expand task"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  {(isUpdating || isDeleting) ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-1" />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Task actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.TODO)}>
                          Mark as To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}>
                          Mark as In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.DONE)}>
                          Mark as Done
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.ARCHIVED)}>
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 my-2">
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {getStatusLabel(task.status)}
                </Badge>
                
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {getPriorityLabel(task.priority)}
                </Badge>
                
                {task.projectId && (
                  <ProjectBadge projectId={task.projectId} />
                )}
              </div>
              
              <CollapsibleContent className="animate-accordion-down overflow-hidden">
                {task.description && (
                  <div className={cn(
                    "text-sm text-muted-foreground mb-3 pb-3 border-b border-border/40",
                    task.status === TaskStatus.DONE && "line-through"
                  )}>
                    {task.description}
                  </div>
                )}
                
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mb-3">
                    <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7"
                      onClick={() => console.log('Edit task - to be implemented')}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-destructive hover:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                  
                  {task.dueDate && (
                    <div className={cn(
                      "flex items-center text-sm",
                      isOverdue(task.dueDate) ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
              
              {!isExpanded && (
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                  {task.dueDate && (
                    <div className={cn(
                      "flex items-center",
                      isOverdue(task.dueDate) ? 'text-destructive' : ''
                    )}>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                  
                  {task.tags && task.tags.length > 0 && !isCompact && (
                    <div className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {task.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="ml-1">#{tag}</span>
                      ))}
                      {task.tags.length > 2 && <span>+{task.tags.length - 2}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

// Use memo to prevent unnecessary re-renders, especially in list views
export const TaskCard = memo(TaskCardComponent);
