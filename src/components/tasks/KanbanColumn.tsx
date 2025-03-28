
import { useTaskStore } from '@/store/taskStore/taskStore';
import { Task, TaskStatus } from '@/types/task';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { TaskForm } from './TaskForm';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  status: TaskStatus;
  className?: string;
}

export function KanbanColumn({ id, title, tasks, status, className }: KanbanColumnProps) {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Set up this column as a droppable area
  const { setNodeRef, isOver } = useDroppable({
    id: id
  });
  
  // Add styles for when a drag is over this column
  const columnClass = cn(
    "flex flex-col h-full rounded-lg border bg-card transition-all duration-200",
    isOver ? "border-primary border-dashed bg-primary/5" : "border-border/40",
    className
  );
  
  const handleAddTask = () => {
    setIsTaskFormOpen(true);
  };
  
  return (
    <div 
      ref={setNodeRef}
      className={columnClass}
      aria-label={`${title} column`}
      role="region"
    >
      <div className="p-3 border-b flex items-center justify-between bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            size="sm" 
            className={cn(getStatusColor(status), "flex items-center gap-1 py-0.5")}
          >
            {getStatusLabel(status)}
          </Badge>
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {tasks.length}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full hover:bg-primary/10 transition-colors"
          onClick={handleAddTask}
          aria-label={`Add task to ${title}`}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add task</span>
        </Button>
      </div>
      
      <div className={cn(
        "p-3 flex-1 overflow-y-auto",
        isMobile ? "max-h-[calc(100vh-12rem)]" : "max-h-[calc(100vh-14rem)]"
      )}>
        {tasks.length > 0 ? (
          <div 
            className="flex flex-col gap-4" 
            aria-label={`${tasks.length} tasks in ${title}`}
          >
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                isCompact={true} // More compact view for Kanban
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm text-muted-foreground">
              No tasks in this column
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 hover:bg-primary/10"
              onClick={handleAddTask}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>
        )}
      </div>
      
      <TaskForm 
        open={isTaskFormOpen} 
        onOpenChange={setIsTaskFormOpen} 
        initialStatus={status}
      />
    </div>
  );
}
