
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
      // Note: We use setTimeout because we can't directly import the store here
      setTimeout(() => {
        // Using the global store accessor is not type-safe, instead we'll
        // use an event-based approach to communicate between stores
        const taskStore = useTaskStore.getState();
        if (taskStore.refreshTaskCounts) {
          taskStore.refreshTaskCounts();
        }
      }, 100);
    });
    
    return unsubscribe;
  },
});
