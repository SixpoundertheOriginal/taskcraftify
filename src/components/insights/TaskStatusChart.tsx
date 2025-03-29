
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTaskStore } from '@/store';
import { Badge } from '@/components/ui/badge';

export function TaskStatusChart() {
  const { tasks } = useTaskStore();
  
  // Calculate tasks by status
  const todoCount = tasks.filter(task => task.status === 'TODO').length;
  const inProgressCount = tasks.filter(task => task.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter(task => task.status === 'DONE').length;
  
  const data = [
    { name: 'To Do', value: todoCount, color: '#f97316' },  // Orange
    { name: 'In Progress', value: inProgressCount, color: '#3b82f6' },  // Blue
    { name: 'Done', value: doneCount, color: '#22c55e' },  // Green
  ].filter(item => item.value > 0);  // Only show statuses with tasks
  
  const total = todoCount + inProgressCount + doneCount;
  
  if (total === 0) {
    return (
      <div className="flex h-32 w-full items-center justify-center text-xs text-muted-foreground">
        No task data available
      </div>
    );
  }
  
  return (
    <div className="flex h-32 w-full items-center">
      <div className="w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={40}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-md border bg-background p-2 shadow-md">
                      <div className="flex items-center gap-1 text-xs">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="font-semibold">{data.name}</span>
                      </div>
                      <div className="text-xs">
                        {data.value} tasks ({Math.round((data.value / total) * 100)}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex w-1/2 flex-col gap-1">
        {data.map((status) => (
          <div key={status.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
              <span>{status.name}</span>
            </div>
            <span className="font-mono text-muted-foreground">
              {status.value} ({Math.round((status.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
