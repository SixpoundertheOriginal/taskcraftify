
import { cn } from '@/lib/utils';
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

/**
 * Generate standard button classes for consistency
 */
export function getButtonClasses({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  disabled = false
}: {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive',
  size?: 'sm' | 'default' | 'lg' | 'icon',
  fullWidth?: boolean,
  disabled?: boolean
} = {}): string {
  const variantClasses = {
    'default': 'bg-primary text-primary-foreground hover:bg-primary/90',
    'primary': 'bg-primary text-primary-foreground hover:bg-primary/90',
    'secondary': 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    'outline': 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    'ghost': 'hover:bg-accent hover:text-accent-foreground',
    'destructive': 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };
  
  const sizeClasses = {
    'sm': 'h-9 rounded-md px-3',
    'default': 'h-10 px-4 py-2',
    'lg': 'h-11 rounded-md px-8',
    'icon': 'h-10 w-10',
  };
  
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    disabled && 'opacity-50 pointer-events-none'
  );
}

/**
 * Generate consistent text styles
 */
export function getTextClasses({
  variant = 'default',
  size = 'default',
  weight = 'normal',
  color = 'default'
}: {
  variant?: 'default' | 'heading' | 'subheading' | 'label' | 'caption',
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl',
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold',
  color?: 'default' | 'muted' | 'accent' | 'primary' | 'success' | 'warning' | 'error'
} = {}): string {
  const variantClasses = {
    'default': '',
    'heading': 'tracking-tight',
    'subheading': 'text-muted-foreground',
    'label': 'font-medium',
    'caption': 'text-xs text-muted-foreground',
  };
  
  const sizeClasses = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'default': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };
  
  const weightClasses = {
    'light': 'font-light',
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
  };
  
  const colorClasses = {
    'default': 'text-foreground',
    'muted': 'text-muted-foreground',
    'accent': 'text-accent-foreground',
    'primary': 'text-primary',
    'success': 'text-green-600 dark:text-green-400',
    'warning': 'text-amber-600 dark:text-amber-400',
    'error': 'text-red-600 dark:text-red-400',
  };
  
  return cn(
    variantClasses[variant],
    sizeClasses[size],
    weightClasses[weight],
    colorClasses[color]
  );
}

/**
 * Generate consistent badge/chip classes
 */
export function getBadgeClasses({
  variant = 'default',
  size = 'default'
}: {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error',
  size?: 'sm' | 'default' | 'lg'
} = {}): string {
  const variantClasses = {
    'default': 'bg-primary text-primary-foreground hover:bg-primary/80',
    'secondary': 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    'outline': 'border border-input bg-background text-foreground',
    'success': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'warning': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  
  const sizeClasses = {
    'sm': 'px-2 py-0.5 text-xs leading-3',
    'default': 'px-2.5 py-0.5 text-xs',
    'lg': 'px-3 py-1 text-sm',
  };
  
  return cn(
    'inline-flex items-center rounded-full font-semibold transition-colors',
    variantClasses[variant],
    sizeClasses[size]
  );
}

/**
 * Generate consistent form input classes
 */
export function getInputClasses({
  hasError = false,
  disabled = false,
  fullWidth = true
}: {
  hasError?: boolean,
  disabled?: boolean,
  fullWidth?: boolean
} = {}): string {
  return cn(
    'flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    hasError && 'border-red-500 focus-visible:ring-red-500',
    disabled && 'opacity-50 cursor-not-allowed',
    fullWidth && 'w-full'
  );
}
