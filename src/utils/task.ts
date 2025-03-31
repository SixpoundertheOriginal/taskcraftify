
import { Task, APITask, TaskStatus, TaskPriority } from '@/types/task';
import { parseISO, isValid, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns';

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

/**
 * Task category enum for the focus view
 */
export enum TaskCategory {
  OVERDUE = 'overdue',
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  THIS_WEEK = 'thisWeek',
  HIGH_PRIORITY = 'highPriority',
  RECENTLY_ADDED = 'recentlyAdded',
  ACTIVE = 'active'
}

/**
 * Structure for categorized tasks result
 * Extending Record<string, Task[]> to make it compatible with string indexing
 */
export interface CategorizedTasks extends Record<string, Task[]> {
  [TaskCategory.OVERDUE]: Task[];
  [TaskCategory.TODAY]: Task[];
  [TaskCategory.TOMORROW]: Task[];
  [TaskCategory.THIS_WEEK]: Task[];
  [TaskCategory.HIGH_PRIORITY]: Task[];
  [TaskCategory.RECENTLY_ADDED]: Task[];
  [TaskCategory.ACTIVE]: Task[];
}

/**
 * Efficiently categorize tasks in a single pass
 * Each task will only appear in the highest priority category
 */
export const categorizeTasks = (tasks: Task[]): CategorizedTasks => {
  console.log(`Categorizing ${tasks.length} tasks in a single pass`);
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  // Initialize result structure
  const result: CategorizedTasks = {
    [TaskCategory.OVERDUE]: [],
    [TaskCategory.TODAY]: [],
    [TaskCategory.TOMORROW]: [],
    [TaskCategory.THIS_WEEK]: [],
    [TaskCategory.HIGH_PRIORITY]: [],
    [TaskCategory.RECENTLY_ADDED]: [],
    [TaskCategory.ACTIVE]: []
  };
  
  // Process each task once
  tasks.forEach(task => {
    // Skip completed or archived tasks
    if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) {
      return;
    }
    
    // Add to active tasks (all non-completed, non-archived tasks)
    result[TaskCategory.ACTIVE].push(task);
    
    // Check date-based categories
    const dueDate = getValidDate(task.dueDate);
    
    if (dueDate) {
      // Check date categories in priority order
      if (isPast(dueDate) && !isToday(dueDate)) {
        result[TaskCategory.OVERDUE].push(task);
        return; // No need to check other categories
      }
      
      if (isToday(dueDate)) {
        result[TaskCategory.TODAY].push(task);
        return;
      }
      
      if (isTomorrow(dueDate)) {
        result[TaskCategory.TOMORROW].push(task);
        return;
      }
      
      if (isThisWeek(dueDate)) {
        result[TaskCategory.THIS_WEEK].push(task);
        return;
      }
    }
    
    // Check priority if not in any date category
    if (task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT) {
      result[TaskCategory.HIGH_PRIORITY].push(task);
      return;
    }
    
    // Check if recently added
    const createdDate = new Date(task.createdAt);
    if (createdDate >= threeDaysAgo) {
      result[TaskCategory.RECENTLY_ADDED].push(task);
      return;
    }
    
    // Note: task is already in ACTIVE category
  });
  
  // Log category counts
  Object.entries(result).forEach(([category, tasks]) => {
    console.log(`Category ${category}: ${tasks.length} tasks`);
  });
  
  return result;
};
