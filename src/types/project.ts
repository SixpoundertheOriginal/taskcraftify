
import { Task } from './task';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  parentProjectId?: string;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  color: string;
  parentProjectId?: string;
}

export interface UpdateProjectDTO {
  id: string;
  name?: string;
  description?: string | null;
  color?: string;
  parentProjectId?: string | null;
}

export interface APIProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  parent_project_id: string | null;
}

// Convert API project to app project
export function mapApiProjectToProject(apiProject: APIProject): Project {
  return {
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description || undefined,
    color: apiProject.color,
    createdAt: new Date(apiProject.created_at),
    updatedAt: new Date(apiProject.updated_at),
    parentProjectId: apiProject.parent_project_id || undefined,
  };
}

// Convert app project to API project format
export function mapProjectToApiProject(project: CreateProjectDTO | UpdateProjectDTO, userId?: string): Partial<APIProject> {
  const apiProject: Partial<APIProject> = {
    name: project.name,
    description: project.description || null,
    color: project.color,
    parent_project_id: project.parentProjectId || null,
  };

  if (userId) {
    apiProject.user_id = userId;
  }

  if ('id' in project) {
    apiProject.id = project.id;
  }

  return apiProject;
}
