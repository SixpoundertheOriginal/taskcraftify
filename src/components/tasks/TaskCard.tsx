
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
import { CheckCircle, Clock, Loader2, MoreHorizontal, Tag } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { 
  formatDate, 
  getPriorityColor, 
  getPriorityLabel, 
  getStatusColor, 
  getStatusLabel, 
  isOverdue 
} from '@/lib/utils';
import { useTaskStore } from '@/store/taskStore/taskStore';
import { toast } from '@/hooks/use-toast';
import { TaskForm } from './TaskForm';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { updateTask, deleteTask, setTaskStatus } = useTaskStore();
  
  const handleStatusChange = async (status: TaskStatus) => {
    try {
      setIsUpdating(true);
      const success = await setTaskStatus(task.id, status);
      if (success) {
        toast({
          title: "Task updated",
          description: `Task status changed to ${getStatusLabel(status)}`
        });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Update failed",
        description: "Failed to update task status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await deleteTask(task.id);
      if (success) {
        toast({
          title: "Task deleted",
          description: "Task has been removed successfully"
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete task",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open the edit modal if clicking on the dropdown or its children
    if ((e.target as HTMLElement).closest('.task-dropdown')) {
      return;
    }
    setIsEditModalOpen(true);
  };

  return (
    <>
      <Card 
        className={`group w-full transition-all duration-200 border border-border/40 shadow-sm hover:shadow-md hover:border-border/80 ${
          isUpdating || isDeleting ? 'opacity-70' : 'cursor-pointer'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-base text-balance">{task.title}</h3>
            
            {(isUpdating || isDeleting) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity task-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Task actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="task-dropdown">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(TaskStatus.TODO);
                  }}>
                    Mark as To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(TaskStatus.IN_PROGRESS);
                  }}>
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(TaskStatus.DONE);
                  }}>
                    Mark as Done
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }} className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className={getStatusColor(task.status)}>
              <CheckCircle className="mr-1 h-3 w-3" />
              {getStatusLabel(task.status)}
            </Badge>
            
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {getPriorityLabel(task.priority)}
            </Badge>
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
        </CardContent>
      </Card>

      {/* Task Edit Modal */}
      <TaskForm 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        taskToEdit={task}
      />
    </>
  );
}
