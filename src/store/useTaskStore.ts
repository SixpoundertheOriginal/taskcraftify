
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  TaskFilters 
} from '@/types/task';
import { generateId } from '@/lib/utils';

interface TaskState {
  tasks: Task[];
  filters: TaskFilters;
  isLoading: boolean;
  
  // Actions
  addTask: (task: CreateTaskDTO) => string;
  updateTask: (taskUpdate: UpdateTaskDTO) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  setTaskPriority: (id: string, priority: TaskPriority) => void;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  
  // Selectors (computed values)
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTaskById: (id: string) => Task | undefined;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    persist(
      (set, get) => ({
        tasks: [],
        filters: {},
        isLoading: false,
        
        addTask: (taskData: CreateTaskDTO) => {
          const id = generateId();
          const now = new Date();
          
          const newTask: Task = {
            id,
            ...taskData,
            createdAt: now,
            updatedAt: now,
          };
          
          set(state => ({
            tasks: [...state.tasks, newTask]
          }));
          
          return id;
        },
        
        updateTask: (taskUpdate: UpdateTaskDTO) => {
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
        },
        
        deleteTask: (id: string) => {
          set(state => ({
            tasks: state.tasks.filter(task => task.id !== id)
          }));
        },
        
        setTaskStatus: (id: string, status: TaskStatus) => {
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === id
                ? { ...task, status, updatedAt: new Date() }
                : task
            )
          }));
        },
        
        setTaskPriority: (id: string, priority: TaskPriority) => {
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === id
                ? { ...task, priority, updatedAt: new Date() }
                : task
            )
          }));
        },
        
        setFilters: (filters: TaskFilters) => {
          set({ filters });
        },
        
        clearFilters: () => {
          set({ filters: {} });
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
      }),
      {
        name: 'task-storage',
        partialize: (state) => ({ 
          tasks: state.tasks,
        }),
      }
    )
  )
);
