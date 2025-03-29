
import { CreateTaskDTO, TaskPriority, TaskStatus } from './task';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  structure: Partial<CreateTaskDTO>;
  tags?: string[];
  usageCount: number;
  createdAt: Date;
  lastUsed?: Date;
  userId: string;
}

export interface CreateTemplateDTO {
  name: string;
  description: string;
  structure: Partial<CreateTaskDTO>;
}

export interface UpdateTemplateDTO {
  id: string;
  name?: string;
  description?: string;
  structure?: Partial<CreateTaskDTO>;
  usageCount?: number;
  lastUsed?: Date;
}

export interface APITemplate {
  id: string;
  name: string;
  description: string;
  structure: any;
  user_id: string;
  usage_count: number;
  created_at: string;
  last_used: string | null;
}

export const mapApiTemplateToTemplate = (apiTemplate: APITemplate): TaskTemplate => {
  return {
    id: apiTemplate.id,
    name: apiTemplate.name,
    description: apiTemplate.description,
    structure: apiTemplate.structure,
    tags: apiTemplate.structure.tags || [],
    usageCount: apiTemplate.usage_count,
    createdAt: new Date(apiTemplate.created_at),
    lastUsed: apiTemplate.last_used ? new Date(apiTemplate.last_used) : undefined,
    userId: apiTemplate.user_id
  };
};
