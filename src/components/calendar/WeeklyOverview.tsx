
import { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/integration';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WeeklyOverviewProps {
  tasks: Task[];
  events: CalendarEvent[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date) => void;
}

export function WeeklyOverview({ tasks, events, selectedDate, onDateSelect }: WeeklyOverviewProps) {
  const weekDays = useMemo(() => {
    if (!selectedDate) return [];
    
    // Get 3 days before and 3 days after the selected date
    const days = [];
    for (let i = -3; i <= 3; i++) {
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
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        taskCount: dayTasks.length,
        eventCount: dayEvents.length,
        isSelected: selectedDate && isSameDay(date, selectedDate),
        isToday: isSameDay(date, new Date())
      });
    }
    
    return days;
  }, [selectedDate, tasks, events]);
  
  if (!selectedDate || weekDays.length === 0) return null;
  
  return (
    <div className="flex justify-between mb-4 overflow-x-auto pb-1">
      {weekDays.map((day) => (
        <Button
          key={day.date.toISOString()}
          variant="ghost"
          size="sm"
          className={cn(
            "flex flex-col items-center px-2 py-1 h-auto min-w-14 gap-1 rounded-lg",
            day.isSelected && "bg-primary text-primary-foreground",
            day.isToday && !day.isSelected && "border border-primary"
          )}
          onClick={() => onDateSelect(day.date)}
        >
          <span className="text-xs font-normal">{day.dayName}</span>
          <span className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full",
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
