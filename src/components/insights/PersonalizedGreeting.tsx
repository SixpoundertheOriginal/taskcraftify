
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { useTaskStore } from '@/store';
import { useAuth } from '@/auth/AuthContext';
import { Sun, Moon, Cloud, Clock } from 'lucide-react';

export function PersonalizedGreeting() {
  const { user } = useAuth();
  const taskStore = useTaskStore();
  
  // Refresh task counts when the component mounts
  useEffect(() => {
    taskStore.refreshTaskCounts();
  }, []);
  
  // Get current time to personalize greeting
  const currentHour = new Date().getHours();
  const currentDate = new Date();
  
  // Determine greeting based on time of day
  let greeting = 'Hello';
  let TimeIcon = Clock;
  
  if (currentHour < 12) {
    greeting = 'Good morning';
    TimeIcon = Sun;
  } else if (currentHour < 17) {
    greeting = 'Good afternoon';
    TimeIcon = Sun;
  } else {
    greeting = 'Good evening';
    TimeIcon = Moon;
  }
  
  // Get task statistics - ensure we fetch the latest data
  const tasksDueToday = taskStore.getTasksDueToday();
  const overdueTasks = taskStore.getOverdueTasks();
  const averageCompletionRate = taskStore.getAverageDailyCompletionRate();
  
  // Get username
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  
  // Format date: Monday, May 15, 2023
  const formattedDate = format(currentDate, 'EEEE, MMMM d, yyyy');
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-background to-muted/30 rounded-lg border">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
            <TimeIcon className="h-5 w-5 text-primary" />
            <span>{greeting}, {userName}</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Today is {formattedDate}
          </p>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-md p-3 flex items-center gap-2 
          ${tasksDueToday.length > 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-background border'}`}>
          <div className={`text-lg font-bold ${tasksDueToday.length > 0 ? 'text-amber-500' : 'text-primary'}`}>
            {tasksDueToday.length}
          </div>
          <div className="text-xs">
            {tasksDueToday.length === 1 ? 'Task' : 'Tasks'} due today
          </div>
        </div>
        
        <div className={`rounded-md p-3 flex items-center gap-2 
          ${overdueTasks.length > 0 ? 'bg-rose-500/10 border border-rose-500/30' : 'bg-background border'}`}>
          <div className={`text-lg font-bold ${overdueTasks.length > 0 ? 'text-rose-500' : 'text-primary'}`}>
            {overdueTasks.length}
          </div>
          <div className="text-xs">
            Overdue {overdueTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
        
        <div className="rounded-md p-3 flex items-center gap-2 bg-background border">
          <div className="text-lg font-bold text-primary">
            {Math.round(averageCompletionRate * 10) / 10}
          </div>
          <div className="text-xs">
            Tasks completed per day
          </div>
        </div>
      </div>
    </div>
  );
}
