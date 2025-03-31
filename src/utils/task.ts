
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
