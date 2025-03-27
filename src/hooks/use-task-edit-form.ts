
import { Task } from '@/types/task';
import { useTaskStore } from '@/store';
import { useForm } from 'react-hook-form';
import { useState, useCallback, useMemo } from 'react';

type TaskFormValues = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export function useTaskEditForm(task: Task) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateTask } = useTaskStore();
  
  // Initialize form with current task values
  const defaultValues = useMemo(() => ({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    tags: task.tags || [],
    projectId: task.projectId
  }), [task]);
  
  const form = useForm<TaskFormValues>({
    defaultValues
  });
  
  // Check if form values have changed
  const isDirty = useMemo(() => {
    return form.formState.isDirty;
  }, [form.formState.isDirty]);
  
  // Reset form to original values
  const resetForm = useCallback(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);
  
  // Handle form submission
  const onSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      // Get form values
      const values = form.getValues();
      
      // Update task in store
      await updateTask({
        id: task.id,
        ...values
      });
      
      // Reset form state
      form.reset(values);
      
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [form, task.id, updateTask]);
  
  return {
    form,
    onSubmit,
    isSubmitting,
    isDirty,
    resetForm
  };
}
