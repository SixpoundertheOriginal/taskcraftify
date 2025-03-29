
import { useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CircleCheck, Clock, BarChart, Zap, CalendarDays } from 'lucide-react';
import { formatDate, isOverdue, cn } from '@/lib/utils';
import { useTaskStore } from '@/store';

interface CalendarSummaryProps {
  tasks: Task[];
  selectedDate: Date | undefined;
}

export function CalendarSummary({ tasks, selectedDate }: CalendarSummaryProps) {
  const { filters, setFilters } = useTaskStore();
  
  const stats = useMemo(() => {
    if (!tasks.length) return null;
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
    const urgent = tasks.filter(t => t.priority === TaskPriority.URGENT).length;
    const high = tasks.filter(t => t.priority === TaskPriority.HIGH).length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue = tasks.filter(t => 
      t.dueDate && 
      t.status !== TaskStatus.DONE && 
      t.status !== TaskStatus.ARCHIVED && 
      isOverdue(t.dueDate)
    ).length;
    
    const dueToday = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return (
        t.status !== TaskStatus.DONE && 
        t.status !== TaskStatus.ARCHIVED && 
        dueDate.getTime() === today.getTime()
      );
    }).length;
    
    return { 
      total, 
      completed, 
      inProgress, 
      todo, 
      urgent, 
      high, 
      overdue, 
      dueToday,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [tasks]);
  
  const handleStatusFilterClick = (status: TaskStatus) => {
    setFilters({ ...filters, status: [status] });
  };
  
  const handlePriorityFilterClick = (priority: TaskPriority) => {
    setFilters({ ...filters, priority: [priority] });
  };
  
  const handleOverdueFilterClick = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setFilters({ 
      ...filters, 
      dueDateTo: today,
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
    });
  };
  
  const handleDueTodayFilterClick = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFilters({ 
      ...filters, 
      dueDateFrom: today,
      dueDateTo: tomorrow,
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
    });
  };
  
  if (!stats) return null;
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Task Status Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <BarChart className="h-4 w-4 text-primary" />
              <span>Task Status</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div 
                className={cn(
                  "flex flex-col gap-1 bg-blue-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-blue-100/70 hover:scale-[1.02]",
                  "border border-transparent hover:border-blue-200/50"
                )}
                onClick={() => handleStatusFilterClick(TaskStatus.TODO)}
                tabIndex={0}
                role="button"
                aria-label="Filter by To Do status"
                onKeyDown={(e) => e.key === 'Enter' && handleStatusFilterClick(TaskStatus.TODO)}
              >
                <span className="text-xs text-muted-foreground">To Do</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{stats.todo}</span>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
              
              <div 
                className={cn(
                  "flex flex-col gap-1 bg-amber-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-amber-100/70 hover:scale-[1.02]",
                  "border border-transparent hover:border-amber-200/50"
                )}
                onClick={() => handleStatusFilterClick(TaskStatus.IN_PROGRESS)}
                tabIndex={0}
                role="button"
                aria-label="Filter by In Progress status"
                onKeyDown={(e) => e.key === 'Enter' && handleStatusFilterClick(TaskStatus.IN_PROGRESS)}
              >
                <span className="text-xs text-muted-foreground">In Progress</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{stats.inProgress}</span>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
              
              <div 
                className={cn(
                  "flex flex-col gap-1 bg-green-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-green-100/70 hover:scale-[1.02]",
                  "border border-transparent hover:border-green-200/50"
                )}
                onClick={() => handleStatusFilterClick(TaskStatus.DONE)}
                tabIndex={0}
                role="button"
                aria-label="Filter by Completed status"
                onKeyDown={(e) => e.key === 'Enter' && handleStatusFilterClick(TaskStatus.DONE)}
              >
                <span className="text-xs text-muted-foreground">Completed</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{stats.completed}</span>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
              
              <div 
                className={cn(
                  "flex flex-col gap-1 bg-gray-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-gray-100/70 hover:scale-[1.02]",
                  "border border-transparent hover:border-gray-200/50"
                )}
                onClick={() => setFilters({ ...filters, status: undefined })}
                tabIndex={0}
                role="button"
                aria-label="Show all tasks"
                onKeyDown={(e) => e.key === 'Enter' && setFilters({ ...filters, status: undefined })}
              >
                <span className="text-xs text-muted-foreground">Total</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{stats.total}</span>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Priority Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span>Priority</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div 
                className={cn(
                  "flex flex-col gap-1 bg-red-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-red-100/70 hover:scale-[1.02]",
                  "border border-transparent hover:border-red-200/50"
                )}
                onClick={() => handlePriorityFilterClick(TaskPriority.URGENT)}
                tabIndex={0}
                role="button"
                aria-label="Filter by Urgent priority"
                onKeyDown={(e) => e.key === 'Enter' && handlePriorityFilterClick(TaskPriority.URGENT)}
              >
                <span className="text-xs text-muted-foreground">Urgent</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{stats.urgent}</span>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
              
              <div 
                className={cn(
                  "flex flex-col gap-1 bg-orange-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-orange-100/70 hover:scale-[1.02]",
                  "border border-transparent hover:border-orange-200/50"
                )}
                onClick={() => handlePriorityFilterClick(TaskPriority.HIGH)}
                tabIndex={0}
                role="button"
                aria-label="Filter by High priority"
                onKeyDown={(e) => e.key === 'Enter' && handlePriorityFilterClick(TaskPriority.HIGH)}
              >
                <span className="text-xs text-muted-foreground">High</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{stats.high}</span>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
              
              <div 
                className={cn(
                  "flex flex-col gap-1 bg-red-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-red-100/70 hover:scale-[1.02]",
                  "border border-transparent hover:border-red-200/50"
                )}
                onClick={handleOverdueFilterClick}
                tabIndex={0}
                role="button"
                aria-label="Filter by Overdue tasks"
                onKeyDown={(e) => e.key === 'Enter' && handleOverdueFilterClick()}
              >
                <span className="text-xs text-muted-foreground">Overdue</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{stats.overdue}</span>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
              
              <div 
                className={cn(
                  "flex flex-col gap-1 bg-blue-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-blue-100/70 hover:scale-[1.02]",
                  "border border-transparent hover:border-blue-200/50"
                )}
                onClick={handleDueTodayFilterClick}
                tabIndex={0}
                role="button"
                aria-label="Filter by Due Today tasks"
                onKeyDown={(e) => e.key === 'Enter' && handleDueTodayFilterClick()}
              >
                <span className="text-xs text-muted-foreground">Due Today</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-semibold">{stats.dueToday}</span>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <CircleCheck className="h-4 w-4 text-primary" />
              <span>Progress</span>
            </div>
            
            <div className="flex flex-col h-full justify-center items-center">
              <div className="relative h-24 w-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e6e6e6"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeDasharray={`${stats.completionRate * 2.51} 251`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{stats.completionRate}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.completed} of {stats.total} tasks completed
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
