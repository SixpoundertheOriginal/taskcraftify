
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';
import { TaskService } from '@/services/taskService';
import { TaskStatus } from '@/types/task';

export interface StatsSlice {
  taskCounts: {
    total: number;
    byProject: Record<string, number>;
    byStatus: Record<string, number>;
  };
  refreshTaskCounts: () => void;
}

export const createStatsSlice: StateCreator<
  TaskStore,
  [],
  [],
  StatsSlice
> = (set, get) => ({
  taskCounts: {
    total: 0,
    byProject: {},
    byStatus: {}
  },
  
  refreshTaskCounts: async () => {
    console.log("Refreshing task counts");
    
    try {
      // Calculate counts based on current tasks in the store
      const tasks = get().tasks;
      
      const byProject: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      
      // Initialize all status counts to ensure all statuses are represented
      Object.values(TaskStatus).forEach(status => {
        byStatus[status] = 0;
      });
      
      tasks.forEach(task => {
        // Count by project
        const projectId = task.projectId || 'none';
        byProject[projectId] = (byProject[projectId] || 0) + 1;
        
        // Count by status
        byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      });
      
      console.log("Task counts calculated:", {
        total: tasks.length,
        byProject,
        byStatus
      });
      
      set({ 
        taskCounts: {
          total: tasks.length,
          byProject,
          byStatus
        }
      });
    } catch (error) {
      console.error("Error refreshing task counts:", error);
    }
  }
});
