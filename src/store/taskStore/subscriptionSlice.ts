
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
    const instanceId = Math.random().toString(36).substring(2, 9);
    console.log(`[SubscriptionSlice:${instanceId}] Setting up task subscription`);
    
    // Track subscription state
    let isSubscribed = false;
    let unsubscribeFunction: null | (() => void) = null;
    
    // Simple cleanup function
    const cleanup = () => {
      console.log(`[SubscriptionSlice:${instanceId}] Cleaning up task subscription`);
      
      if (unsubscribeFunction) {
        unsubscribeFunction();
        unsubscribeFunction = null;
      }
      
      isSubscribed = false;
    };
    
    // Only set loading state if initial load isn't complete
    if (!get().isInitialLoadComplete) {
      set({ isLoading: true });
    }
    
    // Initial data fetch
    get().fetchTasks()
      .then(tasks => {
        console.log(`[SubscriptionSlice:${instanceId}] Initial tasks load complete with ${tasks.length} tasks`);
        
        if (!get().isInitialLoadComplete) {
          set({ 
            isInitialLoadComplete: true,
            isLoading: false 
          });
          
          // Force a refresh of task counts
          get().refreshTaskCounts();
        }
        
        // Setup realtime subscription
        setupRealtimeSubscription();
      })
      .catch(error => {
        console.error(`[SubscriptionSlice:${instanceId}] Error with initial tasks load:`, error);
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
    
    // Function to set up realtime subscription
    function setupRealtimeSubscription() {
      if (isSubscribed) {
        console.log(`[SubscriptionSlice:${instanceId}] Subscription already active, skipping setup`);
        return;
      }
      
      console.log(`[SubscriptionSlice:${instanceId}] Setting up realtime subscription`);
      
      try {
        // Create Supabase channel subscription
        unsubscribeFunction = TaskService.subscribeToTasks((tasks) => {
          if (!Array.isArray(tasks)) {
            console.error(`[SubscriptionSlice:${instanceId}] Subscription received non-array tasks:`, tasks);
            return;
          }
          
          // Only process updates after initial load is complete
          if (!get().isInitialLoadComplete) {
            console.log(`[SubscriptionSlice:${instanceId}] Ignoring subscription update - initial load not complete`);
            return;
          }
          
          console.log(`[SubscriptionSlice:${instanceId}] Task subscription updated with ${tasks.length} tasks`);
          
          // Determine if tasks have changed to avoid unnecessary updates
          const currentTasks = get().tasks;
          const tasksChanged = hasTasksChanged(currentTasks, tasks);
          
          if (tasksChanged) {
            console.log(`[SubscriptionSlice:${instanceId}] Tasks have changed, updating store`);
            updateTasksInStore(tasks);
          } else {
            console.log(`[SubscriptionSlice:${instanceId}] No changes in tasks detected, store update skipped`);
          }
        });
        
        isSubscribed = true;
        
        // Listen for subscription status events
        window.addEventListener('online', handleConnectionChange);
        
      } catch (error) {
        console.error(`[SubscriptionSlice:${instanceId}] Error setting up subscription:`, error);
        set({ 
          error: error instanceof Error 
            ? error.message 
            : 'Failed to set up real-time task updates' 
        });
        isSubscribed = false;
        
        // Attempt to reconnect on error
        setTimeout(() => {
          if (!isSubscribed) {
            console.log(`[SubscriptionSlice:${instanceId}] Attempting to reconnect subscription after error`);
            setupRealtimeSubscription();
          }
        }, 5000); // Try reconnecting after 5 seconds
      }
    }
    
    // Helper function to handle online/offline status
    function handleConnectionChange() {
      if (window.navigator.onLine && !isSubscribed) {
        console.log(`[SubscriptionSlice:${instanceId}] Network reconnected, reestablishing subscription`);
        cleanup(); // Clean up any existing subscription attempts
        setupRealtimeSubscription();
      }
    }
    
    // Helper function to check if tasks have changed
    function hasTasksChanged(currentTasks, newTasks) {
      if (currentTasks.length !== newTasks.length) return true;
      
      const currentIds = new Set(currentTasks.map(t => t.id));
      const newIds = new Set(newTasks.map(t => t.id));
      
      // Quick check if the number of unique IDs differs
      if (currentIds.size !== newIds.size) return true;
      
      // Check if all new task IDs exist in current tasks
      for (const id of newIds) {
        if (!currentIds.has(id)) return true;
      }
      
      // Check if any task data has changed by comparing relevant fields
      for (const newTask of newTasks) {
        const currentTask = currentTasks.find(t => t.id === newTask.id);
        if (!currentTask) return true;
        
        // Check critical fields for changes
        if (
          newTask.title !== currentTask.title ||
          newTask.status !== currentTask.status ||
          newTask.priority !== currentTask.priority ||
          JSON.stringify(newTask.tags) !== JSON.stringify(currentTask.tags) ||
          newTask.updatedAt !== currentTask.updatedAt
        ) {
          return true;
        }
      }
      
      return false;
    }
    
    // Helper function to update tasks in store and refresh counts
    function updateTasksInStore(tasks) {
      // Save current filters
      const currentFilters = get().filters;
      
      // Update the tasks in the store
      set({ tasks });
      
      // Reapply saved filters to ensure filtered views are correctly updated
      set({ filters: { ...currentFilters } });
      
      // Force a refresh of task counts
      get().refreshTaskCounts();
    }
    
    // Enhanced cleanup function
    return () => {
      console.log(`[SubscriptionSlice:${instanceId}] Unsubscribing from task updates`);
      
      window.removeEventListener('online', handleConnectionChange);
      
      cleanup();
    };
  },
});
