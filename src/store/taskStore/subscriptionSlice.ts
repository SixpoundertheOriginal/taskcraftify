
import { TaskService } from '@/services/taskService';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';

export interface SubscriptionSlice {
  setupTaskSubscription: () => () => void;
}

export const createSubscriptionSlice: StateCreator<TaskStore, [], [], SubscriptionSlice> = (set) => ({
  setupTaskSubscription: () => {
    return TaskService.subscribeToTasks((tasks) => {
      set({ tasks });
    });
  },
});
