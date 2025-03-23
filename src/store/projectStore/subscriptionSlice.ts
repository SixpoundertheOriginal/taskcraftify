
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
    // Initialize subscription to real-time updates
    const unsubscribe = ProjectService.subscribeToProjects((projects) => {
      set({ projects });
    });
    
    return unsubscribe;
  },
});
