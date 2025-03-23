
import { TaskFilters, TaskStatus } from '@/types/task';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';

export interface FilterSlice {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  getFilteredTasks: () => ReturnType<TaskStore["getFilteredTasks"]>;
  getTasksByStatus: (status: TaskStatus) => ReturnType<TaskStore["getTasksByStatus"]>;
}

export const createFilterSlice: StateCreator<TaskStore, [], [], FilterSlice> = (set, get) => ({
  filters: {},
  
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
});
