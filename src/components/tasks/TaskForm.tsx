
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TaskFormContent } from './TaskFormContent';
import { Task, TaskStatus } from '@/types/task';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: Task;
  initialStatus?: TaskStatus;
}

export function TaskForm({ open, onOpenChange, taskToEdit, initialStatus }: TaskFormProps) {
  const handleClose = () => {
    onOpenChange(false);
  };
  
  const handleSuccess = () => {
    onOpenChange(false);
  };
  
  const isEditing = !!taskToEdit;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] animate-fade-in transition-colors">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the task details below.'
              : 'Fill out the form below to create a new task.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <TaskFormContent 
          onSuccess={handleSuccess} 
          taskToEdit={taskToEdit}
          initialStatus={initialStatus} 
        />
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
