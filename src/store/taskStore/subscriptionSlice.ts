
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
      
      // Log task distribution by project
      const tasksByProject: Record<string, number> = {};
      tasks.forEach(task => {
        const projectId = task.projectId || 'none';
        tasksByProject[projectId] = (tasksByProject[projectId] || 0) + 1;
      });
      
      console.log("Task counts by project after subscription update:", tasksByProject);
      
      // Update the tasks in the store
      set({ tasks });
      
      // Force a complete refresh
      setTimeout(() => {
        console.log("Triggering explicit refreshTaskCounts after subscription update");
        const refreshTaskCounts = get().refreshTaskCounts;
        if (refreshTaskCounts) {
          refreshTaskCounts();
        } else {
          console.error("refreshTaskCounts not available in task store");
        }
      }, 300);
    });
    
    return unsubscribe;
  },
});
