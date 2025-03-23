
import { Task, TaskStatus, TaskPriority, CreateTaskDTO, UpdateTaskDTO } from '@/types/task';
import { TaskService } from '@/services/taskService';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';

export interface TaskSlice {
  tasks: Task[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: Error | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: CreateTaskDTO) => Promise<string | null>;
  updateTask: (taskUpdate: UpdateTaskDTO) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<boolean>;
  setTaskPriority: (id: string, priority: TaskPriority) => Promise<boolean>;
  
  // Selectors
  getTaskById: (id: string) => Task | undefined;
}

export const createTaskSlice: StateCreator<TaskStore, [], [], TaskSlice> = (set, get) => ({
  tasks: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  
  fetchTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const result = await TaskService.fetchTasks();
      
      if (result.error) {
        set({ error: result.error, isLoading: false });
        return;
      }
      
      set({ tasks: result.data || [], isLoading: false });
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch tasks'), 
        isLoading: false 
      });
    }
  },
  
  addTask: async (taskData: CreateTaskDTO) => {
    try {
      set({ isSubmitting: true, error: null });
      
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        id: tempId,
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set(state => ({
        tasks: [tempTask, ...state.tasks],
      }));
      
      // Actual API call
      const result = await TaskService.createTask(taskData);
      
      if (result.error) {
        // Revert optimistic update
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== tempId),
          error: result.error,
          isSubmitting: false
        }));
        return null;
      }
      
      if (!result.data) {
        // Handle unexpected case where no data is returned but no error either
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== tempId),
          error: new Error('Failed to create task: No data returned'),
          isSubmitting: false
        }));
        return null;
      }
      
      // Replace temp task with actual task
      set(state => ({
        tasks: state.tasks.map(t => t.id === tempId ? result.data! : t),
        isSubmitting: false
      }));
      
      return result.data.id;
    } catch (error) {
      console.error('Error in addTask:', error);
      
      // Remove temp task on error
      set(state => ({
        tasks: state.tasks.filter(t => !t.id.startsWith('temp-')),
        error: error instanceof Error ? error : new Error('Failed to add task'),
        isSubmitting: false
      }));
      
      return null;
    }
  },
  
  updateTask: async (taskUpdate: UpdateTaskDTO) => {
    try {
      set({ isSubmitting: true, error: null });
      
      // Store the original task for potential rollback
      const originalTask = get().tasks.find(task => task.id === taskUpdate.id);
      if (!originalTask) {
        set({ 
          error: new Error('Task not found'), 
          isSubmitting: false 
        });
        return false;
      }
      
      // Optimistic update
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskUpdate.id
            ? { 
                ...task, 
                ...taskUpdate, 
                updatedAt: new Date() 
              }
            : task
        )
      }));
      
      // Actual API call
      const result = await TaskService.updateTask(taskUpdate);
      
      if (result.error) {
        // Revert optimistic update on error
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === taskUpdate.id ? originalTask : task
          ),
          error: result.error,
          isSubmitting: false
        }));
        return false;
      }
      
      set({ isSubmitting: false });
      return true;
    } catch (error) {
      console.error('Error in updateTask:', error);
      
      // Get the original task state and revert
      const originalTask = get().tasks.find(task => task.id === taskUpdate.id);
      
      // Revert optimistic update on error
      if (originalTask) {
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === taskUpdate.id ? originalTask : task
          ),
          error: error instanceof Error ? error : new Error('Failed to update task'),
          isSubmitting: false
        }));
      } else {
        set({ 
          error: error instanceof Error ? error : new Error('Failed to update task'), 
          isSubmitting: false 
        });
      }
      
      return false;
    }
  },
  
  deleteTask: async (id: string) => {
    try {
      set({ isSubmitting: true, error: null });
      
      // Store the task being deleted for potential rollback
      const deletedTask = get().tasks.find(t => t.id === id);
      if (!deletedTask) {
        set({ 
          error: new Error('Task not found'), 
          isSubmitting: false 
        });
        return false;
      }
      
      // Optimistic delete
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id)
      }));
      
      // Actual API call
      const result = await TaskService.deleteTask(id);
      
      if (result.error) {
        // Revert optimistic delete on error
        set(state => ({
          tasks: [...state.tasks, deletedTask],
          error: result.error,
          isSubmitting: false
        }));
        return false;
      }
      
      set({ isSubmitting: false });
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      
      // Get the original task and revert
      const deletedTask = get().tasks.find(t => t.id === id);
      
      // Revert optimistic delete on error
      if (deletedTask) {
        set(state => ({
          tasks: [...state.tasks, deletedTask],
          error: error instanceof Error ? error : new Error('Failed to delete task'),
          isSubmitting: false
        }));
      } else {
        set({ 
          error: error instanceof Error ? error : new Error('Failed to delete task'), 
          isSubmitting: false 
        });
      }
      
      return false;
    }
  },
  
  setTaskStatus: async (id: string, status: TaskStatus) => {
    return await get().updateTask({ id, status });
  },
  
  setTaskPriority: async (id: string, priority: TaskPriority) => {
    return await get().updateTask({ id, priority });
  },
  
  getTaskById: (id: string) => {
    return get().tasks.find(task => task.id === id);
  },
});
