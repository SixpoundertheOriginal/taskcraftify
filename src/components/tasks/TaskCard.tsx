
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle, Clock, Loader2, MoreHorizontal, Tag, Circle } from 'lucide-react';
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

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { updateTask, deleteTask, setTaskStatus } = useTaskStore();
  const { projects } = useProjectStore();
  
  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  
  const handleStatusChange = async (status: TaskStatus) => {
    try {
      setIsUpdating(true);
      await setTaskStatus(task.id, status);
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTask(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
      setIsDeleting(false);
    }
  };

  const handleCheckboxClick = async () => {
    let newStatus = TaskStatus.DONE;
    if (task.status === TaskStatus.DONE) {
      newStatus = TaskStatus.TODO;
    }
    await handleStatusChange(newStatus);
  };

  const getBorderColor = () => {
    if (task.projectId && project) {
      return `border-l-[3px] border-l-[${project.color}]`;
    }
    return '';
  };

  return (
    <Card 
      className={cn(
        "group w-full transition-all duration-200 border border-border/40 shadow-sm hover:shadow-md hover:border-border/80",
        project ? `border-l-4` : '',
        isUpdating || isDeleting ? 'opacity-70' : '',
      )}
      style={project ? { borderLeftColor: project.color } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleCheckboxClick}
            className="mt-0.5 flex-shrink-0 transition-all duration-150"
            disabled={isUpdating || isDeleting}
          >
            {task.status === TaskStatus.DONE ? (
              <CheckCircle className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className={cn(
                "font-medium text-base text-balance",
                task.status === TaskStatus.DONE && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              
              {(isUpdating || isDeleting) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Task actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.TODO)}>
                      Mark as To Do
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}>
                      Mark as In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange(TaskStatus.DONE)}>
                      Mark as Done
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {task.description && (
              <p className={cn(
                "text-sm text-muted-foreground mb-3 line-clamp-2",
                task.status === TaskStatus.DONE && "line-through"
              )}>
                {task.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-3">
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
            
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              {task.dueDate && (
                <div className={`flex items-center ${isOverdue(task.dueDate) ? 'text-destructive' : ''}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(task.dueDate)}
                </div>
              )}
              
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  {task.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="ml-1">#{tag}</span>
                  ))}
                  {task.tags.length > 2 && <span>+{task.tags.length - 2}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
