
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
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarPlus, Check, Clock, MapPin, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeTab, setActiveTab] = useState<string>("tasks");
  
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
    // Reset the active tab to "tasks" when selecting a new date
    setActiveTab("tasks");
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
  
  // Helper function to get tasks for a specific date
  const getTasksForDate = (date: Date | undefined) => {
    if (!date || !isValid(date)) return [];
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      try {
        return isSameDay(parseISO(task.dueDate.toString()), date);
      } catch (e) {
        return false;
      }
    });
  };
  
  // Helper function to get events for a specific date
  const getEventsForDate = (date: Date | undefined) => {
    if (!date || !isValid(date)) return [];
    
    return calendarEvents.filter(event => {
      if (!event.startTime) return false;
      return isSameDay(event.startTime, date);
    });
  };
  
  // Memoize the tasks and events for the selected date
  const selectedDateTasks = useMemo(() => 
    selectedDate ? getTasksForDate(selectedDate) : [],
    [selectedDate, tasks]
  );
  
  const selectedDateEvents = useMemo(() => 
    selectedDate ? getEventsForDate(selectedDate) : [],
    [selectedDate, calendarEvents]
  );
  
  // Prepare date representation for the calendar component
  const renderDate = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const dayEvents = getEventsForDate(date);
    const hasItems = dayTasks.length > 0 || dayEvents.length > 0;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div>{date.getDate()}</div>
        {hasItems && (
          <div className="absolute bottom-0 right-0 flex gap-1">
            {dayTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1">
                {dayTasks.length}
              </Badge>
            )}
            {dayEvents.length > 0 && (
              <Badge variant="primary" className="text-xs px-1 bg-primary/60">
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
              components={{
                Day: ({ date, ...props }) => (
                  <button
                    {...props}
                    className={cn(
                      props.className,
                      selectedDate && isSameDay(date, selectedDate) && "bg-primary text-primary-foreground font-semibold"
                    )}
                  >
                    {renderDate(date)}
                  </button>
                ),
              }}
            />
          </div>
          
          <div className="md:col-span-2 border rounded-md p-4">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">
                  {selectedDate ? formattedSelectedDate : 'Select a date'}
                </h3>
                <Button size="sm" onClick={handleAddTaskClick}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
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
                      <div className="space-y-3">
                        {selectedDateTasks.map(task => (
                          <Card key={task.id} className={cn(
                            "border-l-4",
                            task.status === TaskStatus.TODO && "border-l-orange-400",
                            task.status === TaskStatus.IN_PROGRESS && "border-l-blue-400",
                            task.status === TaskStatus.DONE && "border-l-green-400",
                            task.status === TaskStatus.ARCHIVED && "border-l-gray-400"
                          )}>
                            <CardHeader className="p-3 pb-2">
                              <CardTitle className="text-sm font-medium flex justify-between">
                                <span className="truncate">{task.title}</span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => handleOpenTaskForm(task)}
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </button>
                                  <button 
                                    onClick={() => handleTaskDelete(task.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </button>
                                </div>
                              </CardTitle>
                              {task.description && (
                                <CardDescription className="text-xs line-clamp-2">
                                  {task.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {task.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {task.status}
                                </Badge>
                                {task.tags?.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                            {task.status !== TaskStatus.DONE && (
                              <CardFooter className="p-2 border-t flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs"
                                  onClick={() => handleTaskStatusChange(task, TaskStatus.DONE)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark Complete
                                </Button>
                              </CardFooter>
                            )}
                          </Card>
                        ))}
                      </div>
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
                          onClick={handleAddTaskClick}
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
            </div>
          </div>
        </div>
      )}
      
      <TaskForm 
        open={isTaskFormOpen} 
        onOpenChange={setIsTaskFormOpen} 
        taskToEdit={selectedTask || undefined}
        initialStatus={undefined}
        initialDueDate={selectedDate}
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
