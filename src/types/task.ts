// Import necessary modules
import { Database } from '@/integrations/supabase/types';
import { parseISO } from 'date-fns';

// Enums
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
  BACKLOG = 'BACKLOG'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Task interfaces
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  tags?: string[];
  projectId?: string;
  taskGroupId?: string;
  position: number;
  subtasks?: Subtask[];
  comments?: Comment[];
  activities?: ActivityItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  tags?: string[];
  projectId?: string;
  taskGroupId?: string;
  position?: number;
}

export interface UpdateTaskDTO {
  id: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  tags?: string[] | null;
  projectId?: string | null;
  taskGroupId?: string | null;
  position?: number;
}

// API Task interface (from Supabase)
export interface APITask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  tags: string[] | null;
  project_id: string | null;
  task_group_id: string | null;
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Subtask interfaces
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubtaskDTO {
  taskId: string;
  title: string;
}

export interface UpdateSubtaskDTO {
  id: string;
  title?: string;
  completed?: boolean;
}

// Comment interfaces
export interface Comment {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
}

export interface CreateCommentDTO {
  taskId: string;
  content: string;
}

export interface UpdateCommentDTO {
  id: string;
  content: string;
}

// Activity interfaces
export interface ActivityItem {
  id: string;
  taskId: string;
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'status_changed' | 
        'priority_changed' | 'due_date_changed' | 'subtask_added' | 'subtask_completed' | 
        'subtask_edited' | 'subtask_deleted' | 'comment_added' | 'comment_edited' | 
        'comment_deleted' | 'tag_added' | 'tag_removed' | 'status_change' | 'edit';
  description: string;
  createdAt: Date;
  createdBy: string;
  metadata?: Record<string, any> | null;
}

export interface APIActivity {
  id: string;
  task_id: string;
  type: string;
  description: string;
  created_at: string;
  created_by: string;
  metadata: Record<string, any> | null;
}

// Task filters
export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  searchQuery?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

// Helper functions for tasks
/**
 * Counts the number of tasks associated with a specific project
 * @param tasks The list of tasks to count
 * @param projectId The project ID to filter by, 'none' for tasks with no project, undefined for all tasks
 * @returns The number of tasks that match the criteria
 */
export function countTasksByProject(tasks: Task[], projectId?: string | null): number {
  console.log(`Counting tasks for project: ${projectId === undefined ? 'ALL' : projectId === null || projectId === 'none' ? 'NO PROJECT' : projectId}`);
  console.log(`Total tasks to consider: ${tasks.length}`);
  
  if (projectId === undefined) {
    // Count all tasks
    return tasks.length;
  }
  
  if (projectId === null || projectId === 'none') {
    // Count tasks with no project
    const count = tasks.filter(task => !task.projectId).length;
    console.log(`Found ${count} tasks with no project`);
    return count;
  }
  
  // Count tasks for specific project
  const count = tasks.filter(task => task.projectId === projectId).length;
  console.log(`Found ${count} tasks for project ${projectId}`);
  return count;
}

/**
 * Counts the completed and total subtasks for a task
 * @param task The task to analyze
 * @returns Object containing completed and total subtask counts
 */
export function countCompletedSubtasks(task: Task): { completed: number; total: number } {
  if (!task.subtasks || task.subtasks.length === 0) {
    return { completed: 0, total: 0 };
  }
  
  const total = task.subtasks.length;
  const completed = task.subtasks.filter(subtask => subtask.completed).length;
  
  return { completed, total };
}

// Mapping functions
export const mapApiTaskToTask = (apiTask: APITask): Task => {
  // Debug the dueDate conversion
  console.log(`MapApiTaskToTask for "${apiTask.title}": due_date=${apiTask.due_date}, type=${typeof apiTask.due_date}`);
  
  let dueDate: Date | undefined = undefined;
  
  if (apiTask.due_date) {
    try {
      // Parse as ISO date string
      dueDate = parseISO(apiTask.due_date);
      console.log(`  Converted dueDate to Date object: ${dueDate.toISOString()}`);
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
    taskGroupId: apiTask.task_group_id || undefined,
    position: apiTask.position || 0,
    createdAt: new Date(apiTask.created_at),
    updatedAt: new Date(apiTask.updated_at)
  };
};
