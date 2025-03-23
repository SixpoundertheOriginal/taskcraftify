
import { StateCreator } from 'zustand';
import { ProjectService } from '@/services/projectService';
import { ProjectStore } from './projectStore';

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
    });
    
    return unsubscribe;
  },
});
