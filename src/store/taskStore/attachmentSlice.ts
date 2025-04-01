
import { StateCreator } from 'zustand';
import { Attachment, AttachmentUploadOptions } from '@/types/attachment';
import { AttachmentService } from '@/services/attachmentService';
import { toast } from '@/hooks/use-toast';

export interface AttachmentSlice {
  attachments: Record<string, Attachment[]>;
  isLoadingAttachments: boolean;
  attachmentError: string | null;
  
  // Add missing properties
  taskAttachments: Record<string, Attachment[]>;
  attachmentUploads: Record<string, { progress: number }>;
  isAttachmentLoading: boolean;
  
  fetchTaskAttachments: (taskId: string) => Promise<Attachment[]>;
  uploadAttachment: (options: AttachmentUploadOptions) => Promise<Attachment>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  getAttachmentUrl: (storagePath: string) => string;
}

export const createAttachmentSlice: StateCreator<
  AttachmentSlice,
  [],
  [],
  AttachmentSlice
> = (set, get) => ({
  attachments: {},
  isLoadingAttachments: false,
  attachmentError: null,
  
  // Initialize the new properties
  taskAttachments: {},
  attachmentUploads: {},
  isAttachmentLoading: false,
  
  fetchTaskAttachments: async (taskId: string) => {
    set(state => ({ 
      isLoadingAttachments: true,
      isAttachmentLoading: true,
      attachmentError: null
    }));
    
    try {
      console.log(`AttachmentSlice: Fetching attachments for task ${taskId}`);
      const result = await AttachmentService.getTaskAttachments(taskId);
      
      if (result.error) {
        console.error(`Error fetching attachments for task ${taskId}:`, result.error);
        throw result.error;
      }
      
      const attachmentsList = result.data || [];
      
      set(state => ({
        attachments: {
          ...state.attachments,
          [taskId]: attachmentsList
        },
        // Update the new taskAttachments property as well
        taskAttachments: {
          ...state.taskAttachments,
          [taskId]: attachmentsList
        },
        isLoadingAttachments: false,
        isAttachmentLoading: false
      }));
      
      return attachmentsList;
    } catch (error) {
      console.error('Error in fetchTaskAttachments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load attachments';
      
      set(state => ({
        isLoadingAttachments: false,
        isAttachmentLoading: false,
        attachmentError: errorMessage
      }));
      
      toast({
        title: "Failed to load attachments",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Return empty array to prevent cascading errors
      return [];
    }
  },
  
  uploadAttachment: async (options: AttachmentUploadOptions) => {
    try {
      // Update attachment uploads with initial progress
      set(state => ({
        attachmentUploads: {
          ...state.attachmentUploads,
          [options.file.name]: { progress: 0 }
        }
      }));
      
      // Create a progress handler
      const onProgressUpdate = (progress: number) => {
        if (options.onProgress) {
          options.onProgress(progress);
        }
        
        // Update the progress in the store
        set(state => ({
          attachmentUploads: {
            ...state.attachmentUploads,
            [options.file.name]: { progress }
          }
        }));
      };
      
      // Call the upload with progress tracking
      const modifiedOptions = {
        ...options,
        onProgress: onProgressUpdate
      };
      
      const result = await AttachmentService.uploadAttachment(modifiedOptions);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No attachment data returned');
      }
      
      // Update the attachments cache
      set(state => {
        const taskAttachments = state.attachments[options.taskId] || [];
        
        // Remove the file from uploads on completion
        const { [options.file.name]: removed, ...remainingUploads } = state.attachmentUploads;
        
        return {
          attachments: {
            ...state.attachments,
            [options.taskId]: [result.data!, ...taskAttachments]
          },
          // Update taskAttachments as well
          taskAttachments: {
            ...state.taskAttachments,
            [options.taskId]: [result.data!, ...taskAttachments]
          },
          // Remove from uploads on completion
          attachmentUploads: remainingUploads
        };
      });
      
      return result.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      
      // Clean up the upload state on error
      set(state => {
        const { [options.file.name]: removed, ...remainingUploads } = state.attachmentUploads;
        return {
          attachmentUploads: remainingUploads
        };
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload attachment';
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  },
  
  deleteAttachment: async (attachmentId: string) => {
    try {
      const result = await AttachmentService.deleteAttachment(attachmentId);
      
      if (result.error) {
        throw result.error;
      }
      
      // Update the attachments cache by removing the deleted attachment
      set(state => {
        const newAttachments = { ...state.attachments };
        const newTaskAttachments = { ...state.taskAttachments };
        
        // Find which task this attachment belonged to
        for (const [taskId, attachments] of Object.entries(newAttachments)) {
          const index = attachments.findIndex(a => a.id === attachmentId);
          
          if (index !== -1) {
            // Create a new array without the deleted attachment
            newAttachments[taskId] = [
              ...attachments.slice(0, index),
              ...attachments.slice(index + 1)
            ];
            
            // Also update taskAttachments
            newTaskAttachments[taskId] = [
              ...attachments.slice(0, index),
              ...attachments.slice(index + 1)
            ];
            break;
          }
        }
        
        return { 
          attachments: newAttachments,
          taskAttachments: newTaskAttachments 
        };
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete attachment';
      
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  },
  
  // Add the getAttachmentUrl implementation
  getAttachmentUrl: (storagePath: string) => {
    return AttachmentService.getAttachmentUrl(storagePath);
  }
});
