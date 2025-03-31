
import { TaskFilters, TaskStatus, Task } from '@/types/task';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';

export interface FilterSlice {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export const createFilterSlice: StateCreator<TaskStore, [], [], FilterSlice> = (set, get) => ({
  filters: {},
  
  setFilters: (filters: TaskFilters) => {
    console.log("[FilterSlice] Setting filters:", filters);
    set({ filters });
  },
  
  clearFilters: () => {
    console.log("[FilterSlice] Clearing all filters");
    set({ filters: {} });
  },
  
  getFilteredTasks: () => {
    const { tasks, filters } = get();
    
    // Debug log to see what we're starting with
    console.log(`Filtering ${tasks.length} tasks with filters:`, filters);
    
    // If there are no filters, return all tasks
    if (!filters || Object.keys(filters).length === 0) {
      console.log('No filters applied, returning all tasks');
      return tasks;
    }
    
    const filteredTasks = tasks.filter(task => {
      // Project filter
      if (filters.projectId !== undefined) {
        if (filters.projectId === 'none') {
          if (task.projectId) return false;
        } else if (filters.projectId && task.projectId !== filters.projectId) {
          return false;
        }
      }
      
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
    
    // Debug log to see the result of filtering
    console.log(`Filtering result: ${filteredTasks.length} tasks matched the criteria`);
    
    return filteredTasks;
  },
  
  getTasksByStatus: (status: TaskStatus) => {
    return get().tasks.filter(task => task.status === status);
  },
});
