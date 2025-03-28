
import { useState } from 'react';
import { CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore } from '@/store';
import { Task, TaskStatus } from '@/types/task';
import { KanbanColumn } from './KanbanColumn';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, DragStartEvent } from '@dnd-kit/core';
import { KanbanDragOverlay } from './KanbanDragOverlay';

export function KanbanBoard() {
  const { 
    tasks, 
    isLoading, 
    error, 
    filters, 
    getFilteredTasks,
    setTaskStatus
  } = useTaskStore();
  
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();
  
  // Filter tasks by status
  const todoTasks = getFilteredTasks().filter(task => task.status === TaskStatus.TODO);
  const inProgressTasks = getFilteredTasks().filter(task => task.status === TaskStatus.IN_PROGRESS);
  const doneTasks = getFilteredTasks().filter(task => task.status === TaskStatus.DONE);
  const archivedTasks = getFilteredTasks().filter(task => task.status === TaskStatus.ARCHIVED);
  
  // Define all columns and their data
  const columns = [
    { id: `column-${TaskStatus.TODO}`, title: 'To Do', tasks: todoTasks, status: TaskStatus.TODO },
    { id: `column-${TaskStatus.IN_PROGRESS}`, title: 'In Progress', tasks: inProgressTasks, status: TaskStatus.IN_PROGRESS },
    { id: `column-${TaskStatus.DONE}`, title: 'Done', tasks: doneTasks, status: TaskStatus.DONE },
    { id: `column-${TaskStatus.ARCHIVED}`, title: 'Archived', tasks: archivedTasks, status: TaskStatus.ARCHIVED },
  ];
  
  // Configure the sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 12 : 8, // Require more movement on mobile
        delay: isMobile ? 200 : 0, // Add a delay for mobile touch
      },
    })
  );
  
  // Handle drag start - set the active task
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id.toString();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      setActiveTask(task);
      setIsDragging(true);
      
      // Announce to screen readers
      if (typeof window !== 'undefined') {
        const announcement = document.getElementById('drag-announcement');
        if (announcement) {
          announcement.textContent = `Dragging task: ${task.title}`;
        }
      }
    }
  };
  
  // Handle drag end - update task status when dropped in a new column
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setIsDragging(false);
    setActiveTask(null);
    
    if (!over) return;
    
    const taskId = active.id.toString();
    const targetColumnId = over.id.toString();
    
    // Extract the status from the column ID (format: "column-STATUS")
    const newStatus = targetColumnId.split('-')[1] as TaskStatus;
    
    // Find the current task
    const task = tasks.find(t => t.id === taskId);
    
    // Only update if the status is actually changing
    if (task && task.status !== newStatus) {
      setTaskStatus(taskId, newStatus)
        .then(() => {
          toast({
            title: "Task updated",
            description: `Task moved to ${columns.find(c => c.status === newStatus)?.title}`
          });
          
          // Announce to screen readers
          if (typeof window !== 'undefined') {
            const announcement = document.getElementById('drag-announcement');
            if (announcement) {
              announcement.textContent = `Task ${task.title} moved to ${columns.find(c => c.status === newStatus)?.title}`;
            }
          }
        })
        .catch(error => {
          console.error("Failed to update task status:", error);
          toast({
            title: "Failed to move task",
            description: "There was an error updating the task status",
            variant: "destructive"
          });
        });
    }
  };
  
  // Navigation for mobile view
  const nextColumn = () => {
    setActiveColumnIndex(prev => Math.min(prev + 1, columns.length - 1));
  };
  
  const prevColumn = () => {
    setActiveColumnIndex(prev => Math.max(prev - 1, 0));
  };
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error loading tasks</AlertTitle>
        <AlertDescription>
          {typeof error === 'string' ? error : 'There was an error loading your tasks. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }
  
  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 animate-fade-in">
        {isLoading && tasks.length > 0 && (
          <div className="flex justify-center mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        
        {/* Screen reader announcement for operations */}
        <div 
          id="drag-announcement" 
          role="status" 
          aria-live="assertive" 
          className="sr-only"
        ></div>
        
        {/* Mobile View with Column Navigation */}
        {isMobile && (
          <div className="block sm:hidden w-full">
            <div className="flex justify-between items-center mb-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={prevColumn}
                disabled={activeColumnIndex === 0}
                className="h-8 w-8"
                aria-label="Previous column"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {columns[activeColumnIndex].title} 
                <span className="ml-1 text-xs text-muted-foreground">
                  ({activeColumnIndex + 1}/{columns.length})
                </span>
              </span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={nextColumn}
                disabled={activeColumnIndex === columns.length - 1}
                className="h-8 w-8"
                aria-label="Next column"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="w-full">
              <KanbanColumn
                key={columns[activeColumnIndex].id}
                id={columns[activeColumnIndex].id}
                title={columns[activeColumnIndex].title}
                tasks={columns[activeColumnIndex].tasks}
                status={columns[activeColumnIndex].status}
                className="h-[calc(100vh-16rem)]"
              />
            </div>
          </div>
        )}
        
        {/* Desktop View with All Columns */}
        <div className={`${isMobile ? 'hidden' : 'block'} w-full overflow-x-auto pb-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[600px] lg:min-w-0">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={column.tasks}
                status={column.status}
              />
            ))}
          </div>
        </div>
        
        {getFilteredTasks().length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 text-center mt-8">
            <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No tasks found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filters.searchQuery || (filters.tags && filters.tags.length > 0) ? 'Try different filters' : 'Create your first task to get started'}
            </p>
          </div>
        )}
        
        {/* Drag Overlay */}
        <KanbanDragOverlay activeTask={activeTask} isDragging={isDragging} />
      </div>
    </DndContext>
  );
}
