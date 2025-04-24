
import { TaskFilters, TaskStatus, Task } from '@/types/task';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';

export interface FilterSlice {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  getFilteredTasks: (tasks: Task[]) => Task[];
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
  
  getFilteredTasks: (tasks: Task[]) => {
    const { filters } = get();
    
    // Debug log to see what we're starting with
    console.log(`[FilterSlice] Filtering ${tasks.length} tasks with filters:`, filters);
    
    // If there are no filters, return all tasks
    if (!filters || Object.keys(filters).length === 0) {
      console.log('[FilterSlice] No filters applied, returning all tasks');
      return tasks;
    }
    
    // Helper function to safely compare dates
    const getValidDate = (dateValue: Date | string | null | undefined): Date | null => {
      if (!dateValue) return null;
      
      try {
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      } catch (e) {
        console.error('Invalid date value:', dateValue);
        return null;
      }
    };
    
    const filteredTasks = tasks.filter(task => {
      // Project filter
      if (filters.projectId !== undefined) {
        if (filters.projectId === 'none') {
          // "No Project" selected - only show tasks with no project
          if (task.projectId) return false;
        } else if (filters.projectId) {
          // Specific project selected
          if (task.projectId !== filters.projectId) return false;
        }
        // When projectId is null, we're showing "All Projects" - no filtering
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
      
      // Due date range with improved date handling
      if (filters.dueDateFrom && task.dueDate) {
        const dueDate = getValidDate(task.dueDate);
        const fromDate = getValidDate(filters.dueDateFrom);
        
        if (dueDate && fromDate && dueDate < fromDate) return false;
      }
      
      if (filters.dueDateTo && task.dueDate) {
        const dueDate = getValidDate(task.dueDate);
        const toDate = getValidDate(filters.dueDateTo);
        
        if (dueDate && toDate && dueDate > toDate) return false;
      }
      
      return true;
    });
    
    // Debug log to see the result of filtering
    console.log(`[FilterSlice] Filtering result: ${filteredTasks.length} tasks matched the criteria`);
    
    return filteredTasks;
  },
  
  getTasksByStatus: (status: TaskStatus) => {
    return get().tasks.filter(task => task.status === status);
  },
});
