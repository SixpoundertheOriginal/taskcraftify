import { useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Task, TaskStatus } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeGroupedTasksProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onComplete?: (task: Task) => void;
}

// Define explicit interface for grouped tasks
interface GroupedTasks {
  morning: Task[];
  afternoon: Task[];
  evening: Task[];
  unspecified: Task[];
}

export function TimeGroupedTasks({ tasks = [], onEdit, onDelete, onComplete }: TimeGroupedTasksProps) {
  // Ensure tasks is always an array
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  
  const groupedTasks = useMemo(() => {
    // Initialize groups with empty arrays
    const groups: GroupedTasks = {
      morning: [],
      afternoon: [],
      evening: [],
      unspecified: []
    };
    
    safeTasks.forEach(task => {
      if (!task.dueDate) {
        groups.unspecified.push(task);
        return;
      }
      
      try {
        const date = new Date(task.dueDate);
        const hours = date.getHours();
        
        if (hours >= 5 && hours < 12) {
          groups.morning.push(task);
        } else if (hours >= 12 && hours < 17) {
          groups.afternoon.push(task);
        } else if (hours >= 17 && hours < 24) {
          groups.evening.push(task);
        } else {
          groups.unspecified.push(task);
        }
      } catch (e) {
        console.error('Error parsing date for task:', task);
        groups.unspecified.push(task);
      }
    });
    
    return groups;
  }, [safeTasks]);
  
  const hasTimeSpecificTasks = useMemo(() => {
    return (
      groupedTasks.morning.length > 0 ||
      groupedTasks.afternoon.length > 0 ||
      groupedTasks.evening.length > 0
    );
  }, [groupedTasks.morning, groupedTasks.afternoon, groupedTasks.evening]);
  
  const renderTaskCard = (task: Task) => {
    const isCompleted = task.status === TaskStatus.DONE;
    
    return (
      <Card key={task.id} className={cn(
        "mb-2 hover:bg-muted/50 transition-colors cursor-default border-l-4 border-l-primary/60",
        isCompleted && "border-l-green-500/60 bg-muted/30",
      )}>
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className={cn(
              "flex-1",
              isCompleted && "text-muted-foreground line-through"
            )}>
              <div className="font-medium text-sm">{task.title}</div>
              {task.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {task.description.substring(0, 100)}
                  {task.description.length > 100 && '...'}
                </div>
              )}
            </div>
            <div className="flex gap-1 ml-2">
              {onComplete && !isCompleted && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          
          {task.dueDate && isValid(new Date(task.dueDate)) && (
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{format(new Date(task.dueDate), 'h:mm a')}</span>
            </div>
          )}
        </div>
      </Card>
    );
  };
  
  return (
    <div className="space-y-4">
      {hasTimeSpecificTasks ? (
        <>
          {groupedTasks.morning.length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <Badge variant="outline" className="mr-2 bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-200">Morning</Badge>
                <span className="text-xs text-muted-foreground">5:00 AM - 11:59 AM</span>
              </h4>
              <div className="mt-2">
                {groupedTasks.morning.map(task => renderTaskCard(task))}
              </div>
            </div>
          )}
          
          {groupedTasks.afternoon.length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <Badge variant="outline" className="mr-2 bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-200">Afternoon</Badge>
                <span className="text-xs text-muted-foreground">12:00 PM - 4:59 PM</span>
              </h4>
              <div className="mt-2">
                {groupedTasks.afternoon.map(task => renderTaskCard(task))}
              </div>
            </div>
          )}
          
          {groupedTasks.evening.length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center">
                <Badge variant="outline" className="mr-2 bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-200">Evening</Badge>
                <span className="text-xs text-muted-foreground">5:00 PM - 11:59 PM</span>
              </h4>
              <div className="mt-2">
                {groupedTasks.evening.map(task => renderTaskCard(task))}
              </div>
            </div>
          )}
        </>
      ) : null}
      
      {groupedTasks.unspecified.length > 0 && (
        <div>
          {hasTimeSpecificTasks && (
            <h4 className="text-sm font-medium flex items-center">
              <Badge variant="outline" className="mr-2">No Time</Badge>
            </h4>
          )}
          <div className="mt-2">
            {groupedTasks.unspecified.map(task => renderTaskCard(task))}
          </div>
        </div>
      )}
      
      {(!hasTimeSpecificTasks && groupedTasks.unspecified.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tasks scheduled for this time period.</p>
        </div>
      )}
    </div>
  );
}
