
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskSlice, createTaskSlice } from './taskSlice';
import { FilterSlice, createFilterSlice } from './filterSlice';
import { SubscriptionSlice, createSubscriptionSlice } from './subscriptionSlice';
import { StatsSlice, createStatsSlice } from './statsSlice';
import { AttachmentSlice, createAttachmentSlice } from './attachmentSlice';
import { isAfter, isBefore, startOfTomorrow, endOfTomorrow, startOfToday, endOfToday, startOfWeek, endOfWeek, addDays } from 'date-fns';

export type TaskStore = TaskSlice & FilterSlice & SubscriptionSlice & StatsSlice & AttachmentSlice & {
  filteredTasks: Task[];
  refreshTaskCounts: () => void;
  setTaskStatus: (taskId: string, status: string) => Promise<void>;
  toggleSubtaskCompletion: (subtaskId: string, completed: boolean) => Promise<void>;
  diagnosticDatabaseQuery?: () => Promise<any>;
  
  // Date-based task retrieval methods
  getOverdueTasks: () => Task[];
  getTasksDueToday: () => Task[];
  getTasksDueTomorrow: () => Task[];
  getTasksDueThisWeek: () => Task[];
  getHighPriorityTasks: () => Task[];
  
  // Stats methods
  getTasksCountByStatus: () => Record<string, number>;
  getAverageDailyCompletionRate: () => number;
};

export const useTaskStore = create<TaskStore>()(
  devtools(
    (...a) => {
      const taskSlice = createTaskSlice(...a);
      const filterSlice = createFilterSlice(...a);
      const subscriptionSlice = createSubscriptionSlice(...a);
      const statsSlice = createStatsSlice(...a);
      const attachmentSlice = createAttachmentSlice(...a);
      
      // Implement the combined store with additional methods
      return {
        ...taskSlice,
        ...filterSlice,
        ...subscriptionSlice,
        ...statsSlice,
        ...attachmentSlice,
        
        // Define additional computed properties and methods
        get filteredTasks() {
          return filterSlice.getFilteredTasks();
        },
        
        // Task due date helpers
        getOverdueTasks: () => {
          const now = new Date();
          return taskSlice.tasks.filter(task => 
            task.dueDate && 
            isBefore(task.dueDate, now) && 
            task.status !== TaskStatus.DONE && 
            task.status !== TaskStatus.ARCHIVED
          );
        },
        
        getTasksDueToday: () => {
          const today = startOfToday();
          const endOfDay = endOfToday();
          
          return taskSlice.tasks.filter(task => 
            task.dueDate && 
            isAfter(task.dueDate, today) && 
            isBefore(task.dueDate, endOfDay) &&
            task.status !== TaskStatus.DONE && 
            task.status !== TaskStatus.ARCHIVED
          );
        },
        
        getTasksDueTomorrow: () => {
          const tomorrow = startOfTomorrow();
          const endOfTomorrowDay = endOfTomorrow();
          
          return taskSlice.tasks.filter(task => 
            task.dueDate && 
            isAfter(task.dueDate, tomorrow) && 
            isBefore(task.dueDate, endOfTomorrowDay) &&
            task.status !== TaskStatus.DONE && 
            task.status !== TaskStatus.ARCHIVED
          );
        },
        
        getTasksDueThisWeek: () => {
          const today = startOfToday();
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
          const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // End on Sunday
          
          return taskSlice.tasks.filter(task => 
            task.dueDate && 
            isAfter(task.dueDate, today) && 
            isBefore(task.dueDate, weekEnd) &&
            task.status !== TaskStatus.DONE && 
            task.status !== TaskStatus.ARCHIVED
          );
        },
        
        getHighPriorityTasks: () => {
          return taskSlice.tasks.filter(task => 
            (task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT) &&
            task.status !== TaskStatus.DONE && 
            task.status !== TaskStatus.ARCHIVED
          );
        },
        
        // Stats methods
        getTasksCountByStatus: () => {
          const counts: Record<string, number> = {};
          
          // Initialize all statuses with 0
          Object.values(TaskStatus).forEach(status => {
            counts[status] = 0;
          });
          
          // Count tasks by status
          taskSlice.tasks.forEach(task => {
            counts[task.status] = (counts[task.status] || 0) + 1;
          });
          
          return counts;
        },
        
        getAverageDailyCompletionRate: () => {
          const doneTasks = taskSlice.tasks.filter(task => task.status === TaskStatus.DONE);
          
          if (doneTasks.length === 0) {
            return 0;
          }
          
          // Get the earliest and latest completion dates
          const completionDates = doneTasks.map(task => task.updatedAt);
          const earliestDate = new Date(Math.min(...completionDates.map(date => date.getTime())));
          const latestDate = new Date(Math.max(...completionDates.map(date => date.getTime())));
          
          // Calculate date difference in days (add 1 to include the first day)
          const daysDiff = Math.max(
            1, 
            Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          );
          
          return Number((doneTasks.length / daysDiff).toFixed(1));
        },
        
        // These methods simply forward to the appropriate slices
        // They're needed here to satisfy the TaskStore type
        refreshTaskCounts: statsSlice.refreshTaskCounts,
        
        setTaskStatus: async (taskId: string, status: string) => {
          return taskSlice.updateTask({
            id: taskId,
            status: status as TaskStatus
          });
        },
        
        toggleSubtaskCompletion: async (subtaskId: string, completed: boolean) => {
          return taskSlice.updateSubtask({
            id: subtaskId,
            completed
          });
        },
        
        // Optional diagnostic method
        diagnosticDatabaseQuery: async () => {
          // This could be implemented to perform diagnostic queries
          // For now, we return a simple object with the task counts
          return {
            taskCounts: statsSlice.taskCounts,
            tasksByStatus: taskSlice.tasks.reduce((acc, task) => {
              acc[task.status] = (acc[task.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          };
        }
      };
    }
  )
);
