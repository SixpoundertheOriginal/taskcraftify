import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskSlice, createTaskSlice } from './taskSlice';
import { FilterSlice, createFilterSlice } from './filterSlice';
import { SubscriptionSlice, createSubscriptionSlice } from './subscriptionSlice';
import { StatsSlice, createStatsSlice } from './statsSlice';
import { AttachmentSlice, createAttachmentSlice } from './attachmentSlice';
import { getValidDate } from '@/utils/task';
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
  filteredTasks: Task[];
  refreshTaskCounts: () => void;
  setTaskStatus: (taskId: string, status: string) => Promise<void>;
  toggleSubtaskCompletion: (subtaskId: string, completed: boolean) => Promise<void>;
  diagnosticDatabaseQuery?: () => Promise<any>;
  
  getOverdueTasks: () => Task[];
  getTasksDueToday: () => Task[];
  getTasksDueTomorrow: () => Task[];
  getTasksDueThisWeek: () => Task[];
  getHighPriorityTasks: () => Task[];
  
  getTasksCountByStatus: () => Record<string, number>;
  getAverageDailyCompletionRate: () => number;
  
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
          console.log("[TaskStore] Computing filteredTasks, tasks count:", taskSlice.tasks.length);
          return filterSlice.getFilteredTasks();
        },
        
        refreshTaskCounts: statsSlice.refreshTaskCounts,
        
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
          console.log("[TaskStore] Getting overdue tasks, total tasks:", taskSlice.tasks.length);
          
          // Debug task dates before filtering
          const tasksWithDates = taskSlice.tasks
            .filter(task => task.dueDate)
            .map(task => ({
              id: task.id,
              title: task.title,
              dueDate: task.dueDate,
              status: task.status,
              validDate: getValidDate(task.dueDate)
            }));
          console.log("[TaskStore] Tasks with due dates before filtering:", tasksWithDates);
          
          return taskSlice.tasks.filter(task => {
            // Skip completed or archived tasks
            if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) {
              return false;
            }
            
            // We need a valid due date to check if it's overdue
            const dueDate = getValidDate(task.dueDate);
            if (!dueDate) {
              return false;
            }
            
            // A task is overdue if it's due date is in the past and not today
            const isTaskOverdue = isPast(dueDate) && !isToday(dueDate);
            
            // Debug what's happening with dates for this task
            console.log(`Task "${task.title}" due date: ${dueDate.toISOString()}, 
              isPast: ${isPast(dueDate)}, 
              isToday: ${isToday(dueDate)},
              isOverdue: ${isTaskOverdue}`);
            
            return isTaskOverdue;
          });
        },
        
        getTasksDueToday: () => {
          // Debug task dates before filtering
          const tasksWithDates = taskSlice.tasks
            .filter(task => task.dueDate)
            .map(task => ({
              id: task.id,
              title: task.title,
              dueDate: task.dueDate,
              status: task.status,
              isToday: task.dueDate ? isToday(getValidDate(task.dueDate) || new Date()) : false
            }));
          console.log("[TaskStore] Tasks with dates for Today check:", tasksWithDates);
          
          return taskSlice.tasks.filter(task => {
            // Skip completed or archived tasks
            if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) {
              return false;
            }
            
            // We need a valid due date to check if it's due today
            const dueDate = getValidDate(task.dueDate);
            if (!dueDate) {
              return false;
            }
            
            // Debug date check
            const isDueToday = isToday(dueDate);
            console.log(`Task "${task.title}" due today check: ${dueDate.toISOString()}, isToday: ${isDueToday}`);
            
            // A task is due today if its due date is today
            return isDueToday;
          });
        },
        
        getTasksDueTomorrow: () => {
          // Debug task dates before filtering
          const tasksWithDates = taskSlice.tasks
            .filter(task => task.dueDate)
            .map(task => ({
              id: task.id,
              title: task.title,
              dueDate: task.dueDate,
              status: task.status,
              isTomorrow: task.dueDate ? isTomorrow(getValidDate(task.dueDate) || new Date()) : false
            }));
          console.log("[TaskStore] Tasks with dates for Tomorrow check:", tasksWithDates);
          
          return taskSlice.tasks.filter(task => {
            // Skip completed or archived tasks
            if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) {
              return false;
            }
            
            // We need a valid due date to check if it's due tomorrow
            const dueDate = getValidDate(task.dueDate);
            if (!dueDate) {
              return false;
            }
            
            // Debug date check
            const isDueTomorrow = isTomorrow(dueDate);
            console.log(`Task "${task.title}" due tomorrow check: ${dueDate.toISOString()}, isTomorrow: ${isDueTomorrow}`);
            
            // A task is due tomorrow if its due date is tomorrow
            return isDueTomorrow;
          });
        },
        
        getTasksDueThisWeek: () => {
          // Debug task dates before filtering
          const tasksWithDates = taskSlice.tasks
            .filter(task => task.dueDate)
            .map(task => ({
              id: task.id,
              title: task.title,
              dueDate: task.dueDate,
              status: task.status,
              isThisWeek: task.dueDate ? isThisWeek(getValidDate(task.dueDate) || new Date()) : false,
              isToday: task.dueDate ? isToday(getValidDate(task.dueDate) || new Date()) : false,
              isTomorrow: task.dueDate ? isTomorrow(getValidDate(task.dueDate) || new Date()) : false
            }));
          console.log("[TaskStore] Tasks with dates for ThisWeek check:", tasksWithDates);
          
          return taskSlice.tasks.filter(task => {
            // Skip completed or archived tasks
            if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) {
              return false;
            }
            
            // We need a valid due date to check if it's due this week
            const dueDate = getValidDate(task.dueDate);
            if (!dueDate) {
              return false;
            }
            
            // Debug date check
            const isDueThisWeek = isThisWeek(dueDate);
            const isDueToday = isToday(dueDate);
            const isDueTomorrow = isTomorrow(dueDate);
            
            console.log(`Task "${task.title}" due this week check: ${dueDate.toISOString()}, 
              isThisWeek: ${isDueThisWeek},
              isToday: ${isDueToday},
              isTomorrow: ${isDueTomorrow},
              inThisWeekCategory: ${isDueThisWeek && !isDueToday && !isDueTomorrow}`);
            
            // A task is due this week if it's due date is this week, but not today or tomorrow
            return isDueThisWeek && !isDueToday && !isDueTomorrow;
          });
        },
        
        getHighPriorityTasks: () => {
          // Debug high priority tasks
          const highPriorityTasksInfo = taskSlice.tasks
            .filter(task => 
              task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT
            )
            .map(task => ({
              id: task.id,
              title: task.title,
              priority: task.priority,
              status: task.status,
              dueDate: task.dueDate
            }));
          console.log("[TaskStore] High priority tasks before filtering:", highPriorityTasksInfo);
          
          return taskSlice.tasks.filter(task => {
            // Skip completed or archived tasks
            if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) {
              return false;
            }
            
            // Check if it's high priority
            const isHighPriority = task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT;
            
            if (!isHighPriority) {
              return false;
            }
            
            // Skip tasks that are already covered by date-based filters
            const dueDate = getValidDate(task.dueDate);
            if (dueDate) {
              // If the task is already in one of the date-based categories, skip it
              if (isPast(dueDate) || isToday(dueDate) || isTomorrow(dueDate) || 
                  (isThisWeek(dueDate) && !isToday(dueDate) && !isTomorrow(dueDate))) {
                console.log(`High priority task "${task.title}" already categorized by date: ${dueDate.toISOString()}`);
                return false;
              }
            }
            
            console.log(`Including high priority task "${task.title}" in High Priority category`);
            return true;
          });
        },
        
        getTasksCountByStatus: () => {
          const counts: Record<string, number> = {};
          const allStatuses = Object.values(TaskStatus);
          
          allStatuses.forEach(status => {
            counts[status] = 0;
          });
          
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
