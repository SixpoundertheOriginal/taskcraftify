
import { Project } from './project';
import { Task } from './task';

export interface TaskGroup {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  color?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
}

export interface CreateTaskGroupDTO {
  name: string;
  description?: string;
  projectId?: string;
  color?: string;
  position?: number;
}

export interface UpdateTaskGroupDTO {
  id: string;
  name?: string;
  description?: string | null;
  projectId?: string | null;
  color?: string | null;
  position?: number;
}

export interface APITaskGroup {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  project_id: string | null;
  color: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Convert API task group to app task group
export function mapApiTaskGroupToTaskGroup(apiTaskGroup: APITaskGroup): TaskGroup {
  return {
    id: apiTaskGroup.id,
    name: apiTaskGroup.name,
    description: apiTaskGroup.description || undefined,
    projectId: apiTaskGroup.project_id || undefined,
    color: apiTaskGroup.color || undefined,
    position: apiTaskGroup.position,
    createdAt: new Date(apiTaskGroup.created_at),
    updatedAt: new Date(apiTaskGroup.updated_at)
  };
}

// Convert app task group to API task group format
export function mapTaskGroupToApiTaskGroup(taskGroup: CreateTaskGroupDTO | UpdateTaskGroupDTO, userId?: string): Partial<APITaskGroup> {
  const apiTaskGroup: Partial<APITaskGroup> = {
    name: taskGroup.name,
    description: taskGroup.description || null,
    project_id: taskGroup.projectId || null,
    color: taskGroup.color || null,
    position: taskGroup.position || 0,
  };

  if (userId) {
    apiTaskGroup.user_id = userId;
  }

  if ('id' in taskGroup) {
    apiTaskGroup.id = taskGroup.id;
  }

  return apiTaskGroup;
}
