
import { useState, useCallback } from 'react';
import { Subtask } from '@/types/task';
import { useTaskStore } from '@/store';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Edit, Trash, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubtaskItemProps {
  subtask: Subtask;
}

export function SubtaskItem({ subtask }: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editValue, setEditValue] = useState(subtask.title);
  const { updateSubtask, deleteSubtask, toggleSubtaskCompletion } = useTaskStore();

  const handleToggleComplete = useCallback(async (checked: boolean) => {
    try {
      setIsLoading(true);
      await toggleSubtaskCompletion(subtask.id, checked);
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      toast({
        title: "Failed to update subtask",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [subtask.id, toggleSubtaskCompletion]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(subtask.title);
  }, [subtask.title]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue(subtask.title);
  }, [subtask.title]);

  const handleSaveEdit = useCallback(async () => {
    if (!editValue.trim()) {
      toast({
        title: "Invalid input",
        description: "Subtask title cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await updateSubtask({
        id: subtask.id,
        title: editValue
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Failed to update subtask",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [subtask.id, editValue, updateSubtask]);

  const handleDelete = useCallback(async () => {
    try {
      setIsLoading(true);
      await deleteSubtask(subtask.id);
      toast({
        title: "Subtask deleted",
        description: "Subtask has been successfully deleted"
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast({
        title: "Failed to delete subtask",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [subtask.id, deleteSubtask]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 group animate-fade-in">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 h-8 text-sm"
          placeholder="Subtask title"
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveEdit();
            } else if (e.key === 'Escape') {
              handleCancelEdit();
            }
          }}
        />
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleSaveEdit}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleCancelEdit}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group py-1 hover:bg-muted/50 rounded px-1 transition-colors">
      <div className="flex items-center gap-2 flex-1">
        <Checkbox
          id={`subtask-${subtask.id}`}
          checked={subtask.completed}
          onCheckedChange={handleToggleComplete}
          disabled={isLoading}
          className={cn(
            "transition-all duration-200", 
            isLoading ? "opacity-50" : ""
          )}
        />
        <label
          htmlFor={`subtask-${subtask.id}`}
          className={cn(
            "text-sm flex-1 cursor-pointer transition-all",
            subtask.completed ? "line-through text-muted-foreground" : ""
          )}
        >
          {subtask.title}
        </label>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleEdit}
          disabled={isLoading}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash className="h-3 w-3" />
        </Button>
      </div>
      
      {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
    </div>
  );
}
