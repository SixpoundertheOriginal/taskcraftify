
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SubtaskList } from './SubtaskList';
import { CommentList } from './CommentList';
import { ActivityHistory } from './ActivityHistory';
import { TaskAttachments } from './TaskAttachments';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: Task;
  initialStatus?: TaskStatus;
  initialDueDate?: Date;
}

export function TaskForm({ open, onOpenChange, taskToEdit, initialStatus, initialDueDate }: TaskFormProps) {
  const [activeTab, setActiveTab] = useState(taskToEdit ? "details" : "form");
  const isMobile = useIsMobile();
  
  const handleClose = () => {
    setActiveTab(taskToEdit ? "details" : "form");
    onOpenChange(false);
  };
  
  const handleSuccess = () => {
    onOpenChange(false);
  };
  
  const isEditing = !!taskToEdit;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto animate-fade-in transition-colors">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Task Details' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'View and edit task details below.'
              : 'Fill out the form below to create a new task.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {isEditing ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={cn(
              "w-full mb-3 bg-muted/50 h-9",
              isMobile && "flex-wrap overflow-x-auto"
            )}>
              <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
              <TabsTrigger value="attachments" className="text-sm">
                Attachments
              </TabsTrigger>
              <TabsTrigger value="subtasks" className="text-sm">
                Subtasks
                {taskToEdit.subtasks && taskToEdit.subtasks.length > 0 && (
                  <span className="ml-1 text-xs bg-muted rounded-full px-1.5">
                    {taskToEdit.subtasks.filter(s => s.completed).length}/{taskToEdit.subtasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-sm">
                Comments
                {taskToEdit.comments && taskToEdit.comments.length > 0 && (
                  <span className="ml-1 text-xs bg-muted rounded-full px-1.5">
                    {taskToEdit.comments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-sm">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-0 space-y-3 overflow-x-auto">
              <TaskFormContent 
                onSuccess={handleSuccess} 
                taskToEdit={taskToEdit}
                initialDueDate={initialDueDate}
              />
            </TabsContent>
            
            <TabsContent value="attachments" className="mt-0 pt-1 min-h-[300px] overflow-x-auto">
              <TaskAttachments taskId={taskToEdit.id} />
            </TabsContent>
            
            <TabsContent value="subtasks" className="mt-0 pt-1 min-h-[300px] overflow-x-auto">
              <SubtaskList taskId={taskToEdit.id} />
            </TabsContent>
            
            <TabsContent value="comments" className="mt-0 pt-1 min-h-[300px] overflow-x-auto">
              <CommentList taskId={taskToEdit.id} />
            </TabsContent>
            
            <TabsContent value="activity" className="mt-0 pt-1 min-h-[300px] overflow-x-auto">
              <ActivityHistory taskId={taskToEdit.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <TaskFormContent 
            onSuccess={handleSuccess} 
            taskToEdit={taskToEdit}
            initialStatus={initialStatus}
            initialDueDate={initialDueDate}
          />
        )}
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add the import for cn
import { cn } from '@/lib/utils';
