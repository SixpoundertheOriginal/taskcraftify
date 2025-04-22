
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';

interface TaskCardActionsProps {
  task: Task;
  setTask: React.Dispatch<React.SetStateAction<Task>>;
  setIsExiting: (value: boolean) => void;
  setIsRemoved: (value: boolean) => void;
  updateTask: (data: Partial<Task> & { id: string }) => Promise<any>;
  deleteTask: (id: string) => void;
}

export function TaskCardActions({
  task,
  setTask,
  setIsExiting,
  setIsRemoved,
  updateTask,
  deleteTask
}: TaskCardActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          size="sm"
          variant="ghost"
          className="hidden opacity-0 group-hover:opacity-100 group-hover:flex h-6 text-xs mt-2 text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronDown className="h-3 w-3 mr-1" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => {
          setTask(prevTask => ({
            ...prevTask,
            status: TaskStatus.TODO
          }));
          setIsExiting(false);
          setIsRemoved(false);
          updateTask({ id: task.id, status: TaskStatus.TODO });
        }}>
          Mark as To Do
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setTask(prevTask => ({
            ...prevTask,
            status: TaskStatus.IN_PROGRESS
          }));
          setIsExiting(false);
          setIsRemoved(false);
          updateTask({ id: task.id, status: TaskStatus.IN_PROGRESS });
        }}>
          Mark as In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setTask(prevTask => ({
            ...prevTask,
            status: TaskStatus.DONE
          }));
          setIsExiting(true);
          updateTask({ id: task.id, status: TaskStatus.DONE });
        }}>
          Mark as Done
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setTask(prevTask => ({
            ...prevTask,
            status: TaskStatus.ARCHIVED
          }));
          updateTask({ id: task.id, status: TaskStatus.ARCHIVED });
        }}>
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => deleteTask(task.id)}>
          Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
