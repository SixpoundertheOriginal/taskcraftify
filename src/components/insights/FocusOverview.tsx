
import React, { useMemo } from 'react';
import { useTaskStore } from '@/store';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CalendarDays, Flag } from 'lucide-react';

export function FocusOverview() {
  const taskStore = useTaskStore();

  // Use useMemo to prevent unnecessary recalculations
  const overdueTasks = useMemo(() => taskStore.getOverdueTasks(), [taskStore.tasks]);
  const todayTasks = useMemo(() => taskStore.getTasksDueToday(), [taskStore.tasks]);
  const tomorrowTasks = useMemo(() => taskStore.getTasksDueTomorrow(), [taskStore.tasks]);
  const thisWeekTasks = useMemo(() => taskStore.getTasksDueThisWeek(), [taskStore.tasks]);
  const highPriorityTasks = useMemo(() => taskStore.getHighPriorityTasks(), [taskStore.tasks]);

  // Debug log task counts
  console.log("FocusOverview - Task counts:", {
    overdue: overdueTasks.length,
    today: todayTasks.length,
    tomorrow: tomorrowTasks.length,
    thisWeek: thisWeekTasks.length,
    highPriority: highPriorityTasks.length,
    totalTasks: taskStore.tasks.length
  });

  // Prepare data for chart
  const data = [
    { name: 'Overdue', value: overdueTasks.length, color: '#ef4444', icon: <AlertCircle className="h-4 w-4" /> },
    { name: 'Today', value: todayTasks.length, color: '#f97316', icon: <Clock className="h-4 w-4" /> },
    { name: 'Tomorrow', value: tomorrowTasks.length, color: '#3b82f6', icon: <Clock className="h-4 w-4" /> },
    { name: 'This Week', value: thisWeekTasks.length, color: '#8b5cf6', icon: <CalendarDays className="h-4 w-4" /> },
    { name: 'High Priority', value: highPriorityTasks.length, color: '#ec4899', icon: <Flag className="h-4 w-4" /> }
  ].filter(item => item.value > 0);

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
              {taskStore.tasks.length > 0 
                ? "Your tasks don't currently match any focus categories."
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
