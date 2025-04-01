
import { StateCreator } from 'zustand';
import { ProjectStore } from './projectStore';
import { ProjectService } from '@/services/projectService';

export interface SubscriptionSlice {
  isSubscribed: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}

export const createSubscriptionSlice: StateCreator<ProjectStore, [], [], SubscriptionSlice> = (set, get) => {
  let unsubscribeFn: (() => void) | null = null;
  
  return {
    isSubscribed: false,
    
    subscribe: () => {
      const { isSubscribed, fetchProjects } = get();
      
      if (isSubscribed) {
        return;
      }
      
      console.log("Subscribing to project changes...");
      
      // First, fetch the latest projects
      fetchProjects();
      
      // Then, set up the subscription
      unsubscribeFn = ProjectService.subscribeToProjects((projects) => {
        console.log("Project changes detected, updating projects...", projects);
        set({ projects });
      });
      
      set({ isSubscribed: true });
    },
    
    unsubscribe: () => {
      if (unsubscribeFn) {
        console.log("Unsubscribing from project changes...");
        unsubscribeFn();
        unsubscribeFn = null;
        set({ isSubscribed: false });
      }
    },
  };
};
