
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
      set({ tasks });
      
      // Explicitly refresh task counts whenever new task data comes in
      setTimeout(() => {
        // Use setTimeout to ensure the state update has completed
        const refreshTaskCounts = get().refreshTaskCounts;
        if (refreshTaskCounts) {
          refreshTaskCounts();
        }
      }, 100);
    });
    
    return unsubscribe;
  },
});
