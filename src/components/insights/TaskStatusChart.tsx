
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useTaskStore } from '@/store';
import { TaskStatus } from '@/types/task';
import { getStatusLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function TaskStatusChart() {
  const { getTasksCountByStatus } = useTaskStore();
  
  // Get status counts from the store
  const statusCounts = getTasksCountByStatus();
  
  // Convert to array for recharts
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: getStatusLabel(status as TaskStatus),
    value: count,
    status
  }));
  
  // Status colors
  const COLORS = {
    [TaskStatus.BACKLOG]: '#94a3b8', // slate-400
    [TaskStatus.TODO]: '#3b82f6', // blue-500
    [TaskStatus.IN_PROGRESS]: '#f59e0b', // amber-500
    [TaskStatus.DONE]: '#10b981', // emerald-500
    [TaskStatus.ARCHIVED]: '#6b7280', // gray-500
  };
  
  // Chart configuration for the ChartContainer
  const chartConfig = {
    status: {
      label: 'Task Status',
      theme: {
        light: '#1e293b',  // slate-800
        dark: '#f8fafc',   // slate-50
      }
    }
  };
  
  // No tasks case
  if (chartData.every(item => item.value === 0)) {
    return (
      <div className="h-32 w-full flex items-center justify-center text-muted-foreground text-sm">
        No task data available
      </div>
    );
  }
  
  return (
    <div className="h-36 w-full">
      <ChartContainer className="h-full" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={false}
              animationDuration={500}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.status as TaskStatus]} 
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-md border bg-background p-2 shadow-md">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: COLORS[data.status as TaskStatus] }}
                        />
                        <span className="font-medium">{data.name}:</span> 
                        <span>{data.value} tasks</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {chartData.map((item) => (
          <Badge 
            key={item.status} 
            variant="outline"
            className="flex items-center gap-1.5"
          >
            <span 
              className="h-2.5 w-2.5 rounded-full" 
              style={{ backgroundColor: COLORS[item.status as TaskStatus] }} 
            />
            <span>{item.name}: {item.value}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
