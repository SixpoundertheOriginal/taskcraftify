
import { TaskService } from '@/services/taskService';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';

export interface SubscriptionSlice {
  setupTaskSubscription: () => () => void;
}

export const createSubscriptionSlice: StateCreator<
  TaskStore,
  [],
  [],
  SubscriptionSlice
> = (set, get) => ({
  setupTaskSubscription: () => {
    console.log("Setting up task subscription");
    const unsubscribe = TaskService.subscribeToTasks((tasks) => {
      console.log("Task subscription updated with", tasks.length, "tasks");
      
      // Log task distribution by status
      const tasksByStatus: Record<string, number> = {};
      tasks.forEach(task => {
        tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      });
      console.log("Task counts by status after subscription update:", tasksByStatus);
      
      // Update the tasks in the store
      set({ tasks });
      
      // Force a complete refresh of task counts
      setTimeout(() => {
        console.log("Triggering explicit refreshTaskCounts after subscription update");
        const refreshTaskCounts = get().refreshTaskCounts;
        if (refreshTaskCounts) {
          refreshTaskCounts();
        } else {
          console.error("refreshTaskCounts not available in task store");
        }
      }, 100); // Shorter timeout for faster UI updates
    });
    
    return unsubscribe;
  },
});
