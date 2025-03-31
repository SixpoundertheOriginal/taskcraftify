
// Import necessary modules
import { Task, APITask, TaskStatus, TaskPriority } from '@/types/task';
import { parseISO, isValid, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns';

// Task categories
export enum TaskCategory {
  OVERDUE = 'overdue',
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  THIS_WEEK = 'this_week',
  HIGH_PRIORITY = 'high_priority',
  RECENTLY_ADDED = 'recently_added',
  ACTIVE = 'active'
}

/**
 * Maps an API task object to a client-side Task object
 */
export const mapApiTaskToTask = (apiTask: APITask): Task => {
  // Debug the dueDate conversion
  console.log(`MapApiTaskToTask for "${apiTask.title}": due_date=${apiTask.due_date}, type=${typeof apiTask.due_date}`);
  
  let dueDate: Date | undefined = undefined;
  
  if (apiTask.due_date) {
    try {
      // Parse as ISO date string
      dueDate = parseISO(apiTask.due_date);
      
      // Validate the date
      if (!isValid(dueDate)) {
        console.error(`  Invalid date after parsing: ${apiTask.due_date}`);
        dueDate = undefined;
      } else {
        console.log(`  Converted dueDate to Date object: ${dueDate.toISOString()}`);
      }
    } catch (e) {
      console.error(`  Failed to parse date: ${apiTask.due_date}`, e);
    }
  }
  
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description || undefined,
    status: apiTask.status as TaskStatus,
    priority: apiTask.priority as TaskPriority,
    dueDate,
    tags: apiTask.tags as string[] || [],
    projectId: apiTask.project_id || undefined,
    createdAt: new Date(apiTask.created_at),
    updatedAt: new Date(apiTask.updated_at)
  };
};

/**
 * Helper function to safely validate and convert a date value
 */
export const getValidDate = (dateValue: Date | string | null | undefined): Date | null => {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object, ensure it's valid
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    // If it's a string, parse it properly
    if (typeof dateValue === 'string') {
      const parsedDate = parseISO(dateValue);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
    
    return null;
  } catch (e) {
    console.error('Invalid date value:', dateValue);
    return null;
  }
};

// A type to represent categorized tasks
export type CategorizedTasks = Record<string, Task[]>;

/**
 * Categorizes tasks into predefined categories
 */
export const categorizeTasks = (tasks: Task[]): CategorizedTasks => {
  const now = new Date();
  
  // Initialize categories
  const categorized: CategorizedTasks = {
    [TaskCategory.OVERDUE]: [],
    [TaskCategory.TODAY]: [],
    [TaskCategory.TOMORROW]: [], 
    [TaskCategory.THIS_WEEK]: [],
    [TaskCategory.HIGH_PRIORITY]: [],
    [TaskCategory.RECENTLY_ADDED]: [],
    [TaskCategory.ACTIVE]: []
  };
  
  // Only process active tasks (not DONE or ARCHIVED)
  const activeTasks = tasks.filter(task => 
    task.status !== TaskStatus.DONE && 
    task.status !== TaskStatus.ARCHIVED
  );
  
  // Categorize each task
  activeTasks.forEach(task => {
    // Add to ACTIVE category (all active tasks)
    categorized[TaskCategory.ACTIVE].push(task);
    
    // Check for due date categories
    if (task.dueDate) {
      // Check if overdue
      if (isPast(task.dueDate) && !isToday(task.dueDate)) {
        categorized[TaskCategory.OVERDUE].push(task);
      }
      
      // Check if due today
      if (isToday(task.dueDate)) {
        categorized[TaskCategory.TODAY].push(task);
      }
      
      // Check if due tomorrow
      if (isTomorrow(task.dueDate)) {
        categorized[TaskCategory.TOMORROW].push(task);
      }
      
      // Check if due this week (but not today/tomorrow)
      if (isThisWeek(task.dueDate) && !isToday(task.dueDate) && !isTomorrow(task.dueDate)) {
        categorized[TaskCategory.THIS_WEEK].push(task);
      }
    }
    
    // Check for priority categories
    if (task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT) {
      categorized[TaskCategory.HIGH_PRIORITY].push(task);
    }
    
    // Check if recently added (within the last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (task.createdAt >= oneDayAgo) {
      categorized[TaskCategory.RECENTLY_ADDED].push(task);
    }
  });
  
  return categorized;
};
