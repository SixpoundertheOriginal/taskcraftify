
import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { useTaskStore, useIntegrationStore } from '@/store';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/integration';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarPlus } from 'lucide-react';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  const { tasks, fetchTasks, isLoading: tasksLoading } = useTaskStore();
  const { 
    calendarEvents, 
    fetchCalendarEventsInRange, 
    isLoading: eventsLoading 
  } = useIntegrationStore();
  
  useEffect(() => {
    fetchTasks();
    
    const fetchEvents = async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      await fetchCalendarEventsInRange(start, end);
    };
    
    fetchEvents();
  }, [fetchTasks, fetchCalendarEventsInRange, currentMonth]);
  
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };
  
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };
  
  const handleAddTaskClick = () => {
    setSelectedTask(null);
    setIsTaskFormOpen(true);
  };
  
  const handleOpenTaskForm = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };
  
  // Helper function to get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    if (!date) return [];
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(parseISO(task.dueDate.toString()), date);
    });
  };
  
  // Helper function to get events for a specific date
  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    
    return calendarEvents.filter(event => {
      if (!event.startTime) return false;
      return isSameDay(event.startTime, date);
    });
  };
  
  // Combine tasks and events for the selected date
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  // Create date representation for the calendar component
  const renderDate = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const dayEvents = getEventsForDate(date);
    
    return (
      <div className="relative">
        <div>{date.getDate()}</div>
        {dayTasks.length > 0 && (
          <div className="absolute bottom-0 right-0">
            <Badge variant="secondary" className="text-xs px-1">
              {dayTasks.length}
            </Badge>
          </div>
        )}
      </div>
    );
  };
  
  const isLoading = tasksLoading || eventsLoading;
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date())}>
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="md:col-span-5">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border w-full p-3"
              month={currentMonth}
            />
          </div>
          
          <div className="md:col-span-2 border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </h3>
              <Button size="sm" onClick={handleAddTaskClick}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
            
            {(selectedDateTasks.length > 0 || selectedDateEvents.length > 0) ? (
              <div className="space-y-4">
                {selectedDateTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tasks</h4>
                    <ul className="space-y-2">
                      {selectedDateTasks.map(task => (
                        <li 
                          key={task.id} 
                          className="p-2 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer"
                          onClick={() => handleOpenTaskForm(task)}
                        >
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {task.status} • {task.priority}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedDateEvents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Events</h4>
                    <ul className="space-y-2">
                      {selectedDateEvents.map(event => (
                        <li 
                          key={event.id} 
                          className="p-2 rounded-md bg-primary/10 hover:bg-primary/20 cursor-pointer"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium">{event.title}</div>
                          {event.startTime && event.endTime && (
                            <div className="text-xs text-muted-foreground">
                              {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {selectedDate 
                  ? 'No tasks or events scheduled for this day.' 
                  : 'Select a date to view tasks and events.'}
              </div>
            )}
          </div>
        </div>
      )}
      
      <TaskForm 
        open={isTaskFormOpen} 
        onOpenChange={setIsTaskFormOpen} 
        taskToEdit={selectedTask || undefined}
        initialStatus={undefined}
      />
      
      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.description || 'No description available.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.startTime && (
                <div>
                  <div className="text-sm font-medium">Time</div>
                  <div>
                    {selectedEvent.allDay 
                      ? 'All day' 
                      : `${format(selectedEvent.startTime, 'h:mm a')} - ${selectedEvent.endTime ? format(selectedEvent.endTime, 'h:mm a') : ''}`}
                  </div>
                </div>
              )}
              
              {selectedEvent.location && (
                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div>{selectedEvent.location}</div>
                </div>
              )}
              
              {selectedEvent.taskId && (
                <div>
                  <div className="text-sm font-medium">Linked Task</div>
                  <div>
                    {tasks.find(t => t.id === selectedEvent.taskId)?.title || 'Unknown task'}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
