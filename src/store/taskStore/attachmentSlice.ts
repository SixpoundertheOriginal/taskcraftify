
import { StateCreator } from 'zustand';
import { Attachment, AttachmentUploadOptions } from '@/types/attachment';
import { AttachmentService } from '@/services/attachmentService';
import { toast } from '@/hooks/use-toast';

export interface AttachmentSlice {
  attachments: Record<string, Attachment[]>;
  isLoadingAttachments: boolean;
  attachmentError: string | null;
  
  fetchTaskAttachments: (taskId: string) => Promise<Attachment[]>;
  uploadAttachment: (options: AttachmentUploadOptions) => Promise<Attachment>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
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
  
  fetchTaskAttachments: async (taskId: string) => {
    set(state => ({ 
      isLoadingAttachments: true,
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
        isLoadingAttachments: false
      }));
      
      return attachmentsList;
    } catch (error) {
      console.error('Error in fetchTaskAttachments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load attachments';
      
      set(state => ({
        isLoadingAttachments: false,
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
      const result = await AttachmentService.uploadAttachment(options);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No attachment data returned');
      }
      
      // Update the attachments cache
      set(state => {
        const taskAttachments = state.attachments[options.taskId] || [];
        
        return {
          attachments: {
            ...state.attachments,
            [options.taskId]: [result.data!, ...taskAttachments]
          }
        };
      });
      
      return result.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      
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
        
        // Find which task this attachment belonged to
        for (const [taskId, attachments] of Object.entries(newAttachments)) {
          const index = attachments.findIndex(a => a.id === attachmentId);
          
          if (index !== -1) {
            // Create a new array without the deleted attachment
            newAttachments[taskId] = [
              ...attachments.slice(0, index),
              ...attachments.slice(index + 1)
            ];
            break;
          }
        }
        
        return { attachments: newAttachments };
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
  }
});
