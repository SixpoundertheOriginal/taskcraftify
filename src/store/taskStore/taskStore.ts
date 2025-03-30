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
    (set, get, api) => {
      const taskSlice = createTaskSlice(set, get, api);
      const filterSlice = createFilterSlice(set, get, api);
      const subscriptionSlice = createSubscriptionSlice(set, get, api);
      const statsSlice = createStatsSlice(set, get, api);
      const attachmentSlice = createAttachmentSlice(set, get, api);
      
      return {
        ...taskSlice,
        ...filterSlice,
        ...subscriptionSlice,
        ...statsSlice,
        ...attachmentSlice,
        
        get filteredTasks() {
          return filterSlice.getFilteredTasks();
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
        
        getTasksCountByStatus: () => {
          const counts: Record<string, number> = {};
          
          Object.values(TaskStatus).forEach(status => {
            counts[status] = 0;
          });
          
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
          
          const completionDates = doneTasks.map(task => task.updatedAt);
          const earliestDate = new Date(Math.min(...completionDates.map(date => date.getTime())));
          const latestDate = new Date(Math.max(...completionDates.map(date => date.getTime())));
          
          const daysDiff = Math.max(
            1, 
            Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          );
          
          return Number((doneTasks.length / daysDiff).toFixed(1));
        },
        
        refreshTaskCounts: statsSlice.refreshTaskCounts,
        
        setTaskStatus: async (taskId: string, status: string): Promise<void> => {
          await taskSlice.updateTask({
            id: taskId,
            status: status as TaskStatus
          });
        },
        
        toggleSubtaskCompletion: async (subtaskId: string, completed: boolean): Promise<void> => {
          await taskSlice.updateSubtask({
            id: subtaskId,
            completed
          });
        },
        
        diagnosticDatabaseQuery: async () => {
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
