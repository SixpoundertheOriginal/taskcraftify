
import { TaskStatus, TaskPriority } from '@/types/task';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isPast, isToday, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce(fn: Function, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    case TaskStatus.IN_PROGRESS:
      return "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    case TaskStatus.DONE:
      return "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
    case TaskStatus.ARCHIVED:
      return "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    case TaskStatus.BACKLOG:
      return "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
    default:
      return "border-muted-foreground";
  }
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return "To Do";
    case TaskStatus.IN_PROGRESS:
      return "In Progress";
    case TaskStatus.DONE:
      return "Completed";
    case TaskStatus.ARCHIVED:
      return "Archived";
    case TaskStatus.BACKLOG:
      return "Backlog";
    default:
      return status;
  }
}

export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
    case TaskPriority.MEDIUM:
      return "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    case TaskPriority.HIGH:
      return "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
    case TaskPriority.URGENT:
      return "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
    default:
      return "border-muted-foreground";
  }
}

export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return "Low";
    case TaskPriority.MEDIUM:
      return "Medium";
    case TaskPriority.HIGH:
      return "High";
    case TaskPriority.URGENT:
      return "Urgent";
    default:
      return priority;
  }
}

// Add new functions for date handling

/**
 * Format a date string or Date object into a readable format
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `Today, ${format(dateObj, 'h:mm a')}`;
  }
  
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Check if a date is overdue (in the past and not today)
 */
export function isOverdue(date: string | Date): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  // If the date is in the past but not today, it's overdue
  return isPast(dateObj) && !isToday(dateObj);
}
