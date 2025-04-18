
import React, { useMemo } from 'react';
import { useTaskStore } from '@/store';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CalendarDays, Flag } from 'lucide-react';
import { categorizeTasks, TaskCategory } from '@/utils/task';

export function FocusOverview() {
  const { tasks } = useTaskStore();

  // Use the more efficient categorization function with memoization
  const categorized = useMemo(() => {
    console.log("FocusOverview - Recalculating categorized tasks");
    return categorizeTasks(tasks);
  }, [tasks]);

  // Debug log task counts - move inside the memo to prevent extra logging
  const data = useMemo(() => {
    console.log("FocusOverview - Task counts:", {
      overdue: categorized[TaskCategory.OVERDUE].length,
      today: categorized[TaskCategory.TODAY].length,
      tomorrow: categorized[TaskCategory.TOMORROW].length,
      thisWeek: categorized[TaskCategory.THIS_WEEK].length,
      highPriority: categorized[TaskCategory.HIGH_PRIORITY].length,
      totalTasks: tasks.length
    });

    // Prepare data for chart
    return [
      { name: 'Overdue', value: categorized[TaskCategory.OVERDUE].length, color: '#ef4444', icon: <AlertCircle className="h-4 w-4" /> },
      { name: 'Today', value: categorized[TaskCategory.TODAY].length, color: '#f97316', icon: <Clock className="h-4 w-4" /> },
      { name: 'Tomorrow', value: categorized[TaskCategory.TOMORROW].length, color: '#3b82f6', icon: <Clock className="h-4 w-4" /> },
      { name: 'This Week', value: categorized[TaskCategory.THIS_WEEK].length, color: '#8b5cf6', icon: <CalendarDays className="h-4 w-4" /> },
      { name: 'High Priority', value: categorized[TaskCategory.HIGH_PRIORITY].length, color: '#ec4899', icon: <Flag className="h-4 w-4" /> }
    ].filter(item => item.value > 0);
  }, [categorized, tasks.length]);

  // If there are no tasks to display
  if (data.length === 0) {
    return (
      <Card className="bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Focus Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-muted-foreground mb-2">
              {tasks.length > 0 
                ? "You have tasks, but none currently match focus categories."
                : "All caught up! You don't have any priority tasks right now."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom renderer for the legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 text-xs mt-2">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-medium">{entry.value}: {entry.payload.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded shadow-md p-2 text-xs">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Focus Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={1}
                stroke="var(--background)"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
