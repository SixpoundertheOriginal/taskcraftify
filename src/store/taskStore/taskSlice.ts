
import { StateCreator } from 'zustand';
import { TaskService } from '@/services/taskService';
import { Task } from '@/types/task';
import { toast } from '@/hooks/use-toast';

export interface TaskSlice {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refreshTaskCounts: () => void;
}

export const createTaskSlice: StateCreator<TaskSlice, [], [], TaskSlice> = (set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const tasks = await TaskService.getTasks();
      console.log(`Fetched ${tasks.length} tasks`);
      set({ tasks, isLoading: false });
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
      const newTask = await TaskService.createTask(task);
      set((state) => ({ 
        tasks: [...state.tasks, newTask],
        isLoading: false
      }));
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateTask: async (id, task) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedTask = await TaskService.updateTask(id, task);
      
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        isLoading: false
      }));
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await TaskService.deleteTask(id);
      
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
    // The actual counts are calculated in the ProjectList component
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
