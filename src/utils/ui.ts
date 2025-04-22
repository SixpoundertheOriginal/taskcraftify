
import { cn } from './utils';
import { TaskStatus, TaskPriority } from '@/types/task';
import { THEME_CONSTANTS } from '@/constants/theme';

/**
 * Get appropriate color classes for a task status
 */
export function getStatusColorClasses(status: TaskStatus): string {
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

/**
 * Get appropriate color classes for a priority level
 */
export function getPriorityColorClasses(priority: TaskPriority): string {
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

/**
 * Get standard padding classes based on size
 */
export function getPaddingClasses(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
  switch (size) {
    case 'xs': return 'px-2 py-1';
    case 'sm': return 'px-3 py-2';
    case 'md': return 'px-4 py-3';
    case 'lg': return 'px-6 py-4';
    case 'xl': return 'px-8 py-6';
    default: return 'px-4 py-3';
  }
}

/**
 * Create a consistent card style with options
 */
export function getCardClasses({
  padding = 'md',
  hasHover = false,
  isInteractive = false,
  variant = 'default'
}: {
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
  hasHover?: boolean,
  isInteractive?: boolean,
  variant?: 'default' | 'glass' | 'outline' | 'minimal'
} = {}): string {
  const baseClasses = 'rounded-lg';
  const paddingClasses = getPaddingClasses(padding);
  
  const variantClasses = {
    'default': 'bg-card text-card-foreground border shadow-sm',
    'glass': 'backdrop-blur-xl bg-white/5 dark:bg-black/30 border border-white/10 shadow-lg',
    'outline': 'bg-transparent border',
    'minimal': 'bg-transparent',
  };

  const hoverClasses = hasHover ? 'hover:bg-accent/50 transition-colors duration-200' : '';
  const interactiveClasses = isInteractive ? 'cursor-pointer active:scale-[0.99] transition-transform duration-75' : '';
  
  return cn(
    baseClasses,
    paddingClasses,
    variantClasses[variant],
    hoverClasses,
    interactiveClasses
  );
}

/**
 * Generate standard transition styles
 */
export function getTransitionClasses(properties: string[] = ['all'], duration: 'fast' | 'default' | 'slow' = 'default'): string {
  const durationMap = {
    'fast': '150ms',
    'default': '200ms',
    'slow': '300ms',
  };
  
  return `transition-${properties.join(' transition-')} duration-${durationMap[duration]}`;
}

/**
 * Generate responsive classes for a container
 */
export function getContainerClasses(fluid: boolean = false): string {
  return cn(
    'mx-auto',
    !fluid && 'px-4 sm:px-6 lg:px-8',
    !fluid && 'max-w-7xl'
  );
}
