
import { StateCreator } from 'zustand';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  subDays,
  isToday,
  isTomorrow,
  isThisWeek,
  isPast,
  startOfDay,
  addDays
} from 'date-fns';

export interface StatsSlice {
  // Task counts
  getTasksCountByStatus: () => Record<string, number>;
  getTasksCountByPriority: () => Record<string, number>;
  getTasksCountByDay: (days?: number) => { name: string; value: number; date: Date }[];
  getCompletedTasksCountByDay: (days?: number) => { name: string; value: number; date: Date }[];
  
  // Focus view functions
  getOverdueTasks: () => Task[];
  getTasksDueToday: () => Task[];
  getTasksDueTomorrow: () => Task[];
  getTasksDueThisWeek: () => Task[];
  getHighPriorityTasks: () => Task[];
  getRecentlyAddedTasks: (days?: number) => Task[];
  
  // Task statistics
  getAverageDailyCompletionRate: () => number;
  getTaskCompletionTrend: (days?: number) => 'increasing' | 'decreasing' | 'stable';
  getMostProductiveDay: () => string | null;
}

export const createStatsSlice: StateCreator<
  { tasks: Task[] } & StatsSlice,
  [],
  [],
  StatsSlice
> = (set, get) => ({
  getTasksCountByStatus: () => {
    const { tasks } = get();
    const counts: Record<string, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.ARCHIVED]: 0,
      [TaskStatus.BACKLOG]: 0,
    };
    
    tasks.forEach(task => {
      if (counts[task.status] !== undefined) {
        counts[task.status]++;
      }
    });
    
    return counts;
  },
  
  getTasksCountByPriority: () => {
    const { tasks } = get();
    const counts: Record<string, number> = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.URGENT]: 0,
    };
    
    tasks.forEach(task => {
      if (counts[task.priority] !== undefined) {
        counts[task.priority]++;
      }
    });
    
    return counts;
  },
  
  getTasksCountByDay: (days = 7) => {
    const { tasks } = get();
    const today = new Date();
    const dayCountMap: Record<string, { count: number; date: Date }> = {};
    
    // Initialize with the last 'days' days
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStr = format(date, 'E'); // 'Mon', 'Tue', etc.
      dayCountMap[dayStr] = { count: 0, date };
    }
    
    // Count tasks created on each day
    tasks.forEach(task => {
      const createdDate = new Date(task.createdAt);
      
      // Only count tasks created in the last 'days' days
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(today, i);
        if (isSameDay(createdDate, date)) {
          const dayStr = format(date, 'E');
          dayCountMap[dayStr].count++;
          break;
        }
      }
    });
    
    // Convert to array format for charts
    return Object.entries(dayCountMap).map(([name, { count, date }]) => ({
      name,
      value: count,
      date
    }));
  },
  
  getCompletedTasksCountByDay: (days = 7) => {
    const { tasks } = get();
    const today = new Date();
    const dayCountMap: Record<string, { count: number; date: Date }> = {};
    
    // Initialize with the last 'days' days
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStr = format(date, 'E'); // 'Mon', 'Tue', etc.
      dayCountMap[dayStr] = { count: 0, date };
    }
    
    // Count completed tasks on each day
    tasks.forEach(task => {
      // Skip if the task is not completed or has no updatedAt date
      if (task.status !== TaskStatus.DONE || !task.updatedAt) return;
      
      const completedDate = new Date(task.updatedAt);
      
      // Only count tasks completed in the last 'days' days
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(today, i);
        if (isSameDay(completedDate, date)) {
          const dayStr = format(date, 'E');
          dayCountMap[dayStr].count++;
          break;
        }
      }
    });
    
    // Convert to array format for charts
    return Object.entries(dayCountMap).map(([name, { count, date }]) => ({
      name,
      value: count,
      date
    }));
  },
  
  // Focus view functions
  getOverdueTasks: () => {
    const { tasks } = get();
    const now = startOfDay(new Date());
    
    return tasks.filter(task => 
      task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && 
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED
    );
  },
  
  getTasksDueToday: () => {
    const { tasks } = get();
    
    return tasks.filter(task => 
      task.dueDate && isToday(task.dueDate) && 
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED
    );
  },
  
  getTasksDueTomorrow: () => {
    const { tasks } = get();
    
    return tasks.filter(task => 
      task.dueDate && isTomorrow(task.dueDate) && 
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED
    );
  },
  
  getTasksDueThisWeek: () => {
    const { tasks } = get();
    
    return tasks.filter(task => 
      task.dueDate && isThisWeek(task.dueDate) && 
      !isToday(task.dueDate) && !isTomorrow(task.dueDate) && 
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED
    );
  },
  
  getHighPriorityTasks: () => {
    const { tasks } = get();
    
    return tasks.filter(task => 
      (task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT) && 
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED
    );
  },
  
  getRecentlyAddedTasks: (days = 3) => {
    const { tasks } = get();
    const now = new Date();
    const cutoffDate = subDays(now, days);
    
    return tasks.filter(task => 
      new Date(task.createdAt) >= cutoffDate && 
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED
    );
  },
  
  // Task statistics
  getAverageDailyCompletionRate: () => {
    const completedByDay = get().getCompletedTasksCountByDay(7);
    const totalCompleted = completedByDay.reduce((sum, day) => sum + day.value, 0);
    return totalCompleted / 7;
  },
  
  getTaskCompletionTrend: (days = 7) => {
    const completedByDay = get().getCompletedTasksCountByDay(days);
    
    // If we don't have enough data
    if (completedByDay.length < 3) return 'stable';
    
    // Calculate a simple trend by comparing the first half to the second half
    const halfwayPoint = Math.floor(completedByDay.length / 2);
    
    const firstHalfTotal = completedByDay
      .slice(0, halfwayPoint)
      .reduce((sum, day) => sum + day.value, 0);
      
    const secondHalfTotal = completedByDay
      .slice(halfwayPoint)
      .reduce((sum, day) => sum + day.value, 0);
    
    const firstHalfAvg = firstHalfTotal / halfwayPoint;
    const secondHalfAvg = secondHalfTotal / (completedByDay.length - halfwayPoint);
    
    // Determine the trend
    const trendDifference = secondHalfAvg - firstHalfAvg;
    const trendThreshold = 0.5; // Arbitrary threshold
    
    if (trendDifference > trendThreshold) return 'increasing';
    if (trendDifference < -trendThreshold) return 'decreasing';
    return 'stable';
  },
  
  getMostProductiveDay: () => {
    const completedByDay = get().getCompletedTasksCountByDay(7);
    
    if (completedByDay.length === 0) return null;
    
    // Find the day with the highest completion count
    const mostProductiveDay = completedByDay.reduce(
      (max, day) => (day.value > max.value ? day : max),
      completedByDay[0]
    );
    
    return mostProductiveDay.name;
  }
});
