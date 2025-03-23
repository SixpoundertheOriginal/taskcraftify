
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

interface TaskState {
  tasks: Task[];
  filters: TaskFilters;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: CreateTaskDTO) => Promise<string>;
  updateTask: (taskUpdate: UpdateTaskDTO) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  setTaskPriority: (id: string, priority: TaskPriority) => Promise<void>;
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
      error: null,
      
      fetchTasks: async () => {
        try {
          set({ isLoading: true, error: null });
          const tasks = await TaskService.fetchTasks();
          set({ tasks, isLoading: false });
        } catch (error) {
          console.error('Error fetching tasks:', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to fetch tasks'), 
            isLoading: false 
          });
        }
      },
      
      addTask: async (taskData: CreateTaskDTO) => {
        try {
          set({ isLoading: true, error: null });
          
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
          const newTask = await TaskService.createTask(taskData);
          
          // Replace temp task with actual task
          set(state => ({
            tasks: state.tasks.map(t => t.id === tempId ? newTask : t),
            isLoading: false
          }));
          
          return newTask.id;
        } catch (error) {
          console.error('Error adding task:', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to add task'), 
            isLoading: false 
          });
          
          // Remove temp task on error
          set(state => ({
            tasks: state.tasks.filter(t => !t.id.startsWith('temp-'))
          }));
          
          throw error;
        }
      },
      
      updateTask: async (taskUpdate: UpdateTaskDTO) => {
        try {
          set({ isLoading: true, error: null });
          
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
          await TaskService.updateTask(taskUpdate);
          set({ isLoading: false });
        } catch (error) {
          console.error('Error updating task:', error);
          
          // Revert optimistic update on error
          await get().fetchTasks();
          
          set({ 
            error: error instanceof Error ? error : new Error('Failed to update task'), 
            isLoading: false 
          });
        }
      },
      
      deleteTask: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Optimistic delete
          const deletedTask = get().tasks.find(t => t.id === id);
          set(state => ({
            tasks: state.tasks.filter(task => task.id !== id)
          }));
          
          // Actual API call
          await TaskService.deleteTask(id);
          set({ isLoading: false });
        } catch (error) {
          console.error('Error deleting task:', error);
          
          // Revert optimistic delete on error
          await get().fetchTasks();
          
          set({ 
            error: error instanceof Error ? error : new Error('Failed to delete task'), 
            isLoading: false 
          });
        }
      },
      
      setTaskStatus: async (id: string, status: TaskStatus) => {
        await get().updateTask({ id, status });
      },
      
      setTaskPriority: async (id: string, priority: TaskPriority) => {
        await get().updateTask({ id, priority });
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
