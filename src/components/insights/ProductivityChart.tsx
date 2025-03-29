
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTaskStore } from '@/store';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

type DayData = {
  name: string;
  completed: number;
  date: Date;
  formattedDate: string;
};

export function ProductivityChart() {
  const { tasks } = useTaskStore();
  
  // Get current week's date range
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  
  // Generate daily data for the week
  const weekData = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(date => {
    // Count tasks completed on this date
    const completed = tasks.filter(task => {
      if (task.status !== 'DONE' || !task.updatedAt) return false;
      const completedDate = new Date(task.updatedAt);
      return isWithinInterval(completedDate, { start: date, end: new Date(date.setHours(23, 59, 59, 999)) });
    }).length;
    
    return {
      name: format(date, 'EEE'),
      completed,
      date,
      formattedDate: format(date, 'MMM d')
    };
  });
  
  const chartConfig = {
    completed: {
      label: 'Completed Tasks',
      color: 'var(--primary)'
    }
  };
  
  return (
    <div className="h-32 w-full">
      <ChartContainer
        config={chartConfig}
        className="h-full w-full"
      >
        <BarChart data={weekData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(value, index) => {
              // Check if this day is today
              const isTodays = isToday(weekData[index].date);
              return isTodays ? `${value} (Today)` : value;
            }}
            fontSize={10}
          />
          <YAxis hide={true} />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as DayData;
                return (
                  <div className="rounded-md border bg-background p-2 shadow-md">
                    <div className="text-xs font-semibold">{data.formattedDate}</div>
                    <div className="flex items-center gap-1 text-xs">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: 'var(--primary)' }}
                      />
                      <span>{data.completed} tasks completed</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="completed" 
            fill="var(--primary)" 
            radius={[4, 4, 0, 0]}
            className={cn("transition-opacity", "opacity-70 hover:opacity-100")}
            animationDuration={300}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
