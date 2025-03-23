
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

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskForm({ open, onOpenChange }: TaskFormProps) {
  const handleClose = () => {
    onOpenChange(false);
  };
  
  const handleSuccess = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] animate-fade-in">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new task.
          </DialogDescription>
        </DialogHeader>
        
        <TaskFormContent onSuccess={handleSuccess} />
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
