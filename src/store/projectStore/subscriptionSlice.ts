
import { StateCreator } from 'zustand';
import { ProjectService } from '@/services/projectService';
import { ProjectStore } from './projectStore';
import { useTaskStore } from '@/store';

export interface SubscriptionSlice {
  setupProjectSubscription: () => (() => void);
}

export const createSubscriptionSlice: StateCreator<
  ProjectStore,
  [],
  [],
  SubscriptionSlice
> = (set, get) => ({
  setupProjectSubscription: () => {
    console.log("Setting up project subscription");
    // Initialize subscription to real-time updates
    const unsubscribe = ProjectService.subscribeToProjects((projects) => {
      console.log("Project subscription updated with", projects.length, "projects");
      set({ projects });
      
      // Get the taskStore to refresh counts
      // Note: We use this approach because we can't directly import the store here
      setTimeout(() => {
        // This will access the task store from the window scope to avoid import cycles
        const taskStore = window.document.__ZUSTAND_STORE__?.getState?.();
        if (taskStore?.refreshTaskCounts) {
          taskStore.refreshTaskCounts();
        }
      }, 100);
    });
    
    return unsubscribe;
  },
});
