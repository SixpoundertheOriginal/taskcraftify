
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
    const instanceId = Math.random().toString(36).substring(2, 9);
    console.log(`[ProjectSubscription:${instanceId}] Setting up project subscription`);
    
    // Track subscription state
    let isSubscribed = false;
    let unsubscribeFunction: null | (() => void) = null;
    
    // Set up the project subscription
    function setupSubscription() {
      if (isSubscribed) {
        console.log(`[ProjectSubscription:${instanceId}] Subscription already active, skipping setup`);
        return;
      }
      
      try {
        // Initialize subscription to real-time updates
        unsubscribeFunction = ProjectService.subscribeToProjects((projects) => {
          console.log(`[ProjectSubscription:${instanceId}] Project subscription updated with ${projects.length} projects`);
          set({ projects });
          
          // Refresh task counts in the task store
          setTimeout(() => {
            try {
              const taskStore = useTaskStore.getState();
              console.log(`[ProjectSubscription:${instanceId}] Triggering task count refresh after project update`);
              if (taskStore && taskStore.refreshTaskCounts) {
                taskStore.refreshTaskCounts();
              }
            } catch (error) {
              console.error(`[ProjectSubscription:${instanceId}] Error refreshing task counts:`, error);
            }
          }, 100);
        });
        
        isSubscribed = true;
        
        // Listen for connection changes
        window.addEventListener('online', handleConnectionChange);
        
      } catch (error) {
        console.error(`[ProjectSubscription:${instanceId}] Error setting up project subscription:`, error);
        isSubscribed = false;
        
        // Attempt to reconnect on error
        setTimeout(() => {
          if (!isSubscribed) {
            console.log(`[ProjectSubscription:${instanceId}] Attempting to reconnect subscription after error`);
            setupSubscription();
          }
        }, 5000);
      }
    }
    
    // Handle network reconnection
    function handleConnectionChange() {
      if (window.navigator.onLine && !isSubscribed) {
        console.log(`[ProjectSubscription:${instanceId}] Network reconnected, reestablishing project subscription`);
        if (unsubscribeFunction) {
          unsubscribeFunction();
          unsubscribeFunction = null;
        }
        setupSubscription();
      }
    }
    
    // Initialize the subscription
    setupSubscription();
    
    // Return cleanup function
    return () => {
      console.log(`[ProjectSubscription:${instanceId}] Cleaning up project subscription`);
      
      window.removeEventListener('online', handleConnectionChange);
      
      if (unsubscribeFunction) {
        unsubscribeFunction();
        unsubscribeFunction = null;
      }
      
      isSubscribed = false;
    };
  },
});
