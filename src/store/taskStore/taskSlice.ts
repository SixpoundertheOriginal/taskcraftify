
import { StateCreator } from 'zustand';
import { TaskService } from '@/services/taskService';
import { Task } from '@/types/task';
import { toast } from '@/hooks/use-toast';

export interface TaskSlice {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (task: Partial<Task> & { id: string }) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  setTaskStatus: (id: string, status: Task['status']) => Promise<Task>;
  refreshTaskCounts: () => void;
}

export const createTaskSlice: StateCreator<TaskSlice, [], [], TaskSlice> = (set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.fetchTasks();
      if (result.error) {
        throw result.error;
      }
      
      console.log(`Fetched ${result.data?.length || 0} tasks`);
      set({ tasks: result.data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks', 
        isLoading: false 
      });
    }
  },
  
  createTask: async (task) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.createTask(task);
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task returned from creation');
      }
      
      set((state) => ({ 
        tasks: [...state.tasks, result.data!],
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error creating task:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateTask: async (task) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.updateTask(task);
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task returned from update');
      }
      
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? result.data! : t)),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating task:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  setTaskStatus: async (id, status) => {
    // This is a convenience method that calls updateTask with just the status change
    return get().updateTask({ id, status });
  },
  
  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.deleteTask(id);
      if (result.error) {
        throw result.error;
      }
      
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  refreshTaskCounts: () => {
    // This function doesn't need to do anything special
    // It's just a trigger to force a re-render with the latest task data
    const tasks = get().tasks;
    console.log(`Refreshing task counts. Current task count: ${tasks.length}`);
    
    // Force a state update by creating a new tasks array with the same items
    set({ tasks: [...tasks] });
    
    toast({
      title: "Task counts refreshed",
      description: `Updated counts for ${tasks.length} tasks`,
    });
  }
});
