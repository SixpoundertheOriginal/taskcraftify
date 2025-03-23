
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
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useTaskStore } from '@/store';
import { Task, TaskStatus } from '@/types/task';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function KanbanBoard() {
  const { 
    tasks, 
    isLoading, 
    error, 
    filters, 
    getFilteredTasks, 
    updateTask 
  } = useTaskStore();
  
  // Track the active dragged task
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before a drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Filter tasks by status
  const todoTasks = getFilteredTasks().filter(task => task.status === TaskStatus.TODO);
  const inProgressTasks = getFilteredTasks().filter(task => task.status === TaskStatus.IN_PROGRESS);
  const doneTasks = getFilteredTasks().filter(task => task.status === TaskStatus.DONE);
  const archivedTasks = getFilteredTasks().filter(task => task.status === TaskStatus.ARCHIVED);
  
  // Get status label
  const getColumnTitle = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.DONE:
        return 'Done';
      case TaskStatus.ARCHIVED:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      setActiveTask(task);
    }
  };
  
  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const taskId = active.id as string;
    const targetColumnId = over.id as string;
    
    // Update task status if moved to a different column
    if (targetColumnId.startsWith('column-')) {
      const newStatus = targetColumnId.replace('column-', '') as TaskStatus;
      const task = tasks.find(t => t.id === taskId);
      
      if (task && task.status !== newStatus) {
        await updateTask({ id: taskId, status: newStatus });
      }
    }
    
    setActiveTask(null);
  };
  
  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.id as string;
    const targetId = over.id as string;
    
    // If dragging over another task, we'll handle reordering in future
    // For now we just need to handle column changes
  };
  
  // Show error state if there's an error
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
  
  // Show loading state when initially loading data
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
      {/* Loading indicator while refreshing with existing data */}
      {isLoading && tasks.length > 0 && (
        <div className="flex justify-center mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      
      <div className="w-full overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[800px]">
            <KanbanColumn 
              id={`column-${TaskStatus.TODO}`}
              title={getColumnTitle(TaskStatus.TODO)}
              tasks={todoTasks} 
              status={TaskStatus.TODO}
            />
            
            <KanbanColumn 
              id={`column-${TaskStatus.IN_PROGRESS}`}
              title={getColumnTitle(TaskStatus.IN_PROGRESS)}
              tasks={inProgressTasks}
              status={TaskStatus.IN_PROGRESS}
            />
            
            <KanbanColumn 
              id={`column-${TaskStatus.DONE}`}
              title={getColumnTitle(TaskStatus.DONE)}
              tasks={doneTasks}
              status={TaskStatus.DONE}
            />
            
            <KanbanColumn 
              id={`column-${TaskStatus.ARCHIVED}`}
              title={getColumnTitle(TaskStatus.ARCHIVED)}
              tasks={archivedTasks}
              status={TaskStatus.ARCHIVED}
            />
          </div>
          
          {/* Overlay for dragged task */}
          <DragOverlay>
            {activeTask && (
              <div className="w-[calc(100%-2rem)] opacity-80">
                <TaskCard task={activeTask} isDragging={true} />
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
    </div>
  );
}
