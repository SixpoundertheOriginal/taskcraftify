
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
  projectId?: string;
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
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  tags?: string[];
  projectId?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  searchQuery?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  projectId?: string;
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
    projectId: apiTask.project_id || undefined,
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
    project_id: task.projectId || null,
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
