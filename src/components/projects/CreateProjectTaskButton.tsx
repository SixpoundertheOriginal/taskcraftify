
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskForm } from '@/components/tasks/TaskForm';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CreateProjectTaskButtonProps {
  projectId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CreateProjectTaskButton({ 
  projectId, 
  variant = 'default',
  size = 'default',
  className 
}: CreateProjectTaskButtonProps) {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  
  const handleOpenTaskForm = () => {
    setIsTaskFormOpen(true);
  };
  
  const handleTaskFormOpenChange = (open: boolean) => {
    setIsTaskFormOpen(open);
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
              onClick={handleOpenTaskForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Create a new task in this project
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={handleTaskFormOpenChange}
        initialProjectId={projectId}
      />
    </>
  );
}
