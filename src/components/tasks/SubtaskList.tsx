
import { useState, useCallback, useEffect } from 'react';
import { useTaskStore } from '@/store';
import { SubtaskItem } from './SubtaskItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { countCompletedSubtasks, Task, TaskStatus, TaskPriority } from '@/types/task';
import { cn } from '@/lib/utils';

interface SubtaskListProps {
  taskId: string;
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { tasks, fetchSubtasks, createSubtask } = useTaskStore();
  
  const task = tasks.find(t => t.id === taskId);
  const subtasks = task?.subtasks || [];
  // Use a default Task object with empty arrays when task is undefined
  const { completed, total } = countCompletedSubtasks(task || { 
    id: '', 
    title: '', 
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: new Date(),
    updatedAt: new Date(),
    subtasks: [] 
  });
  
  // Fetch subtasks on initial render
  useEffect(() => {
    const loadSubtasks = async () => {
      setIsLoading(true);
      try {
        await fetchSubtasks(taskId);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (taskId) {
      loadSubtasks();
    }
  }, [taskId, fetchSubtasks]);
  
  const handleAddSubtask = useCallback(async () => {
    if (!newSubtaskTitle.trim()) {
      toast({
        title: "Invalid input",
        description: "Subtask title cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await createSubtask({
        taskId,
        title: newSubtaskTitle
      });
      
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
      toast({
        title: "Subtask added",
        description: "Subtask has been successfully added"
      });
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast({
        title: "Failed to add subtask",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [taskId, newSubtaskTitle, createSubtask]);
  
  const handleCancelAdd = useCallback(() => {
    setIsAddingSubtask(false);
    setNewSubtaskTitle('');
  }, []);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center">
          Subtasks
          {total > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({completed}/{total} completed)
            </span>
          )}
        </h3>
        
        {!isAddingSubtask && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
            onClick={() => setIsAddingSubtask(true)}
            disabled={isLoading}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>
      
      {isAddingSubtask && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Input
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="New subtask"
            className="h-8 text-sm"
            disabled={isLoading}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddSubtask();
              } else if (e.key === 'Escape') {
                handleCancelAdd();
              }
            }}
          />
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="default"
              className="h-7 px-2"
              onClick={handleAddSubtask}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={handleCancelAdd}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {isLoading && !subtasks.length ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : subtasks.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No subtasks yet
        </div>
      ) : (
        <div className={cn(
          "space-y-1 transition-all",
          isLoading ? "opacity-60" : ""
        )}>
          {subtasks.map(subtask => (
            <SubtaskItem key={subtask.id} subtask={subtask} />
          ))}
        </div>
      )}
    </div>
  );
}
