
import { TaskStatus } from '@/types/task';
import { toast } from '@/hooks/use-toast';
import { MutableRefObject } from 'react';

interface TaskStatusHandlerProps {
  taskId: string;
  taskTitle: string;
  currentStatus: TaskStatus;
  isExiting: boolean;
  isRemoved: boolean;
  lastClickTime: number;
  completeTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  updateTask: (data: { id: string; status?: TaskStatus; _isRemoved?: boolean }) => Promise<any>;
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
  // Don't handle clicks for archived tasks
  if (currentStatus === TaskStatus.ARCHIVED) return;

  // Track double-clicks
  const currentTime = new Date().getTime();
  const isDoubleClick = currentTime - lastClickTime < 350;
  setLastClickTime(currentTime);

  // Handle double-click or existing animation to undo completion
  if ((isDoubleClick || isExiting) && currentStatus === TaskStatus.DONE) {
    // Clear the timeout if it exists
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
    
    console.log(`Undoing completion for task ${taskId}`);
    // Update local state
    setTask((prevTask: any) => ({ ...prevTask, status: TaskStatus.TODO }));
    setIsExiting(false);
    setIsRemoved(false);

    // Update in backend
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
        // Revert on error
        setTask((prevTask: any) => ({ ...prevTask, status: TaskStatus.DONE }));
        toast({
          title: "Restore failed",
          description: "Failed to restore task. Please try again.",
          variant: "destructive"
        });
      });
    return;
  }

  // Mark a task as done
  if (currentStatus !== TaskStatus.DONE) {
    console.log(`Marking task ${taskId} as done`);
    
    // Update local state
    setTask((prevTask: any) => ({
      ...prevTask,
      status: TaskStatus.DONE
    }));
    
    // Update in backend and only trigger animation after successful update
    updateTask({ id: taskId, status: TaskStatus.DONE })
      .then(() => {
        refreshTaskCounts();
        // Only trigger animation if not already exiting
        if (!isExiting) {
          setIsExiting(true);
        }
      })
      .catch(() => {
        // Revert on error
        setTask((prevTask: any) => ({ ...prevTask, status: currentStatus }));
        toast({
          title: "Status update failed", 
          description: "Failed to mark task as done. Please try again.",
          variant: "destructive"
        });
      });
      
    return;
  }

  // Reopen an already-done task
  if (currentStatus === TaskStatus.DONE && !completeTimeoutRef.current) {
    console.log(`Reopening already-done task ${taskId}`);
    
    // Update local state
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
        // Revert on error
        setTask((prevTask: any) => ({ ...prevTask, status: TaskStatus.DONE }));
        toast({
          title: "Status update failed", 
          description: "Failed to update task status. Please try again.",
          variant: "destructive"
        });
      });
  }
}
