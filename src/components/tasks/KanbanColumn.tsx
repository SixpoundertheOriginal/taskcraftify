
import { useTaskStore } from '@/store/taskStore/taskStore';
import { Task, TaskStatus } from '@/types/task';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { TaskForm } from './TaskForm';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  status: TaskStatus;
}

export function KanbanColumn({ id, title, tasks, status }: KanbanColumnProps) {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const { isOver, setNodeRef } = useDroppable({ id });
  
  // Animation for the column when a task is being dragged over it
  const columnClass = cn(
    "flex flex-col h-full rounded-lg border bg-card transition-all duration-200",
    isOver ? "border-primary/60 bg-accent/30 scale-[1.02] shadow-md" : "border-border/40"
  );
  
  const handleAddTask = () => {
    setIsTaskFormOpen(true);
  };
  
  return (
    <div ref={setNodeRef} className={columnClass}>
      <div className="p-3 border-b flex items-center justify-between bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {tasks.length}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 rounded-full hover:bg-primary/10 transition-colors"
          onClick={handleAddTask}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add task</span>
        </Button>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
        <SortableContext 
          id={id} 
          items={tasks.map(task => task.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.length > 0 ? (
            <div className="flex flex-col gap-3">
              {tasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
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
        </SortableContext>
      </div>
      
      <TaskForm 
        open={isTaskFormOpen} 
        onOpenChange={setIsTaskFormOpen} 
        initialStatus={status}
      />
    </div>
  );
}
