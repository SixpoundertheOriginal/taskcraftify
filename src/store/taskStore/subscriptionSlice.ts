
import { StateCreator } from 'zustand';
import { Task } from '@/types/task';
import { TaskService } from '@/services/taskService';
import { ensureStorageBucket } from '@/utils/setupStorage';
import { toast } from '@/hooks/use-toast';

export interface SubscriptionSlice {
  isInitialLoadComplete: boolean;
  setInitialLoadComplete: (complete: boolean) => void;
  setupTaskSubscription: () => (() => void);
}

export const createSubscriptionSlice: StateCreator<
  SubscriptionSlice,
  [],
  [],
  SubscriptionSlice
> = (set, get) => ({
  isInitialLoadComplete: false,
  
  setInitialLoadComplete: (complete: boolean) => {
    set({ isInitialLoadComplete: complete });
  },
  
  setupTaskSubscription: (): (() => void) => {
    console.log("Setting up realtime subscription to tasks table");
    
    // Ensure storage bucket exists (don't wait for it)
    ensureStorageBucket('task-attachments', true).then(success => {
      if (success) {
        console.log("Task attachments storage bucket is ready");
      } else {
        console.warn("Failed to ensure task attachments storage bucket exists");
        // Notify user about potential storage issues
        toast({
          title: "Storage Setup",
          description: "There might be issues with file attachments. Please try again later.",
          variant: "destructive"
        });
        
        // Try one more time with a delay
        setTimeout(() => {
          ensureStorageBucket('task-attachments', true).then(retrySuccess => {
            console.log("Retry bucket creation result:", retrySuccess ? "success" : "failed");
            if (retrySuccess) {
              toast({
                title: "Storage Setup",
                description: "File attachment storage is now ready.",
              });
            }
          });
        }, 2000);
      }
    });
    
    // Set up the subscription
    const unsubscribe = TaskService.subscribeToTasks((tasks: Task[]) => {
      console.log(`Received ${tasks.length} tasks from subscription`);
      
      // Update tasks in the store (dispatch to a relevant action)
      // This needs to be expanded based on your state management pattern
      set(state => ({
        isInitialLoadComplete: true
      }));
    });
    
    return unsubscribe;
  }
});
