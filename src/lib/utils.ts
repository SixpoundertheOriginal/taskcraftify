
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
      return 'bg-priority-low/10 text-priority-low border-priority-low/20 hover:bg-priority-low/15 hover:border-priority-low/30 transition-colors';
    case TaskPriority.MEDIUM:
      return 'bg-priority-medium/10 text-priority-medium border-priority-medium/20 hover:bg-priority-medium/15 hover:border-priority-medium/30 transition-colors';
    case TaskPriority.HIGH:
      return 'bg-priority-high/10 text-priority-high border-priority-high/20 hover:bg-priority-high/15 hover:border-priority-high/30 transition-colors';
    case TaskPriority.URGENT:
      return 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20 hover:bg-priority-urgent/15 hover:border-priority-urgent/30 transition-colors';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors';
  }
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.BACKLOG:
      return 'bg-status-backlog/10 text-status-backlog border-status-backlog/20 hover:bg-status-backlog/15 hover:border-status-backlog/30 transition-colors';
    case TaskStatus.TODO:
      return 'bg-status-todo/10 text-status-todo border-status-todo/20 hover:bg-status-todo/15 hover:border-status-todo/30 transition-colors';
    case TaskStatus.IN_PROGRESS:
      return 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20 hover:bg-status-in-progress/15 hover:border-status-in-progress/30 transition-colors';
    case TaskStatus.DONE:
      return 'bg-status-done/10 text-status-done border-status-done/20 hover:bg-status-done/15 hover:border-status-done/30 transition-colors';
    case TaskStatus.ARCHIVED:
      return 'bg-status-archived/10 text-status-archived border-status-archived/20 hover:bg-status-archived/15 hover:border-status-archived/30 transition-colors';
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
