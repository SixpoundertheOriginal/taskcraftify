// Import necessary modules
import { Database } from '@/integrations/supabase/types';

// Enums
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED'
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
  dueDate?: Date | string; // Note: This might be the issue if it's not handling both Date and string types
  tags?: string[];
  projectId?: string;
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
        'comment_deleted' | 'tag_added' | 'tag_removed';
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

// Mapping functions
export const mapApiTaskToTask = (apiTask: APITask): Task => {
  // Debug the dueDate conversion
  console.log(`MapApiTaskToTask for "${apiTask.title}": due_date=${apiTask.due_date}, type=${typeof apiTask.due_date}`);
  
  let dueDate: Date | string | undefined = undefined;
  
  if (apiTask.due_date) {
    try {
      // Try to parse as ISO date string
      dueDate = new Date(apiTask.due_date);
      console.log(`  Converted dueDate to Date object: ${dueDate.toISOString()}`);
    } catch (e) {
      // If parsing fails, keep as string
      dueDate = apiTask.due_date;
      console.log(`  Kept dueDate as string: ${dueDate}`);
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
