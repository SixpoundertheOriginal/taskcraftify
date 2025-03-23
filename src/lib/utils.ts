import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  TaskPriority, 
  TaskStatus 
} from "@/types/task";
import { Project } from '@/types/project';

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
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors';
    case TaskPriority.MEDIUM:
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors';
    case TaskPriority.HIGH:
      return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors';
    case TaskPriority.URGENT:
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors';
  }
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.BACKLOG:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors';
    case TaskStatus.TODO:
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors';
    case TaskStatus.IN_PROGRESS:
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors';
    case TaskStatus.DONE:
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors';
    case TaskStatus.ARCHIVED:
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-colors';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors';
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

export function getProjectColor(project: Project | undefined, opacity: number = 1): string {
  if (!project) return 'transparent';
  
  // If the color is a hex value, convert to rgba
  if (project.color.startsWith('#')) {
    const hex = project.color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return project.color;
}
