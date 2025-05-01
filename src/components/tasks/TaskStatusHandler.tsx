
import { TaskStatus } from '@/types/task';
import { toast } from '@/hooks/use-toast';
import { RefObject } from 'react';

interface TaskStatusHandlerProps {
  taskId: string;
  taskTitle: string;
  currentStatus: TaskStatus;
  isExiting: boolean;
  isRemoved: boolean;
  lastClickTime: number;
  completeTimeoutRef: RefObject<NodeJS.Timeout | null>;
  updateTask: (data: { id: string; status: TaskStatus; _isRemoved?: boolean }) => Promise<any>;
  refreshTaskCounts: () => void;
  setTask: (task: any) => void;
  setIsExiting: (value: boolean) => void;
  setIsRemoved: (value: boolean) => void;
  setLastClickTime: (time: number) => void;
}

export function handleStatusClick({
  taskId,
  taskTitle,
  currentStatus,
  isExiting,
  isRemoved,
  lastClickTime,
  completeTimeoutRef,
  updateTask,
  refreshTaskCounts,
  setTask,
  setIsExiting,
  setIsRemoved,
  setLastClickTime
}: TaskStatusHandlerProps) {
  if (currentStatus === TaskStatus.ARCHIVED) return;

  const currentTime = new Date().getTime();
  const isDoubleClick = currentTime - lastClickTime < 350;
  setLastClickTime(currentTime);

  if ((isDoubleClick || isExiting) && currentStatus === TaskStatus.DONE) {
    // Clear the timeout if it exists
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      // We set the ref to null in the TaskCard component
    }
    
    console.log(`Undoing completion for task ${taskId}`);
    setTask((prevTask: any) => ({ ...prevTask, status: TaskStatus.TODO }));
    setIsExiting(false);
    setIsRemoved(false);

    updateTask({ id: taskId, status: TaskStatus.TODO, _isRemoved: false })
      .then(() => {
        refreshTaskCounts();
        toast({
          title: "Task restored",
          description: `"${taskTitle}" moved back to todo.`,
          variant: "default"
        });
      })
      .catch(() => {
        setTask((prevTask: any) => ({ ...prevTask, status: TaskStatus.DONE }));
        setIsExiting(false);
        setIsRemoved(false);
        toast({
          title: "Restore failed",
          description: "Failed to restore task. Please try again.",
          variant: "destructive"
        });
      });
    return;
  }

  if (currentStatus !== TaskStatus.DONE) {
    console.log(`Marking task ${taskId} as done`);
    
    setTask((prevTask: any) => ({
      ...prevTask,
      status: TaskStatus.DONE
    }));
    setIsExiting(true);
    setIsRemoved(false);

    return;
  }

  if (currentStatus === TaskStatus.DONE && !completeTimeoutRef.current) {
    console.log(`Reopening already-done task ${taskId}`);
    setIsRemoved(false);
    setTask((prevTask: any) => ({
      ...prevTask,
      status: TaskStatus.TODO
    }));
    updateTask({ id: taskId, status: TaskStatus.TODO, _isRemoved: false })
      .then(() => {
        refreshTaskCounts();
        toast({
          title: "Task reopened",
          description: `"${taskTitle}" has been marked as to do.`,
          variant: "default"
        });
      })
      .catch(() => {
        setTask((prevTask: any) => ({ ...prevTask, status: TaskStatus.DONE }));
        setIsRemoved(true);
        toast({
          title: "Status update failed", 
          description: "Failed to update task status. Please try again.",
          variant: "destructive"
        });
      });
  }
}
