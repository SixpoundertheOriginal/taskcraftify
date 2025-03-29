import { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleCheck, Clock, BarChart, Zap, LineChart } from 'lucide-react';
import { formatDate, isOverdue, cn } from '@/lib/utils';
import { useTaskStore } from '@/store';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ActiveFiltersDisplay } from '../tasks/ActiveFiltersDisplay';

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
  
  const handleClearStatusFilter = () => {
    const { status, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const handleClearPriorityFilter = () => {
    const { priority, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const handleClearDateFilters = () => {
    const { dueDateFrom, dueDateTo, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const handleClearAllFilters = () => {
    setFilters({});
  };
  
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
  
  const [openInsightsDialog, setOpenInsightsDialog] = useState<string | null>(null);
  
  if (!stats) return null;
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <ActiveFiltersDisplay 
          filters={filters}
          onClearStatusFilter={handleClearStatusFilter}
          onClearPriorityFilter={handleClearPriorityFilter}
          onClearDateFilters={handleClearDateFilters}
          onClearAllFilters={handleClearAllFilters}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <BarChart className="h-4 w-4 text-primary" />
              <span>Task Status</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "flex flex-col gap-1 bg-blue-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-blue-100/70 hover:scale-[1.02]",
                        "border border-transparent hover:border-blue-200/50 group relative"
                      )}
                      onClick={() => handleStatusFilterClick(TaskStatus.TODO)}
                      tabIndex={0}
                      role="button"
                      aria-label="Filter by To Do status"
                      onKeyDown={(e) => e.key === 'Enter' && handleStatusFilterClick(TaskStatus.TODO)}
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">To Do</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{stats.todo}</span>
                        <span className="text-xs text-muted-foreground">tasks</span>
                      </div>
                      <Dialog open={openInsightsDialog === 'todo'} onOpenChange={(open) => setOpenInsightsDialog(open ? 'todo' : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100/80 hover:bg-blue-200/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInsightsDialog('todo');
                            }}
                          >
                            <LineChart className="h-3 w-3" />
                            <span className="sr-only">View insights</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>To Do Tasks Insights</DialogTitle>
                            <DialogDescription>
                              Detailed analysis of your to-do tasks
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h3 className="text-sm font-medium mb-2">Distribution by Project</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Project distribution chart (Coming soon)</p>
                            </div>
                            
                            <h3 className="text-sm font-medium mt-4 mb-2">Due Date Timeline</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Due date timeline (Coming soon)</p>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <DialogClose>Close</DialogClose>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to filter by To Do tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "flex flex-col gap-1 bg-amber-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-amber-100/70 hover:scale-[1.02]",
                        "border border-transparent hover:border-amber-200/50 group relative"
                      )}
                      onClick={() => handleStatusFilterClick(TaskStatus.IN_PROGRESS)}
                      tabIndex={0}
                      role="button"
                      aria-label="Filter by In Progress status"
                      onKeyDown={(e) => e.key === 'Enter' && handleStatusFilterClick(TaskStatus.IN_PROGRESS)}
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">In Progress</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{stats.inProgress}</span>
                        <span className="text-xs text-muted-foreground">tasks</span>
                      </div>
                      <Dialog open={openInsightsDialog === 'inprogress'} onOpenChange={(open) => setOpenInsightsDialog(open ? 'inprogress' : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-100/80 hover:bg-amber-200/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInsightsDialog('inprogress');
                            }}
                          >
                            <LineChart className="h-3 w-3" />
                            <span className="sr-only">View insights</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>In Progress Tasks Insights</DialogTitle>
                            <DialogDescription>
                              Detailed analysis of your in-progress tasks
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h3 className="text-sm font-medium mb-2">Time in Progress</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Time in progress analysis (Coming soon)</p>
                            </div>
                            
                            <h3 className="text-sm font-medium mt-4 mb-2">Priority Distribution</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Priority distribution chart (Coming soon)</p>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <DialogClose>Close</DialogClose>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to filter by In Progress tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "flex flex-col gap-1 bg-green-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-green-100/70 hover:scale-[1.02]",
                        "border border-transparent hover:border-green-200/50 group relative"
                      )}
                      onClick={() => handleStatusFilterClick(TaskStatus.DONE)}
                      tabIndex={0}
                      role="button"
                      aria-label="Filter by Completed status"
                      onKeyDown={(e) => e.key === 'Enter' && handleStatusFilterClick(TaskStatus.DONE)}
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">Completed</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{stats.completed}</span>
                        <span className="text-xs text-muted-foreground">tasks</span>
                      </div>
                      <Dialog open={openInsightsDialog === 'completed'} onOpenChange={(open) => setOpenInsightsDialog(open ? 'completed' : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-green-100/80 hover:bg-green-200/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInsightsDialog('completed');
                            }}
                          >
                            <LineChart className="h-3 w-3" />
                            <span className="sr-only">View insights</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Completed Tasks Insights</DialogTitle>
                            <DialogDescription>
                              Analysis of your completed tasks
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h3 className="text-sm font-medium mb-2">Completion Time</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Completion time analysis (Coming soon)</p>
                            </div>
                            
                            <h3 className="text-sm font-medium mt-4 mb-2">Completion Trends</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Weekly completion trends (Coming soon)</p>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <DialogClose>Close</DialogClose>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to filter by Completed tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "flex flex-col gap-1 bg-gray-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-gray-100/70 hover:scale-[1.02]",
                        "border border-transparent hover:border-gray-200/50 group relative"
                      )}
                      onClick={() => setFilters({ ...filters, status: undefined })}
                      tabIndex={0}
                      role="button"
                      aria-label="Show all tasks"
                      onKeyDown={(e) => e.key === 'Enter' && setFilters({ ...filters, status: undefined })}
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">Total</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{stats.total}</span>
                        <span className="text-xs text-muted-foreground">tasks</span>
                      </div>
                      <Dialog open={openInsightsDialog === 'total'} onOpenChange={(open) => setOpenInsightsDialog(open ? 'total' : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100/80 hover:bg-gray-200/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInsightsDialog('total');
                            }}
                          >
                            <LineChart className="h-3 w-3" />
                            <span className="sr-only">View insights</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Overall Task Insights</DialogTitle>
                            <DialogDescription>
                              Complete overview of all your tasks
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h3 className="text-sm font-medium mb-2">Task Status Distribution</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Status distribution chart (Coming soon)</p>
                            </div>
                            
                            <h3 className="text-sm font-medium mt-4 mb-2">Task Creation Trends</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Creation trends over time (Coming soon)</p>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <DialogClose>Close</DialogClose>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to show all tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span>Priority</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "flex flex-col gap-1 bg-red-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-red-100/70 hover:scale-[1.02]",
                        "border border-transparent hover:border-red-200/50 group relative"
                      )}
                      onClick={() => handlePriorityFilterClick(TaskPriority.URGENT)}
                      tabIndex={0}
                      role="button"
                      aria-label="Filter by Urgent priority"
                      onKeyDown={(e) => e.key === 'Enter' && handlePriorityFilterClick(TaskPriority.URGENT)}
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">Urgent</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{stats.urgent}</span>
                        <span className="text-xs text-muted-foreground">tasks</span>
                      </div>
                      <Dialog open={openInsightsDialog === 'urgent'} onOpenChange={(open) => setOpenInsightsDialog(open ? 'urgent' : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100/80 hover:bg-red-200/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInsightsDialog('urgent');
                            }}
                          >
                            <LineChart className="h-3 w-3" />
                            <span className="sr-only">View insights</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Urgent Tasks Insights</DialogTitle>
                            <DialogDescription>
                              Analysis of your urgent priority tasks
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h3 className="text-sm font-medium mb-2">Status Distribution</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Status distribution for urgent tasks (Coming soon)</p>
                            </div>
                            
                            <h3 className="text-sm font-medium mt-4 mb-2">Due Date Proximity</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Due date timeline (Coming soon)</p>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <DialogClose>Close</DialogClose>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to filter by Urgent priority tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "flex flex-col gap-1 bg-orange-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-orange-100/70 hover:scale-[1.02]",
                        "border border-transparent hover:border-orange-200/50 group relative"
                      )}
                      onClick={() => handlePriorityFilterClick(TaskPriority.HIGH)}
                      tabIndex={0}
                      role="button"
                      aria-label="Filter by High priority"
                      onKeyDown={(e) => e.key === 'Enter' && handlePriorityFilterClick(TaskPriority.HIGH)}
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">High</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{stats.high}</span>
                        <span className="text-xs text-muted-foreground">tasks</span>
                      </div>
                      <Dialog open={openInsightsDialog === 'high'} onOpenChange={(open) => setOpenInsightsDialog(open ? 'high' : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-orange-100/80 hover:bg-orange-200/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInsightsDialog('high');
                            }}
                          >
                            <LineChart className="h-3 w-3" />
                            <span className="sr-only">View insights</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>High Priority Tasks Insights</DialogTitle>
                            <DialogDescription>
                              Analysis of your high priority tasks
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h3 className="text-sm font-medium mb-2">Status Distribution</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Status distribution for high priority tasks (Coming soon)</p>
                            </div>
                            
                            <h3 className="text-sm font-medium mt-4 mb-2">Project Distribution</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Project distribution (Coming soon)</p>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <DialogClose>Close</DialogClose>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to filter by High priority tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "flex flex-col gap-1 bg-red-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-red-100/70 hover:scale-[1.02]",
                        "border border-transparent hover:border-red-200/50 group relative"
                      )}
                      onClick={handleOverdueFilterClick}
                      tabIndex={0}
                      role="button"
                      aria-label="Filter by Overdue tasks"
                      onKeyDown={(e) => e.key === 'Enter' && handleOverdueFilterClick()}
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">Overdue</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{stats.overdue}</span>
                        <span className="text-xs text-muted-foreground">tasks</span>
                      </div>
                      <Dialog open={openInsightsDialog === 'overdue'} onOpenChange={(open) => setOpenInsightsDialog(open ? 'overdue' : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100/80 hover:bg-red-200/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInsightsDialog('overdue');
                            }}
                          >
                            <LineChart className="h-3 w-3" />
                            <span className="sr-only">View insights</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Overdue Tasks Insights</DialogTitle>
                            <DialogDescription>
                              Analysis of tasks that are past their due date
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h3 className="text-sm font-medium mb-2">Days Overdue</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Days overdue analysis (Coming soon)</p>
                            </div>
                            
                            <h3 className="text-sm font-medium mt-4 mb-2">Priority Distribution</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Priority distribution for overdue tasks (Coming soon)</p>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <DialogClose>Close</DialogClose>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to filter by Overdue tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "flex flex-col gap-1 bg-blue-50/50 rounded-md p-2 cursor-pointer transition-all hover:bg-blue-100/70 hover:scale-[1.02]",
                        "border border-transparent hover:border-blue-200/50 group relative"
                      )}
                      onClick={handleDueTodayFilterClick}
                      tabIndex={0}
                      role="button"
                      aria-label="Filter by Due Today tasks"
                      onKeyDown={(e) => e.key === 'Enter' && handleDueTodayFilterClick()}
                    >
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">Due Today</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold">{stats.dueToday}</span>
                        <span className="text-xs text-muted-foreground">tasks</span>
                      </div>
                      <Dialog open={openInsightsDialog === 'duetoday'} onOpenChange={(open) => setOpenInsightsDialog(open ? 'duetoday' : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100/80 hover:bg-blue-200/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInsightsDialog('duetoday');
                            }}
                          >
                            <LineChart className="h-3 w-3" />
                            <span className="sr-only">View insights</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Due Today Tasks Insights</DialogTitle>
                            <DialogDescription>
                              Analysis of tasks due today
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <h3 className="text-sm font-medium mb-2">Status Distribution</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Status distribution for today's tasks (Coming soon)</p>
                            </div>
                            
                            <h3 className="text-sm font-medium mt-4 mb-2">Priority Breakdown</h3>
                            <div className="h-[150px] bg-muted/30 rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Priority breakdown (Coming soon)</p>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <DialogClose>Close</DialogClose>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to filter by tasks due today</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium mb-3">
              <CircleCheck className="h-4 w-4 text-primary" />
              <span>Progress</span>
            </div>
            
            <div className="flex flex-col h-full justify-center items-center">
              <div className="relative h-24 w-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e6e6e6"
                    strokeWidth="8"
                  />
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
