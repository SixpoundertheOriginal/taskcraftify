
// Define the types for file attachments
import { Database } from '@/integrations/supabase/types';

export interface Attachment {
  id: string;
  taskId: string;
  userId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  thumbnailPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttachmentUploadOptions {
  taskId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

// Mapping function for API to internal type
export const mapAPIAttachmentToAttachment = (apiAttachment: APIAttachment): Attachment => {
  return {
    id: apiAttachment.id,
    taskId: apiAttachment.task_id,
    userId: apiAttachment.user_id,
    fileName: apiAttachment.file_name,
    originalName: apiAttachment.original_name,
    fileSize: apiAttachment.file_size,
    fileType: apiAttachment.file_type,
    storagePath: apiAttachment.storage_path,
    thumbnailPath: apiAttachment.thumbnail_path || undefined,
    createdAt: new Date(apiAttachment.created_at),
    updatedAt: new Date(apiAttachment.updated_at)
  };
};
