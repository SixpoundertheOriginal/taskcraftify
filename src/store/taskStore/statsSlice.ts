
import { StateCreator } from 'zustand';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';

export interface StatsSlice {
  // Computed stats
  getCompletionRate: () => number;
  getCompletionTrend: (days: number) => { date: Date; count: number }[];
  getTasksByPriority: () => Record<TaskPriority, number>;
  getTasksByStatus: () => Record<TaskStatus, number>;
  getAverageCompletionTime: () => number | null;
  
  // Analysis methods
  identifyProductivityPeaks: () => { day: string; count: number }[];
  getOverdueTasks: () => Task[];
}

export const createStatsSlice: StateCreator<
  StatsSlice & { tasks: Task[] },
  [],
  [],
  StatsSlice
> = (set, get) => ({
  // Computed stats
  getCompletionRate: () => {
    const { tasks } = get();
    if (!tasks.length) return 0;
    
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE);
    return (completedTasks.length / tasks.length) * 100;
  },
  
  getCompletionTrend: (days) => {
    const { tasks } = get();
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const endDate = endOfDay(date);
      
      const completedCount = tasks.filter(task => {
        if (task.status !== TaskStatus.DONE || !task.updatedAt) return false;
        const completedDate = new Date(task.updatedAt);
        return isWithinInterval(completedDate, { start: date, end: endDate });
      }).length;
      
      result.push({ date, count: completedCount });
    }
    
    return result;
  },
  
  getTasksByPriority: () => {
    const { tasks } = get();
    const result: Record<TaskPriority, number> = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.URGENT]: 0,
    };
    
    tasks.forEach(task => {
      result[task.priority]++;
    });
    
    return result;
  },
  
  getTasksByStatus: () => {
    const { tasks } = get();
    const result: Record<TaskStatus, number> = {
      [TaskStatus.BACKLOG]: 0,
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.ARCHIVED]: 0,
    };
    
    tasks.forEach(task => {
      result[task.status]++;
    });
    
    return result;
  },
  
  getAverageCompletionTime: () => {
    const { tasks } = get();
    const completedTasks = tasks.filter(
      task => task.status === TaskStatus.DONE && task.createdAt && task.updatedAt
    );
    
    if (!completedTasks.length) return null;
    
    const totalTimeMs = completedTasks.reduce((total, task) => {
      const createdDate = new Date(task.createdAt).getTime();
      const completedDate = new Date(task.updatedAt!).getTime();
      return total + (completedDate - createdDate);
    }, 0);
    
    // Return average time in hours
    return totalTimeMs / completedTasks.length / (1000 * 60 * 60);
  },
  
  // Analysis methods
  identifyProductivityPeaks: () => {
    const { tasks } = get();
    const dayCount: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0,
    };
    
    tasks.forEach(task => {
      if (task.status === TaskStatus.DONE && task.updatedAt) {
        const completedDate = new Date(task.updatedAt);
        const day = completedDate.toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day]++;
      }
    });
    
    return Object.entries(dayCount)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count);
  },
  
  getOverdueTasks: () => {
    const { tasks } = get();
    const now = new Date();
    
    return tasks.filter(task => {
      if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED || !task.dueDate) {
        return false;
      }
      
      const dueDate = new Date(task.dueDate);
      return dueDate < now;
    });
  },
});
