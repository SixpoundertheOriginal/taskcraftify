
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export enum TaskStatus {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  ARCHIVED = "ARCHIVED"
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
}

export interface ActivityItem {
  id: string;
  taskId: string;
  type: 'status_change' | 'edit' | 'comment_added' | 'comment_edited' | 'comment_deleted' | 'subtask_added' | 'subtask_completed' | 'subtask_edited' | 'subtask_deleted';
  description: string;
  createdAt: Date;
  createdBy: string;
  metadata?: Record<string, any> | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  projectId?: string | null;
  subtasks?: Subtask[];
  comments?: Comment[];
  activities?: ActivityItem[];
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  tags?: string[];
  projectId?: string | null;
}

export interface UpdateTaskDTO {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  tags?: string[];
  projectId?: string | null;
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

export interface CreateCommentDTO {
  taskId: string;
  content: string;
}

export interface UpdateCommentDTO {
  id: string;
  content: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  searchQuery?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  projectId?: string | null;
}

export interface APITask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  project_id: string | null;
  subtasks?: APISubtask[];
  comments?: APIComment[];
  activities?: APIActivity[];
}

export interface APISubtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface APIComment {
  id: string;
  task_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  edited: boolean;
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

// Convert API task to app task
export function mapApiTaskToTask(apiTask: APITask): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description || undefined,
    status: apiTask.status as TaskStatus,
    priority: apiTask.priority as TaskPriority,
    dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
    createdAt: new Date(apiTask.created_at),
    updatedAt: new Date(apiTask.updated_at),
    tags: apiTask.tags || undefined,
    projectId: apiTask.project_id,
    subtasks: apiTask.subtasks?.map(subtask => ({
      id: subtask.id,
      taskId: subtask.task_id,
      title: subtask.title,
      completed: subtask.completed,
      createdAt: new Date(subtask.created_at),
      updatedAt: new Date(subtask.updated_at)
    })),
    comments: apiTask.comments?.map(comment => ({
      id: comment.id,
      taskId: comment.task_id,
      content: comment.content,
      createdBy: comment.created_by,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      edited: comment.edited
    })),
    activities: apiTask.activities?.map(activity => ({
      id: activity.id,
      taskId: activity.task_id,
      type: activity.type as ActivityItem['type'],
      description: activity.description,
      createdAt: new Date(activity.created_at),
      createdBy: activity.created_by,
      metadata: activity.metadata || undefined
    }))
  };
}

// Convert app task to API task format
export function mapTaskToApiTask(task: CreateTaskDTO | UpdateTaskDTO, userId?: string): Partial<APITask> {
  const apiTask: Partial<APITask> = {
    title: task.title,
    description: task.description || null,
    status: task.status,
    priority: task.priority,
    tags: task.tags || null,
    project_id: task.projectId ?? null,
  };

  if (userId) {
    apiTask.user_id = userId;
  }

  if ('id' in task) {
    apiTask.id = task.id;
  }

  if ('dueDate' in task && task.dueDate !== undefined) {
    apiTask.due_date = task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate;
  } else if ('dueDate' in task && task.dueDate === null) {
    apiTask.due_date = null;
  }

  return apiTask;
}

/**
 * Count completed subtasks for a task
 * 
 * @param task The task to count subtasks for
 * @returns Object with completed count and total count
 */
export function countCompletedSubtasks(task: Task): { completed: number; total: number } {
  if (!task.subtasks || task.subtasks.length === 0) {
    return { completed: 0, total: 0 };
  }

  const total = task.subtasks.length;
  const completed = task.subtasks.filter(subtask => subtask.completed).length;
  
  return { completed, total };
}

/**
 * Utility function for accurate project task counting with improved null/undefined handling
 * 
 * @param tasks - Array of tasks to count
 * @param projectId - Project identifier to filter by, with special handling for specific values:
 *   - undefined: Count all tasks regardless of project
 *   - null or 'none': Count tasks with no project (projectId === null)
 *   - string value: Count tasks for that specific project ID
 * 
 * @returns The number of tasks matching the criteria
 */
export function countTasksByProject(tasks: Task[], projectId: string | null | undefined): number {
  // Case 1: Count all tasks (used for "All Projects" view)
  if (projectId === undefined) {
    return tasks.length;
  }
  
  // Case 2: Count tasks with no project (null projectId)
  // This handles both when we pass null or the special string 'none'
  if (projectId === null || projectId === 'none') {
    return tasks.filter(task => task.projectId === null).length;
  }
  
  // Case 3: Count tasks for a specific project
  return tasks.filter(task => task.projectId === projectId).length;
}
