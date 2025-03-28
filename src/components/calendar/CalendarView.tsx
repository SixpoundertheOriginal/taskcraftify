import { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameDay, parseISO, isValid } from 'date-fns';
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
import { Task, TaskStatus } from '@/types/task';
import { CalendarEvent } from '@/types/integration';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarPlus, Check, Clock, MapPin, Edit, Trash2, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { DayContent, DayContentProps } from 'react-day-picker';
import { CalendarSummary } from './CalendarSummary';
import { WeeklyOverview } from './WeeklyOverview';
import { TimeGroupedTasks } from './TimeGroupedTasks';
import { FloatingActionButton } from '@/components/tasks';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState<string>("tasks");
  
  const isMobile = useIsMobile();
  
  const { 
    tasks, 
    fetchTasks, 
    isLoading: tasksLoading, 
    updateTask,
    deleteTask
  } = useTaskStore();
  
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
    setActiveTab("tasks");

    console.log("Date selected:", date ? format(date, 'yyyy-MM-dd') : 'undefined');
    if (date) {
      const tasksForDate = getTasksForDate(date);
      console.log(`Found ${tasksForDate.length} tasks for selected date`, tasksForDate);
      
      console.log("All tasks with due dates:", 
        tasks
          .filter(t => t.dueDate)
          .map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            dueDateType: typeof t.dueDate,
            formattedDueDate: t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : 'none'
          }))
      );
    }
  };
  
  const handleOpenTaskForm = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };

  const handleTaskStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTask({ ...task, status: newStatus });
      toast({
        title: "Task updated",
        description: `${task.title} status changed to ${newStatus}`
      });
    } catch (error) {
      toast({
        title: "Failed to update task",
        description: "There was an error updating the task status",
        variant: "destructive"
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
        toast({
          title: "Task deleted",
          description: "Task has been successfully deleted"
        });
      } catch (error) {
        toast({
          title: "Failed to delete task",
          description: "There was an error deleting the task",
          variant: "destructive"
        });
      }
    }
  };
  
  const getTasksForDate = (date: Date | undefined) => {
    if (!date || !isValid(date)) return [];
    
    const selectedDateStr = format(date, 'yyyy-MM-dd');
    
    const result = tasks.filter(task => {
      if (!task.dueDate) {
        return false;
      }
      
      try {
        const matches = isSameDay(task.dueDate, date);
        return matches;
      } catch (e) {
        console.error(`Error comparing dates for task ${task.id}:`, e);
        return false;
      }
    });
    
    return result;
  };
  
  const getEventsForDate = (date: Date | undefined) => {
    if (!date || !isValid(date)) return [];
    
    return calendarEvents.filter(event => {
      if (!event.startTime) return false;
      return isSameDay(event.startTime, date);
    });
  };
  
  const selectedDateTasks = useMemo(() => 
    selectedDate ? getTasksForDate(selectedDate) : [],
    [selectedDate, tasks]
  );
  
  const selectedDateEvents = useMemo(() => 
    selectedDate ? getEventsForDate(selectedDate) : [],
    [selectedDate, calendarEvents]
  );
  
  const renderDate = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const dayEvents = getEventsForDate(date);
    const hasItems = dayTasks.length > 0 || dayEvents.length > 0;
    
    return (
      <div className="relative w-full h-full flex flex-col items-center">
        <div className="mb-auto pt-1">{date.getDate()}</div>
        
        {hasItems && (
          <div className="mt-auto flex gap-1 items-center justify-center w-full pb-1">
            {dayTasks.length > 0 && (
              <Badge variant="secondary" className="h-4 text-xs px-1 py-0">
                {dayTasks.length}
              </Badge>
            )}
            {dayEvents.length > 0 && (
              <Badge variant="outline" className="h-4 text-xs px-1 py-0 bg-primary/20 border-primary/30">
                {dayEvents.length}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const isLoading = tasksLoading || eventsLoading;
  const formattedSelectedDate = selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '';
  
  const CustomDayContent = (props: DayContentProps) => {
    const { date, activeModifiers } = props;
    const isToday = activeModifiers?.today;
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    
    return (
      <div className={cn(
        "relative w-full h-full min-h-9",
        isSelected && "bg-primary text-primary-foreground",
        isToday && !isSelected && "bg-accent text-accent-foreground"
      )}>
        {renderDate(date)}
      </div>
    );
  };
  
  useEffect(() => {
    console.log("All tasks:", tasks);
    console.log("Tasks with due dates:", 
      tasks.filter(task => task.dueDate).map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        dueDateType: typeof task.dueDate
      }))
    );
    
    if (selectedDate) {
      console.log(`Tasks for selected date (${format(selectedDate, 'yyyy-MM-dd')}):`, 
        getTasksForDate(selectedDate)
      );
    }
  }, [tasks, selectedDate]);

  const renderDetailsPanel = () => {
    const detailsContent = (
      <>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">
            {selectedDate ? formattedSelectedDate : 'Select a date'}
          </h3>
        </div>
        
        {selectedDate && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="tasks" className="flex items-center gap-1">
                Tasks {selectedDateTasks.length > 0 && `(${selectedDateTasks.length})`}
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1">
                Events {selectedDateEvents.length > 0 && `(${selectedDateEvents.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="flex-1 overflow-y-auto">
              {selectedDateTasks.length > 0 ? (
                <TimeGroupedTasks 
                  tasks={selectedDateTasks}
                  onEdit={handleOpenTaskForm}
                  onDelete={handleTaskDelete}
                  onComplete={(task) => handleTaskStatusChange(task, TaskStatus.DONE)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <CalendarPlus className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No tasks scheduled for this day
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setIsTaskFormOpen(true)}
                  >
                    Add a task
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="events" className="flex-1 overflow-y-auto">
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <Card 
                      key={event.id} 
                      className="border-l-4 border-l-primary/60 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleEventClick(event)}
                    >
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-sm font-medium">{event.title}</CardTitle>
                        {event.description && (
                          <CardDescription className="text-xs line-clamp-2">
                            {event.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="flex flex-col gap-1 text-xs">
                          {(event.startTime && event.endTime) && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {event.allDay 
                                  ? 'All day' 
                                  : `${format(event.startTime, 'h:mm a')} - ${format(event.endTime, 'h:mm a')}`}
                              </span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No events scheduled for this day
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {!selectedDate && (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              Select a date from the calendar to view tasks and events
            </p>
          </div>
        )}
      </>
    );

    if (isMobile && selectedDate) {
      return (
        <>
          <div className="fixed bottom-4 right-4 z-40">
            <Button 
              className="rounded-full h-14 w-14 shadow-lg flex items-center justify-center"
              size="icon"
              onClick={() => setEventDetailsOpen(true)}
            >
              <CalendarIcon className="h-6 w-6" />
            </Button>
          </div>
          
          <Drawer open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
            <DrawerContent className="px-4 pb-6 max-h-[85vh]">
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-xl">
                  {formattedSelectedDate}
                </DrawerTitle>
              </DrawerHeader>
              <div className="h-full overflow-y-auto">
                {detailsContent}
              </div>
              <DrawerFooter className="pt-2 px-0">
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </>
      );
    }
    
    return (
      <div className="md:col-span-2 border rounded-md p-4">
        <div className="flex flex-col h-full">
          {detailsContent}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <CalendarSummary tasks={tasks} selectedDate={selectedDate} />
      
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
      
      <WeeklyOverview 
        tasks={tasks}
        events={calendarEvents}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className={cn("md:col-span-5", isMobile ? "mb-20" : "")}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              showOutsideDays={true}
              className="rounded-md border w-full p-3"
              components={{
                DayContent: CustomDayContent
              }}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                ),
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: cn(
                  "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  isMobile && "text-[0.7rem] w-8"
                ),
                row: "flex w-full mt-2",
                cell: cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  isMobile ? "h-8 w-8" : "h-9 w-9",
                  "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                  "[&:has([aria-selected].day-outside)]:bg-accent/50",
                  "[&:has([aria-selected])]:bg-accent",
                  "first:[&:has([aria-selected])]:rounded-l-md",
                  "last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  isMobile && "h-8 w-8 text-xs"
                ),
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />
          </div>
          
          {!isMobile && renderDetailsPanel()}
        </div>
      )}
      
      {isMobile && renderDetailsPanel()}
      
      <Dialog open={selectedEvent !== null && !isMobile} onOpenChange={(open) => !open && setSelectedEvent(null)}>
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
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedEvent.allDay 
                        ? 'All day' 
                        : `${format(selectedEvent.startTime, 'h:mm a')} - ${selectedEvent.endTime ? format(selectedEvent.endTime, 'h:mm a') : ''}`}
                    </span>
                  </div>
                </div>
              )}
              
              {selectedEvent.location && (
                <div>
                  <div className="text-sm font-medium">Location</div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
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
