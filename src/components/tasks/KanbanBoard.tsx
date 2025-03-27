
import { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  DragCancelEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore } from '@/store';
import { Task, TaskStatus } from '@/types/task';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export function KanbanBoard() {
  const { 
    tasks, 
    isLoading, 
    error, 
    filters, 
    getFilteredTasks, 
    updateTask 
  } = useTaskStore();
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();
  
  // Enhanced sensors with better activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Increase distance for mobile to prevent accidental drags
        distance: isMobile ? 12 : 8,
        // Add delay activation for touch devices
        delay: isMobile ? 200 : 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
  
  // Get column by ID helper function
  const getColumnByTaskId = (taskId: string): string | null => {
    for (const column of columns) {
      if (column.tasks.some(t => t.id === taskId)) {
        return column.id;
      }
    }
    return null;
  };
  
  // Find task by ID helper function
  const findTaskById = (taskId: string): Task | undefined => {
    return tasks.find(t => t.id === taskId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    const task = findTaskById(taskId);
    
    if (task) {
      setActiveTask(task);
      setIsDragging(true);
      
      // Announce to screen readers
      const announcement = `Started dragging task: ${task.title}`;
      if (typeof window !== 'undefined') {
        const announcementElement = document.getElementById('drag-announcement');
        if (announcementElement) {
          announcementElement.textContent = announcement;
        }
      }
    }
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active.id || !over.id) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Skip if not dragging over a column
    if (!overId.startsWith('column-')) return;
    
    const activeColumnId = getColumnByTaskId(activeId);
    
    // If dragging over a different column, update the visual feedback
    if (activeColumnId !== overId) {
      // You can update some state here if needed for visual feedback
    }
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const taskId = active.id as string;
    const targetId = over.id as string;
    
    // If dropping on a column, update the task status
    if (targetId.startsWith('column-')) {
      const newStatus = targetId.replace('column-', '') as TaskStatus;
      const task = findTaskById(taskId);
      
      if (task && task.status !== newStatus) {
        // Optimistic UI update
        const oldStatus = task.status;
        
        try {
          // Show toast for status change
          toast({
            title: 'Moving task',
            description: `Changing status to ${newStatus}`,
          });
          
          // Update the task in the database
          await updateTask({ id: taskId, status: newStatus });
          
          // Announce to screen readers
          const announcement = `Task moved to ${newStatus} column`;
          if (typeof window !== 'undefined') {
            const announcementElement = document.getElementById('drag-announcement');
            if (announcementElement) {
              announcementElement.textContent = announcement;
            }
          }
        } catch (error) {
          console.error('Error updating task status:', error);
          toast({
            title: 'Error',
            description: 'Failed to update task status',
            variant: 'destructive',
          });
        }
      }
    }
    
    setActiveTask(null);
  };
  
  const handleDragCancel = (event: DragCancelEvent) => {
    setIsDragging(false);
    setActiveTask(null);
    
    // Announce to screen readers
    const announcement = 'Cancelled dragging task';
    if (typeof window !== 'undefined') {
      const announcementElement = document.getElementById('drag-announcement');
      if (announcementElement) {
        announcementElement.textContent = announcement;
      }
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
    <div className="space-y-6 animate-fade-in">
      {isLoading && tasks.length > 0 && (
        <div className="flex justify-center mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      
      {/* Screen reader announcement for drag operations */}
      <div 
        id="drag-announcement" 
        role="status" 
        aria-live="assertive" 
        className="sr-only"
      ></div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
      >
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
                isDraggingActive={isDragging}
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
                isDraggingActive={isDragging}
              />
            ))}
          </div>
        </div>
        
        {/* Drag Overlay with improved visual feedback */}
        <DragOverlay adjustScale={true} zIndex={100}>
          {activeTask && (
            <div className="opacity-80 transform scale-105 w-[calc(100%-2rem)] shadow-lg">
              <TaskCard 
                task={activeTask} 
                isDragging={true} 
                isCompact={true} 
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
      
      {getFilteredTasks().length === 0 && (
        <div className="flex flex-col items-center justify-center h-60 text-center mt-8">
          <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filters.searchQuery || (filters.tags && filters.tags.length > 0) ? 'Try different filters' : 'Create your first task to get started'}
          </p>
        </div>
      )}
    </div>
  );
}
