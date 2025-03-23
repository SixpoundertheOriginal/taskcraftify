
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
      
      console.log(`Fetched ${result.data?.length || 0} tasks:`, result.data);
      
      // Group tasks by projectId
      const tasksByProject: Record<string, number> = {};
      result.data?.forEach(task => {
        const projectId = task.projectId || 'none';
        tasksByProject[projectId] = (tasksByProject[projectId] || 0) + 1;
      });
      
      console.log('Task counts by project:', tasksByProject);
      
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
      console.log('Creating task with data:', task);
      const result = await TaskService.createTask(task);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task returned from creation');
      }
      
      console.log('Task created successfully:', result.data);
      console.log('Task projectId:', result.data.projectId);
      
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
      console.log('Updating task with data:', task);
      const result = await TaskService.updateTask(task);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task returned from update');
      }
      
      console.log('Task updated successfully:', result.data);
      console.log('Updated task projectId:', result.data.projectId);
      
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
    // Force a complete refresh by re-fetching all tasks
    const refreshTasks = async () => {
      console.log('Manually refreshing task counts...');
      
      try {
        const result = await TaskService.fetchTasks();
        if (result.error) {
          throw result.error;
        }
        
        const tasks = result.data || [];
        console.log(`Re-fetched ${tasks.length} tasks for counting`);
        
        // Log raw task data to inspect projectId values
        console.log('Raw task data:', tasks);
        
        // Analyze task distribution by project
        const tasksByProject: Record<string, Task[]> = {};
        
        tasks.forEach(task => {
          const projectId = task.projectId || 'none';
          if (!tasksByProject[projectId]) {
            tasksByProject[projectId] = [];
          }
          tasksByProject[projectId].push(task);
        });
        
        // Log detailed count information
        Object.entries(tasksByProject).forEach(([projectId, projectTasks]) => {
          console.log(`Project ${projectId}: ${projectTasks.length} tasks`);
          if (projectTasks.length > 0) {
            console.log(`Sample task from project ${projectId}:`, projectTasks[0]);
          }
        });
        
        // Force a state update by creating a new tasks array
        set({ tasks: [...tasks] });
        
        toast({
          title: "Task counts refreshed",
          description: `Updated counts for ${tasks.length} tasks`,
        });
      } catch (error) {
        console.error('Error refreshing task counts:', error);
        toast({
          title: "Failed to refresh counts",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive"
        });
      }
    };
    
    // Execute the refresh
    refreshTasks();
  }
});
