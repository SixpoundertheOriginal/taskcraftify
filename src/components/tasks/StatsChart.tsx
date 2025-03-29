
import React from 'react';
import { Bar, BarChart, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TaskStatus } from '@/types/task';
import { useTaskStore } from '@/store';

interface StatsChartProps {
  data: { name: string; value: number; date?: Date }[];
  color?: string;
  title: string;
  height?: number;
}

export function StatsChart({ data, color = 'var(--primary)', title, height = 160 }: StatsChartProps) {
  return (
    <div className="w-full">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
            <XAxis 
              dataKey="name" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {item.date ? format(new Date(item.date), 'EEEE, MMM d') : item.name}
                        </span>
                        <span className="text-xs">
                          {item.value} {item.value === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="value" 
              fill={color}
              radius={[4, 4, 0, 0]}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
