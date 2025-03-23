
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  TaskFilters 
} from '@/types/task';
import { TaskService } from '@/services/taskService';
import { useToast } from '@/hooks/use-toast';

interface TaskState {
  tasks: Task[];
  filters: TaskFilters;
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
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  setupTaskSubscription: () => () => void;
  
  // Selectors (computed values)
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTaskById: (id: string) => Task | undefined;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      tasks: [],
      filters: {},
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
      
      setFilters: (filters: TaskFilters) => {
        set({ filters });
      },
      
      clearFilters: () => {
        set({ filters: {} });
      },
      
      setupTaskSubscription: () => {
        return TaskService.subscribeToTasks((tasks) => {
          set({ tasks });
        });
      },
      
      getFilteredTasks: () => {
        const { tasks, filters } = get();
        
        return tasks.filter(task => {
          // Status filter
          if (filters.status && filters.status.length > 0) {
            if (!filters.status.includes(task.status)) return false;
          }
          
          // Priority filter
          if (filters.priority && filters.priority.length > 0) {
            if (!filters.priority.includes(task.priority)) return false;
          }
          
          // Tags filter
          if (filters.tags && filters.tags.length > 0) {
            if (!task.tags || !filters.tags.some(tag => task.tags?.includes(tag))) {
              return false;
            }
          }
          
          // Search query
          if (filters.searchQuery && filters.searchQuery.trim() !== '') {
            const query = filters.searchQuery.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(query);
            const matchesDescription = task.description?.toLowerCase().includes(query) || false;
            
            if (!matchesTitle && !matchesDescription) return false;
          }
          
          // Due date range
          if (filters.dueDateFrom && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            if (dueDate < filters.dueDateFrom) return false;
          }
          
          if (filters.dueDateTo && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            if (dueDate > filters.dueDateTo) return false;
          }
          
          return true;
        });
      },
      
      getTasksByStatus: (status: TaskStatus) => {
        return get().tasks.filter(task => task.status === status);
      },
      
      getTaskById: (id: string) => {
        return get().tasks.find(task => task.id === id);
      },
    })
  )
);
