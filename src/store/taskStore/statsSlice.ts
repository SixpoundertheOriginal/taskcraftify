
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
    byStatus: {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      ARCHIVED: 0,
      BACKLOG: 0
    }
  },
  
  refreshTaskCounts: async () => {
    console.log("[StatsSlice] Refreshing task counts");
    
    try {
      // Calculate counts based on current tasks in the store, filtering out removed tasks
      const tasks = get().tasks.filter(task => !task._isRemoved);
      
      console.log(`[StatsSlice] Calculating counts for ${tasks.length} visible tasks in store`);
      
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
        
        // Count by status (ensure task.status is valid)
        if (task.status) {
          byStatus[task.status] = (byStatus[task.status] || 0) + 1;
        } else {
          // Default to TODO status if for some reason task.status is missing
          byStatus[TaskStatus.TODO] = (byStatus[TaskStatus.TODO] || 0) + 1;
        }
      });
      
      console.log("[StatsSlice] Task counts calculated:", {
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
      console.error("[StatsSlice] Error refreshing task counts:", error);
    }
  }
});
