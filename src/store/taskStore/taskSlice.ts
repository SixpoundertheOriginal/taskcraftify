
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
      console.log('----------------------------------------');
      console.log('DETAILED TASK COUNT REFRESH DIAGNOSTICS:');
      console.log('----------------------------------------');
      
      try {
        console.log('1. Fetching all tasks from database...');
        const result = await TaskService.fetchTasks();
        if (result.error) {
          throw result.error;
        }
        
        const tasks = result.data || [];
        console.log(`2. Successfully fetched ${tasks.length} tasks for counting`);
        
        // Log raw task data to inspect projectId values
        console.log('3. RAW TASK DATA FROM DATABASE:');
        tasks.forEach((task, index) => {
          console.log(`Task ${index + 1}:`, {
            id: task.id,
            title: task.title,
            status: task.status,
            projectId: task.projectId === undefined ? 'undefined' : 
                       task.projectId === null ? 'null' : 
                       task.projectId === '' ? 'empty string' : task.projectId,
            rawProjectId: task.projectId, // Raw value for comparison
          });
        });
        
        // Analyze task distribution by project (using more detailed approach)
        console.log('4. TASK DISTRIBUTION BY PROJECT:');
        const tasksByProject: Record<string, Task[]> = {};
        
        // Initialize with empty arrays for all projects and "none"
        tasksByProject["none"] = [];
        
        // Group tasks by project
        tasks.forEach(task => {
          const projectId = task.projectId || 'none';
          if (!tasksByProject[projectId]) {
            tasksByProject[projectId] = [];
          }
          tasksByProject[projectId].push(task);
        });
        
        // Log count information
        console.log('5. PROJECT TASK COUNTS:');
        Object.entries(tasksByProject).forEach(([projectId, projectTasks]) => {
          console.log(`Project "${projectId}": ${projectTasks.length} tasks`);
          if (projectTasks.length > 0) {
            console.log(`  Sample task from project "${projectId}":`, {
              id: projectTasks[0].id,
              title: projectTasks[0].title,
              projectId: projectTasks[0].projectId,
              projectIdType: typeof projectTasks[0].projectId
            });
          }
        });
        
        // Log current state before update
        console.log('6. CURRENT STATE BEFORE UPDATE:');
        console.log('Current task count in store:', get().tasks.length);
        
        // Force a state update by creating a new tasks array
        console.log('7. UPDATING STORE STATE WITH NEW TASK DATA');
        set({ tasks: [...tasks] });
        
        console.log('----------------------------------------');
        console.log('TASK COUNT REFRESH COMPLETED');
        console.log('----------------------------------------');
        
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
