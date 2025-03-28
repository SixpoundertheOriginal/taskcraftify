
import { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/integration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
        isToday: isSameDay(date, new Date())
      });
    }
    
    return days;
  }, [selectedDate, tasks, events, isMobile]);
  
  if (!selectedDate || weekDays.length === 0) return null;
  
  return (
    <div className="flex justify-between mb-4 overflow-x-auto pb-1">
      {weekDays.map((day) => (
        <Button
          key={day.date.toISOString()}
          variant="ghost"
          size="sm"
          className={cn(
            "flex flex-col items-center px-2 py-1 h-auto min-w-0 gap-1 rounded-lg",
            isMobile ? "flex-1 mx-1" : "min-w-14",
            day.isSelected && "bg-primary text-primary-foreground",
            day.isToday && !day.isSelected && "border border-primary"
          )}
          onClick={() => onDateSelect(day.date)}
        >
          <span className={cn(
            "text-xs font-normal",
            isMobile && "text-[10px]"
          )}>{day.dayName}</span>
          <span className={cn(
            "flex items-center justify-center rounded-full",
            isMobile ? "w-6 h-6 text-xs" : "w-7 h-7",
            day.isSelected && "font-bold",
            day.isToday && !day.isSelected && "bg-primary/10 font-medium",
          )}>
            {day.dayNumber}
          </span>
          
          {(day.taskCount > 0 || day.eventCount > 0) && (
            <div className="flex gap-1 mt-1">
              {day.taskCount > 0 && (
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              )}
              {day.eventCount > 0 && (
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
              )}
            </div>
          )}
        </Button>
      ))}
    </div>
  );
}
