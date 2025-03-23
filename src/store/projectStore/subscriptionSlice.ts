
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
      setTimeout(() => {
        try {
          const taskStore = useTaskStore.getState();
          console.log("Triggering task count refresh after project update");
          if (taskStore && taskStore.refreshTaskCounts) {
            taskStore.refreshTaskCounts();
          } else {
            console.error("Could not access task store or refreshTaskCounts function");
          }
        } catch (error) {
          console.error("Error refreshing task counts:", error);
        }
      }, 100);
    });
    
    return unsubscribe;
  },
});
