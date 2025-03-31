
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
  
  // Single task retrieval
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
        
        get filteredTasks() {
          return filterSlice.getFilteredTasks();
        },
        
        fetchTask: async (taskId: string): Promise<Task | undefined> => {
          try {
            const existingTask = get().tasks.find(t => t.id === taskId);
            
            const updatedTask = await taskSlice.fetchTask(taskId);
            
            if (updatedTask) {
              await attachmentSlice.fetchTaskAttachments(taskId);
              await taskSlice.fetchComments(taskId);
              await taskSlice.fetchActivities(taskId);
              
              return updatedTask;
            }
            
            return existingTask;
          } catch (error) {
            console.error("Error fetching single task:", error);
            return undefined;
          }
        },
        
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
            isAfter(task.dueDate, weekStart) && 
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
        
        getTasksCountByStatus: () => {
          const counts: Record<string, number> = {};
          const allStatuses = Object.values(TaskStatus);
          
          // Initialize all status counts to 0
          allStatuses.forEach(status => {
            counts[status] = 0;
          });
          
          // Count tasks by status
          taskSlice.tasks.forEach(task => {
            counts[task.status] = (counts[task.status] || 0) + 1;
          });
          
          return counts;
        },
        
        getAverageDailyCompletionRate: () => {
          const completedTasks = taskSlice.tasks.filter(task => task.status === TaskStatus.DONE);
          if (completedTasks.length === 0) return 0;
          
          const oldestCompletionDate = completedTasks.reduce((oldest, task) => {
            const updatedAt = new Date(task.updatedAt);
            return updatedAt < oldest ? updatedAt : oldest;
          }, new Date());
          
          const now = new Date();
          const daysDifference = Math.max(1, Math.ceil((now.getTime() - oldestCompletionDate.getTime()) / (1000 * 60 * 60 * 24)));
          
          return completedTasks.length / daysDifference;
        }
      };
    },
    { name: 'task-store' }
  )
);
