
import { TaskService } from '@/services/taskService';
import { StateCreator } from 'zustand';
import { TaskStore } from './taskStore';

export interface SubscriptionSlice {
  setupTaskSubscription: () => () => void;
}

export const createSubscriptionSlice: StateCreator<
  TaskStore,
  [],
  [],
  SubscriptionSlice
> = (set, get) => ({
  setupTaskSubscription: () => {
    console.log("Setting up task subscription");
    
    // First, load tasks explicitly to ensure we have initial data
    const fetchTasks = get().fetchTasks;
    fetchTasks().then(tasks => {
      console.log("Initial tasks load complete with", tasks.length, "tasks");
      console.log("Task sample:", tasks.length > 0 ? tasks[0] : "No tasks available");
      
      // Force a refresh of task counts immediately after initial load
      const refreshTaskCounts = get().refreshTaskCounts;
      if (refreshTaskCounts) {
        console.log("Explicitly refreshing task counts after initial load");
        refreshTaskCounts();
      }
    }).catch(error => {
      console.error("Error with initial tasks load:", error);
    });
    
    // Then set up the subscription for real-time updates
    const unsubscribe = TaskService.subscribeToTasks((tasks) => {
      if (!Array.isArray(tasks)) {
        console.error("Subscription received non-array tasks:", tasks);
        return;
      }
      
      console.log("Task subscription updated with", tasks.length, "tasks");
      console.log("Subscription task sample:", tasks.length > 0 ? tasks[0] : "No tasks available");
      
      // Log task distribution by status
      const tasksByStatus: Record<string, number> = {};
      tasks.forEach(task => {
        tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      });
      console.log("Task counts by status after subscription update:", tasksByStatus);
      
      // Check if tasks are different from what's in the store
      const currentTasks = get().tasks;
      const tasksChanged = tasks.length !== currentTasks.length || 
        JSON.stringify(tasks.map(t => t.id).sort()) !== 
        JSON.stringify(currentTasks.map(t => t.id).sort());
      
      if (tasksChanged) {
        console.log("Tasks have changed, updating store");
        // Update the tasks in the store
        set({ tasks });
        
        // Force a complete refresh of task counts immediately
        const refreshTaskCounts = get().refreshTaskCounts;
        if (refreshTaskCounts) {
          console.log("Refreshing task counts after subscription update");
          refreshTaskCounts();
        } else {
          console.error("refreshTaskCounts not available in task store");
        }
      } else {
        console.log("No changes in tasks detected, store update skipped");
      }
    });
    
    return unsubscribe;
  },
});
