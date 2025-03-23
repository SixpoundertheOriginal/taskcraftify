
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  TaskPriority, 
  TaskStatus 
} from "@/types/task";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case TaskPriority.MEDIUM:
      return 'bg-green-50 text-green-700 border-green-200';
    case TaskPriority.HIGH:
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case TaskPriority.URGENT:
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.BACKLOG:
      return 'bg-gray-50 text-gray-700 border-gray-200';
    case TaskStatus.TODO:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case TaskStatus.IN_PROGRESS:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case TaskStatus.DONE:
      return 'bg-green-50 text-green-700 border-green-200';
    case TaskStatus.ARCHIVED:
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return 'Low';
    case TaskPriority.MEDIUM:
      return 'Medium';
    case TaskPriority.HIGH:
      return 'High';
    case TaskPriority.URGENT:
      return 'Urgent';
    default:
      return 'Unknown';
  }
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.BACKLOG:
      return 'Backlog';
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
}

export function isOverdue(dueDate: Date | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
