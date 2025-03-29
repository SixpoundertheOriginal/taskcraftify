
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
  // Parse dates from ISO strings to Date objects
  const createdAt = new Date(apiTemplate.created_at);
  const lastUsed = apiTemplate.last_used ? new Date(apiTemplate.last_used) : undefined;
  
  // Handle the case where structure.dueDate might be a string
  const structure = { ...apiTemplate.structure };
  if (structure.dueDate && typeof structure.dueDate === 'string') {
    try {
      structure.dueDate = new Date(structure.dueDate);
    } catch (e) {
      console.error('Error parsing dueDate:', e);
      // If parsing fails, remove the dueDate
      delete structure.dueDate;
    }
  }
  
  return {
    id: apiTemplate.id,
    name: apiTemplate.name,
    description: apiTemplate.description,
    structure: structure,
    tags: apiTemplate.structure.tags || [],
    usageCount: apiTemplate.usage_count,
    createdAt: createdAt,
    lastUsed: lastUsed,
    userId: apiTemplate.user_id
  };
};
