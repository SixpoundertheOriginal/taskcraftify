import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskSlice, createTaskSlice } from './taskSlice';
import { FilterSlice, createFilterSlice } from './filterSlice';
import { SubscriptionSlice, createSubscriptionSlice } from './subscriptionSlice';
import { StatsSlice, createStatsSlice } from './statsSlice';
import { AttachmentSlice, createAttachmentSlice } from './attachmentSlice';
import { 
  isAfter, 
  isBefore, 
  startOfTomorrow, 
  endOfTomorrow, 
  startOfToday, 
  endOfToday, 
  startOfWeek, 
  endOfWeek, 
  addDays,
  isToday,
  isTomorrow,
  isThisWeek,
  isPast,
  parseISO
} from 'date-fns';

export type TaskStore = TaskSlice & FilterSlice & SubscriptionSlice & StatsSlice & AttachmentSlice & {
  // Change filteredTasks from a property to a method
  getFilteredTasks: () => Task[];
  setTaskStatus: (taskId: string, status: string) => Promise<void>;
  toggleSubtaskCompletion: (subtaskId: string, completed: boolean) => Promise<void>;
  diagnosticDatabaseQuery?: () => Promise<any>;
  
  getTasksCountByStatus: () => Record<string, number>;
  getAverageDailyCompletionRate: () => number;
  
  getTasksDueToday: () => Task[];
  getOverdueTasks: () => Task[];
  
  fetchTask: (taskId: string) => Promise<Task | undefined>;
};

export const useTaskStore = create<TaskStore>()(
  devtools(
    (...args) => {
      const [set, get, store] = args;
      
      const taskSlice = createTaskSlice(set, get, store);
      const filterSlice = createFilterSlice(set, get, store);
      const subscriptionSlice = createSubscriptionSlice(set, get, store);
      const statsSlice = createStatsSlice(set, get, store);
      const attachmentSlice = createAttachmentSlice(set, get, store);
      
      return {
        ...taskSlice,
        ...filterSlice,
        ...subscriptionSlice,
        ...statsSlice,
        ...attachmentSlice,
        
        // Improved getFilteredTasks to handle edge cases
        getFilteredTasks: () => {
          console.log("[TaskStore] Computing filteredTasks, tasks count:", taskSlice.tasks.length);
          
          // Safety check for tasks array
          if (!Array.isArray(taskSlice.tasks)) {
            console.error("[TaskStore] Tasks is not an array:", taskSlice.tasks);
            return [];
          }
          
          // Filter out tasks that are marked as visually removed
          const visibleTasks = taskSlice.tasks.filter(task => !task._isRemoved);
          console.log(`[TaskStore] After removing _isRemoved tasks: ${visibleTasks.length} tasks remain`);
          
          // Use the filter slice to get filtered tasks
          const result = filterSlice.getFilteredTasks(visibleTasks);
          console.log(`[TaskStore] Final filtered tasks count: ${result.length}`);
          return result;
        },
        
        // Use statsSlice.refreshTaskCounts with no arguments
        refreshTaskCounts: () => statsSlice.refreshTaskCounts(),
        
        setTaskStatus: async (taskId: string, status: string): Promise<void> => {
          try {
            const taskStatus = status as TaskStatus;
            
            if (!Object.values(TaskStatus).includes(taskStatus)) {
              throw new Error(`Invalid task status: ${status}`);
            }
            
            await taskSlice.updateTask({
              id: taskId,
              status: taskStatus
            });
            
            // Refresh task counts after updating task status
            statsSlice.refreshTaskCounts();
          } catch (error) {
            console.error("[TaskStore] Error setting task status:", error);
            throw error;
          }
        },
        
        toggleSubtaskCompletion: async (subtaskId: string, completed: boolean): Promise<void> => {
          try {
            await taskSlice.updateSubtask({
              id: subtaskId,
              completed
            });
          } catch (error) {
            console.error("Error toggling subtask completion:", error);
            throw error;
          }
        },
        
        fetchTask: async (taskId: string): Promise<Task | undefined> => {
          try {
            console.log(`[TaskStore] Fetching task with ID: ${taskId}`);
            
            const existingTask = get().tasks.find(t => t.id === taskId);
            
            const updatedTask = await taskSlice.fetchTask(taskId);
            
            if (updatedTask) {
              console.log(`[TaskStore] Task ${taskId} fetched successfully, loading attachments and details`);
              
              const results = await Promise.allSettled([
                attachmentSlice.fetchTaskAttachments(taskId).catch(err => {
                  console.error(`Error fetching attachments for task ${taskId}:`, err);
                  return null;
                }),
                taskSlice.fetchComments(taskId).catch(err => {
                  console.error(`Error fetching comments for task ${taskId}:`, err);
                  return null;
                }),
                taskSlice.fetchActivities(taskId).catch(err => {
                  console.error(`Error fetching activities for task ${taskId}:`, err);
                  return null;
                })
              ]);
              
              results.forEach((result, index) => {
                if (result.status === 'rejected') {
                  const operations = ['attachments', 'comments', 'activities'];
                  console.error(`Failed to load ${operations[index]} for task ${taskId}:`, result.reason);
                }
              });
              
              // Refresh task counts after fetching task
              statsSlice.refreshTaskCounts();
              
              return updatedTask;
            }
            
            console.log(`[TaskStore] Failed to fetch updated task ${taskId}, returning existing data if available`);
            return existingTask;
          } catch (error) {
            console.error("Error in TaskStore.fetchTask:", error);
            return get().tasks.find(t => t.id === taskId);
          }
        },
        
        getTasksCountByStatus: () => {
          const counts: Record<string, number> = {};
          const allStatuses = Object.values(TaskStatus);
          
          allStatuses.forEach(status => {
            counts[status] = 0;
          });
          
          taskSlice.tasks.forEach(task => {
            if (task._isRemoved) return; // Skip removed tasks
            counts[task.status] = (counts[task.status] || 0) + 1;
          });
          
          return counts;
        },
        
        getAverageDailyCompletionRate: () => {
          const completedTasks = taskSlice.tasks.filter(task => 
            !task._isRemoved && task.status === TaskStatus.DONE
          );
          if (completedTasks.length === 0) return 0;
          
          const oldestCompletionDate = completedTasks.reduce((oldest, task) => {
            const updatedAt = new Date(task.updatedAt);
            return updatedAt < oldest ? updatedAt : oldest;
          }, new Date());
          
          const now = new Date();
          const daysDifference = Math.max(1, Math.ceil((now.getTime() - oldestCompletionDate.getTime()) / (1000 * 60 * 60 * 24)));
          
          return completedTasks.length / daysDifference;
        },
        
        getTasksDueToday: () => {
          console.log("[TaskStore] Getting tasks due today");
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          return taskSlice.tasks.filter(task => {
            // Skip removed tasks
            if (task._isRemoved) return false;
            
            // Skip completed or archived tasks
            if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) return false;
            
            // Skip tasks without due dates
            if (!task.dueDate) return false;
            
            try {
              // Parse date safely
              const dueDate = new Date(task.dueDate);
              
              // Check if due date is today
              const isTaskDueToday = dueDate >= today && dueDate < tomorrow;
              
              return isTaskDueToday;
            } catch (e) {
              console.error("Error parsing due date:", e);
              return false;
            }
          });
        },
        
        getOverdueTasks: () => {
          console.log("[TaskStore] Getting overdue tasks");
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          return taskSlice.tasks.filter(task => {
            // Skip removed tasks
            if (task._isRemoved) return false;
            
            // Skip completed or archived tasks
            if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) return false;
            
            // Skip tasks without due dates
            if (!task.dueDate) return false;
            
            try {
              // Parse date safely
              const dueDate = new Date(task.dueDate);
              
              // Check if due date is in the past (before today)
              return dueDate < today;
            } catch (e) {
              console.error("Error parsing due date:", e);
              return false;
            }
          });
        }
      };
    },
    { name: 'task-store' }
  )
);
