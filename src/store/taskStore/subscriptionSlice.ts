
import { TaskService } from '@/services/taskService';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';
import { toast } from '@/hooks/use-toast';

export interface SubscriptionSlice {
  setupTaskSubscription: () => () => void;
  isInitialLoadComplete: boolean;
  setInitialLoadComplete: (isComplete: boolean) => void;
}

export const createSubscriptionSlice: StateCreator<
  TaskStore,
  [],
  [],
  SubscriptionSlice
> = (set, get) => ({
  isInitialLoadComplete: false,
  
  setInitialLoadComplete: (isComplete: boolean) => {
    set({ isInitialLoadComplete: isComplete });
  },
  
  setupTaskSubscription: () => {
    console.log("[SubscriptionSlice] Setting up task subscription");
    
    // Track subscription state to prevent multiple subscriptions
    let isSubscribed = false;
    let subscriptionCleanup: (() => void) | null = null;
    let subscriptionTimeout: number | null = null;
    
    // Comprehensive cleanup function
    const cleanup = () => {
      console.log("[SubscriptionSlice] Cleaning up task subscription");
      
      if (subscriptionTimeout) {
        clearTimeout(subscriptionTimeout);
        subscriptionTimeout = null;
      }
      
      if (subscriptionCleanup) {
        subscriptionCleanup();
        subscriptionCleanup = null;
      }
      
      isSubscribed = false;
    };
    
    // Only proceed with setup if not already subscribed
    if (isSubscribed) {
      console.log("[SubscriptionSlice] Subscription already active, skipping setup");
      return cleanup;
    }
    
    // Set loading state only if initial load isn't complete
    if (!get().isInitialLoadComplete) {
      set({ isLoading: true });
    }
    
    // Perform initial data fetch
    const fetchTasks = get().fetchTasks;
    fetchTasks()
      .then(tasks => {
        console.log("[SubscriptionSlice] Initial tasks load complete with", tasks.length, "tasks");
        
        // Only set initial load complete if we haven't already done so
        if (!get().isInitialLoadComplete) {
          set({ 
            isInitialLoadComplete: true,
            isLoading: false 
          });
          
          // Force a refresh of task counts immediately after initial load
          const refreshTaskCounts = get().refreshTaskCounts;
          if (refreshTaskCounts) {
            refreshTaskCounts();
          }
        }
        
        // Set up the real-time subscription with a delay to avoid race conditions
        subscriptionTimeout = window.setTimeout(() => {
          if (isSubscribed) {
            console.log("[SubscriptionSlice] Subscription already active, not creating another");
            return;
          }
          
          console.log("[SubscriptionSlice] Setting up real-time subscription after delay");
          
          try {
            const unsubscribe = TaskService.subscribeToTasks((tasks) => {
              if (!Array.isArray(tasks)) {
                console.error("[SubscriptionSlice] Subscription received non-array tasks:", tasks);
                return;
              }
              
              // Don't process subscription updates until initial load is complete
              if (!get().isInitialLoadComplete) {
                console.log("[SubscriptionSlice] Ignoring subscription update - initial load not complete");
                return;
              }
              
              console.log("[SubscriptionSlice] Task subscription updated with", tasks.length, "tasks");
              
              // Check if tasks are different from what's in the store to avoid unnecessary updates
              const currentTasks = get().tasks;
              const tasksChanged = tasks.length !== currentTasks.length || 
                JSON.stringify(tasks.map(t => t.id).sort()) !== 
                JSON.stringify(currentTasks.map(t => t.id).sort());
              
              if (tasksChanged) {
                console.log("[SubscriptionSlice] Tasks have changed, updating store");
                // Save current filters
                const currentFilters = get().filters;
                
                // Update the tasks in the store
                set({ tasks });
                
                // Reapply saved filters to ensure filtered views are correctly updated
                set({ filters: { ...currentFilters } });
                
                // Force a refresh of task counts
                const refreshTaskCounts = get().refreshTaskCounts;
                if (refreshTaskCounts) {
                  refreshTaskCounts();
                }
              } else {
                console.log("[SubscriptionSlice] No changes in tasks detected, store update skipped");
              }
            });
            
            // Store the unsubscribe function for cleanup
            subscriptionCleanup = unsubscribe;
            isSubscribed = true;
            subscriptionTimeout = null;
          } catch (subError) {
            console.error("[SubscriptionSlice] Error setting up subscription:", subError);
            set({ 
              error: subError instanceof Error 
                ? subError.message 
                : 'Failed to set up real-time task updates' 
            });
            isSubscribed = false;
          }
        }, 300);
      })
      .catch(error => {
        console.error("[SubscriptionSlice] Error with initial tasks load:", error);
        set({ 
          isLoading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred loading tasks' 
        });
        
        toast({
          title: "Error loading tasks",
          description: "There was a problem loading your tasks. Please refresh the page.",
          variant: "destructive"
        });
      });
    
    // Return cleanup function
    return cleanup;
  },
});
