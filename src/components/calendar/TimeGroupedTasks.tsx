
import { useMemo } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { format, parse, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Sunset, Moon, Check, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeGroupedTasksProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onComplete: (task: Task) => void;
}

type TimeGroup = 'morning' | 'afternoon' | 'evening' | 'unspecified';

interface GroupedTasks {
  morning: Task[];
  afternoon: Task[];
  evening: Task[];
  unspecified: Task[];
}

export function TimeGroupedTasks({ tasks, onEdit, onDelete, onComplete }: TimeGroupedTasksProps) {
  const groupedTasks = useMemo(() => {
    const groups: GroupedTasks = {
      morning: [],
      afternoon: [],
      evening: [],
      unspecified: []
    };
    
    tasks.forEach(task => {
      if (!task.dueDate) {
        groups.unspecified.push(task);
        return;
      }
      
      try {
        const date = new Date(task.dueDate);
        
        if (!isValid(date)) {
          groups.unspecified.push(task);
          return;
        }
        
        const hours = date.getHours();
        
        if (hours < 12) {
          groups.morning.push(task);
        } else if (hours < 17) {
          groups.afternoon.push(task);
        } else {
          groups.evening.push(task);
        }
      } catch (e) {
        groups.unspecified.push(task);
      }
    });
    
    return groups;
  }, [tasks]);
  
  const getTimeGroupInfo = (group: TimeGroup) => {
    switch (group) {
      case 'morning':
        return { title: "Morning", icon: Sun, color: "text-amber-500" };
      case 'afternoon':
        return { title: "Afternoon", icon: Sunset, color: "text-orange-500" };
      case 'evening':
        return { title: "Evening", icon: Moon, color: "text-indigo-500" };
      default:
        return { title: "All Day", icon: Clock, color: "text-gray-500" };
    }
  };
  
  const renderTaskGroup = (group: TimeGroup) => {
    const tasks = groupedTasks[group];
    if (tasks.length === 0) return null;
    
    const { title, icon: Icon, color } = getTimeGroupInfo(group);
    
    return (
      <div key={group} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("h-4 w-4", color)} />
          <h3 className="text-sm font-medium">{title}</h3>
          <Badge variant="outline" className="text-xs ml-1">
            {tasks.length}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {tasks.map(task => (
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
                      onClick={() => onEdit(task)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button 
                      onClick={() => onDelete(task.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {task.dueDate && (
                  <div className="text-xs text-muted-foreground flex items-center mb-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(task.dueDate), 'h:mm a')}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {task.priority}
                  </Badge>
                  {task.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {task.status !== TaskStatus.DONE && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs mt-2 h-7 w-full justify-start"
                    onClick={() => onComplete(task)}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-2">
      {renderTaskGroup('morning')}
      {renderTaskGroup('afternoon')}
      {renderTaskGroup('evening')}
      {renderTaskGroup('unspecified')}
    </div>
  );
}
