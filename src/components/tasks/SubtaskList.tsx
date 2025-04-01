
import React, { useState, useEffect } from 'react';
import { Subtask, CreateSubtaskDTO, UpdateSubtaskDTO, TaskStatus, TaskPriority } from '@/types/task';
import { useTaskStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SubtaskListProps {
  taskId: string;
  subtasks?: Subtask[];
  onSubtasksChange?: (subtasks: Subtask[]) => void;
}

export function SubtaskList({ taskId, subtasks: initialSubtasks, onSubtasksChange }: SubtaskListProps) {
  const { createSubtask, updateSubtask, deleteSubtask, fetchSubtasks, isLoading } = useTaskStore();
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    if (!initialSubtasks) {
      loadSubtasks();
    }
  }, [taskId]);

  useEffect(() => {
    if (initialSubtasks) {
      setSubtasks(initialSubtasks);
    }
  }, [initialSubtasks]);

  const loadSubtasks = async () => {
    try {
      const loadedSubtasks = await fetchSubtasks(taskId);
      setSubtasks(loadedSubtasks || []);  // Ensure we always have an array
      if (onSubtasksChange) {
        onSubtasksChange(loadedSubtasks || []);
      }
    } catch (error) {
      console.error('Error loading subtasks:', error);
      toast({
        title: 'Failed to load subtasks',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubtaskTitle.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const subtaskData: CreateSubtaskDTO = {
        taskId,
        title: newSubtaskTitle.trim()
      };
      
      const newSubtask = await createSubtask(subtaskData);
      
      if (newSubtask) {
        const updatedSubtasks = [...subtasks, newSubtask];
        setSubtasks(updatedSubtasks);
        
        if (onSubtasksChange) {
          onSubtasksChange(updatedSubtasks);
        }
      }
      
      setNewSubtaskTitle('');
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast({
        title: 'Failed to add subtask',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (subtask: Subtask) => {
    try {
      const subtaskUpdate: UpdateSubtaskDTO = {
        id: subtask.id,
        completed: !subtask.completed
      };
      
      const updatedSubtask = await updateSubtask(subtaskUpdate);
      
      if (updatedSubtask) {
        const updatedSubtasks = subtasks.map(s => 
          s.id === subtask.id ? updatedSubtask : s
        );
        
        setSubtasks(updatedSubtasks);
        
        if (onSubtasksChange) {
          onSubtasksChange(updatedSubtasks);
        }
      }
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      toast({
        title: 'Failed to update subtask',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    try {
      await deleteSubtask(id);
      
      const updatedSubtasks = subtasks.filter(s => s.id !== id);
      setSubtasks(updatedSubtasks);
      
      if (onSubtasksChange) {
        onSubtasksChange(updatedSubtasks);
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast({
        title: 'Failed to delete subtask',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEditing = async () => {
    if (!editingId || !editingTitle.trim()) {
      cancelEditing();
      return;
    }
    
    try {
      const subtaskUpdate: UpdateSubtaskDTO = {
        id: editingId,
        title: editingTitle.trim()
      };
      
      const updatedSubtask = await updateSubtask(subtaskUpdate);
      
      if (updatedSubtask) {
        const updatedSubtasks = subtasks.map(s => 
          s.id === editingId ? updatedSubtask : s
        );
        
        setSubtasks(updatedSubtasks);
        
        if (onSubtasksChange) {
          onSubtasksChange(updatedSubtasks);
        }
      }
      
      cancelEditing();
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: 'Failed to update subtask',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Subtasks</h3>
      
      <div className="space-y-2">
        {subtasks && subtasks.length > 0 ? (
          subtasks.map(subtask => (
            <div 
              key={subtask.id} 
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-secondary/50"
            >
              <Checkbox 
                checked={subtask.completed} 
                onCheckedChange={() => handleToggleComplete(subtask)}
                className="h-4 w-4"
              />
              
              {editingId === subtask.id ? (
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                    className="flex-1"
                  />
                  <Button size="sm" onClick={saveEditing}>Save</Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>Cancel</Button>
                </div>
              ) : (
                <>
                  <span 
                    className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}
                    onClick={() => startEditing(subtask)}
                  >
                    {subtask.title}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-50 hover:opacity-100"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="sr-only">Delete subtask</span>
                  </Button>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No subtasks yet.</p>
        )}
      </div>
      
      <form onSubmit={handleAddSubtask} className="flex space-x-2">
        <Input
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={!newSubtaskTitle.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="sr-only">Add subtask</span>
        </Button>
      </form>
    </div>
  );
}
