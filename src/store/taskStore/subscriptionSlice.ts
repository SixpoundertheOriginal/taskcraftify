
import { TaskService } from '@/services/taskService';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';

export interface SubscriptionSlice {
  setupTaskSubscription: () => () => void;
}

export const createSubscriptionSlice: StateCreator<TaskStore, [], [], SubscriptionSlice> = (set) => ({
  setupTaskSubscription: () => {
    console.log("Setting up task subscription");
    const unsubscribe = TaskService.subscribeToTasks((tasks) => {
      console.log("Task subscription updated with", tasks.length, "tasks");
      set({ tasks });
    });
    
    return unsubscribe;
  },
});
