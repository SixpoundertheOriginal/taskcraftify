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
    
    // First, load tasks explicitly to ensure we have initial data
    const fetchTasks = get().fetchTasks;
    set({ isLoading: true }); // Start loading state
    
    // Keep track of cleanup functions
    let subscriptionCleanup: (() => void) | null = null;
    let subscriptionTimeout: number | null = null;
    
    // Cleanup function
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
      
      set({ isInitialLoadComplete: false });
    };
    
    // Before setting up a new subscription, perform the initial fetch
    const initialPromise = fetchTasks()
      .then(tasks => {
        console.log("[SubscriptionSlice] Initial tasks load complete with", tasks.length, "tasks");
        
        if (tasks.length > 0) {
          console.log("[SubscriptionSlice] Task sample:", tasks[0]);
        } else {
          console.log("[SubscriptionSlice] No tasks available in initial load");
        }
        
        // Force a refresh of task counts immediately after initial load
        const refreshTaskCounts = get().refreshTaskCounts;
        if (refreshTaskCounts) {
          console.log("[SubscriptionSlice] Explicitly refreshing task counts after initial load");
          refreshTaskCounts();
        }
        
        // Mark initial load as complete to prevent race conditions
        set({ 
          isInitialLoadComplete: true,
          isLoading: false 
        });
        
        return tasks;
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
        
        throw error; // Re-throw to indicate failure
      });
    
    // Set up the real-time subscription AFTER initial load completes
    initialPromise.then(() => {
      if (get().isInitialLoadComplete) {
        // Initial load was successful, set up subscription with a small delay
        subscriptionTimeout = window.setTimeout(() => {
          console.log("[SubscriptionSlice] Setting up real-time subscription after delay");
          
          // Then set up the subscription for real-time updates
          try {
            const unsubscribe = TaskService.subscribeToTasks((tasks) => {
              if (!Array.isArray(tasks)) {
                console.error("[SubscriptionSlice] Subscription received non-array tasks:", tasks);
                return;
              }
              
              // Don't process subscription updates until initial load is complete
              if (!get().isInitialLoadComplete) {
                console.log("[SubscriptionSlice] Ignoring subscription update because initial load is not complete");
                return;
              }
              
              console.log("[SubscriptionSlice] Task subscription updated with", tasks.length, "tasks");
              
              if (tasks.length > 0) {
                console.log("[SubscriptionSlice] Subscription task sample:", tasks[0]);
              } else {
                console.log("[SubscriptionSlice] No tasks available in subscription update");
              }
              
              // Log task distribution by status
              const tasksByStatus: Record<string, number> = {};
              tasks.forEach(task => {
                tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
              });
              console.log("[SubscriptionSlice] Task counts by status after subscription update:", tasksByStatus);
              
              // Check if tasks are different from what's in the store
              const currentTasks = get().tasks;
              const tasksChanged = tasks.length !== currentTasks.length || 
                JSON.stringify(tasks.map(t => t.id).sort()) !== 
                JSON.stringify(currentTasks.map(t => t.id).sort());
              
              if (tasksChanged) {
                console.log("[SubscriptionSlice] Tasks have changed, updating store");
                // Update the tasks in the store
                set({ tasks });
                
                // Force a complete refresh of task counts immediately
                const refreshTaskCounts = get().refreshTaskCounts;
                if (refreshTaskCounts) {
                  console.log("[SubscriptionSlice] Refreshing task counts after subscription update");
                  refreshTaskCounts();
                } else {
                  console.error("[SubscriptionSlice] refreshTaskCounts not available in task store");
                }
              } else {
                console.log("[SubscriptionSlice] No changes in tasks detected, store update skipped");
              }
            });
            
            // Store the unsubscribe function for cleanup
            subscriptionCleanup = unsubscribe;
            
            // Clear the timeout reference
            subscriptionTimeout = null;
          } catch (subError) {
            console.error("[SubscriptionSlice] Error setting up subscription:", subError);
            set({ 
              error: subError instanceof Error 
                ? subError.message 
                : 'Failed to set up real-time task updates' 
            });
          }
        }, 300); // Small delay to avoid race conditions
      } else {
        console.warn("[SubscriptionSlice] Initial load was marked as incomplete, not setting up subscription");
      }
    }).catch(err => {
      console.error("[SubscriptionSlice] Not setting up subscription due to initial load failure:", err);
    });
    
    // Return cleanup function
    return cleanup;
  },
});
