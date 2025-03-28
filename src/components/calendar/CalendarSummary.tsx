
import { useMemo } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CircleCheck, Clock, BarChart } from 'lucide-react';

interface CalendarSummaryProps {
  tasks: Task[];
  selectedDate: Date | undefined;
}

export function CalendarSummary({ tasks, selectedDate }: CalendarSummaryProps) {
  const stats = useMemo(() => {
    if (!tasks.length) return null;
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
    
    return { total, completed, inProgress, todo };
  }, [tasks]);
  
  if (!stats) return null;
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {stats.total} {stats.total === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="bg-blue-100 border-blue-200 text-blue-700 h-5">
                {stats.todo}
              </Badge>
              <span className="text-xs text-muted-foreground">To Do</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="bg-amber-100 border-amber-200 text-amber-700 h-5">
                {stats.inProgress}
              </Badge>
              <span className="text-xs text-muted-foreground">In Progress</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="bg-green-100 border-green-200 text-green-700 h-5">
                {stats.completed}
              </Badge>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
