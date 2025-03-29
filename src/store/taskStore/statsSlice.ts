
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';
import { TaskService } from '@/services/taskService';

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
      // Option 1: Calculate counts based on current tasks in the store
      const tasks = get().tasks;
      
      const byProject: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      
      tasks.forEach(task => {
        // Count by project
        const projectId = task.projectId || 'none';
        byProject[projectId] = (byProject[projectId] || 0) + 1;
        
        // Count by status
        byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      });
      
      set({ 
        taskCounts: {
          total: tasks.length,
          byProject,
          byStatus
        }
      });
      
      console.log("Task counts refreshed:", {
        total: tasks.length,
        byProject,
        byStatus
      });
      
      // Option 2: Direct database query for more accurate counts
      // Uncomment if you need to use the direct database query
      /*
      const result = await TaskService.directQueryTaskCounts();
      if (result.data) {
        console.log("Task counts from direct query:", result.data);
        set({
          taskCounts: {
            total: result.data.totalCount,
            byProject: result.data.projectCounts,
            byStatus: {} // Add status counts if available in the result
          }
        });
      }
      */
    } catch (error) {
      console.error("Error refreshing task counts:", error);
    }
  }
});
