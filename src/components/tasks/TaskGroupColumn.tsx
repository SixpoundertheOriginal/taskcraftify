
import { Task } from '@/types/task';
import { TaskGroup } from '@/types/taskGroup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskGroupColumnProps {
  group: TaskGroup;
  tasks: Task[];
  isUngrouped?: boolean;
  onDeleteGroup?: () => void;
}

export function TaskGroupColumn({ 
  group, 
  tasks,
  isUngrouped = false,
  onDeleteGroup
}: TaskGroupColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: group.id,
    data: {
      type: 'group',
      group
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  
  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "flex flex-col h-full",
        !isUngrouped && "border-l-4",
        !isUngrouped && group.color ? `border-l-[${group.color}]` : "border-l-primary"
      )}
    >
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
        <CardTitle 
          className="text-base font-medium cursor-grab" 
          {...attributes} 
          {...listeners}
        >
          {group.name} 
          <span className="ml-2 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </CardTitle>
        
        {!isUngrouped && onDeleteGroup && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Group actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDeleteGroup} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      
      <CardContent className="p-2 flex-1 overflow-y-auto">
        <div className="space-y-2 min-h-[100px]">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-muted-foreground text-sm">
              No tasks yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
