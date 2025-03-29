
import { useMemo } from 'react';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/integration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

interface WeeklyOverviewProps {
  tasks: Task[];
  events: CalendarEvent[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date) => void;
}

export function WeeklyOverview({ tasks, events, selectedDate, onDateSelect }: WeeklyOverviewProps) {
  const isMobile = useIsMobile();
  
  const weekDays = useMemo(() => {
    if (!selectedDate) return [];
    
    // On mobile show fewer days to save space
    const daysToShow = isMobile ? { before: 1, after: 1 } : { before: 3, after: 3 };
    
    // Get days before and after the selected date based on device
    const days = [];
    for (let i = -daysToShow.before; i <= daysToShow.after; i++) {
      const date = addDays(selectedDate, i);
      
      // Count tasks and events for this day
      const dayTasks = tasks.filter(task => 
        task.dueDate && isSameDay(new Date(task.dueDate), date)
      );
      
      const dayEvents = events.filter(event => 
        event.startTime && isSameDay(new Date(event.startTime), date)
      );
      
      days.push({
        date,
        dayName: format(date, isMobile ? 'E' : 'EEE'), // Shorter format on mobile
        dayNumber: format(date, 'd'),
        taskCount: dayTasks.length,
        eventCount: dayEvents.length,
        isSelected: selectedDate && isSameDay(date, selectedDate),
        isToday: isToday(date)
      });
    }
    
    return days;
  }, [selectedDate, tasks, events, isMobile]);
  
  if (!selectedDate || weekDays.length === 0) return null;
  
  return (
    <div className={cn(
      "flex justify-between mb-6 overflow-x-auto pb-1 bg-card/50 rounded-lg p-3",
      isMobile && "mb-20" // Add bottom margin on mobile to prevent overlap with floating button
    )}>
      {weekDays.map((day) => (
        <Button
          key={day.date.toISOString()}
          variant="ghost"
          size="sm"
          className={cn(
            "flex flex-col items-center px-2 py-3 h-auto min-w-0 gap-1 rounded-lg transition-all",
            isMobile ? "flex-1 mx-1" : "min-w-16",
            day.isSelected ? "bg-primary text-primary-foreground shadow-md" : 
              day.isToday ? "border border-primary bg-primary/5" : "",
            "hover:bg-primary/10"
          )}
          onClick={() => onDateSelect(day.date)}
        >
          <span className={cn(
            "text-xs font-medium",
            isMobile && "text-[10px]",
            day.isSelected ? "text-primary-foreground" : day.isToday ? "text-primary" : "text-muted-foreground"
          )}>{day.dayName}</span>
          
          <span className={cn(
            "flex items-center justify-center rounded-full",
            isMobile ? "w-7 h-7 text-sm" : "w-8 h-8 text-base",
            day.isSelected ? "bg-primary-foreground text-primary font-bold" : 
              day.isToday ? "bg-primary/20 text-primary font-medium" : "",
          )}>
            {day.dayNumber}
          </span>
          
          {(day.taskCount > 0 || day.eventCount > 0) && (
            <div className="flex flex-col items-center mt-1 gap-1">
              {day.taskCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className={cn(
                    day.isSelected ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {day.taskCount}
                  </span>
                </div>
              )}
              
              {day.eventCount > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span className={cn(
                    day.isSelected ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {day.eventCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </Button>
      ))}
    </div>
  );
}
