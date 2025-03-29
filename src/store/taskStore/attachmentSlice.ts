
import { StateCreator } from 'zustand';
import { AttachmentService } from '@/services/attachmentService';
import { Attachment, AttachmentUploadOptions } from '@/types/attachment';
import { toast } from '@/hooks/use-toast';

export interface AttachmentSlice {
  // State
  taskAttachments: Record<string, Attachment[]>;
  attachmentUploads: Record<string, { progress: number; fileName: string }>;
  isAttachmentLoading: boolean;
  
  // Operations
  uploadAttachment: (options: AttachmentUploadOptions) => Promise<Attachment | null>;
  fetchTaskAttachments: (taskId: string) => Promise<Attachment[]>;
  deleteAttachment: (attachmentId: string) => Promise<boolean>;
  getAttachmentUrl: (storagePath: string) => string;
}

export const createAttachmentSlice: StateCreator<
  AttachmentSlice & { tasks: any[] },
  [],
  [],
  AttachmentSlice
> = (set, get) => ({
  // State
  taskAttachments: {},
  attachmentUploads: {},
  isAttachmentLoading: false,
  
  // Operations
  uploadAttachment: async (options) => {
    const { taskId, file, onProgress } = options;
    
    // Add to uploads with 0% progress
    set(state => ({
      attachmentUploads: {
        ...state.attachmentUploads,
        [file.name]: { progress: 0, fileName: file.name }
      }
    }));
    
    // Custom progress handler that updates the state
    const handleProgress = (progress: number) => {
      set(state => ({
        attachmentUploads: {
          ...state.attachmentUploads,
          [file.name]: { progress, fileName: file.name }
        }
      }));
      
      // Call the original progress handler if provided
      if (onProgress) {
        onProgress(progress);
      }
    };
    
    try {
      set({ isAttachmentLoading: true });
      
      const result = await AttachmentService.uploadAttachment({
        taskId,
        file,
        onProgress: handleProgress
      });
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No attachment data returned');
      }
      
      // Add attachment to state
      set(state => {
        const existingAttachments = state.taskAttachments[taskId] || [];
        return {
          taskAttachments: {
            ...state.taskAttachments,
            [taskId]: [result.data!, ...existingAttachments]
          },
          // Remove from uploads
          attachmentUploads: Object.fromEntries(
            Object.entries(state.attachmentUploads).filter(([key]) => key !== file.name)
          ),
          isAttachmentLoading: false
        };
      });
      
      toast({
        title: "File uploaded",
        description: `${file.name} was successfully attached to the task.`
      });
      
      return result.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      
      // Remove from uploads
      set(state => ({
        attachmentUploads: Object.fromEntries(
          Object.entries(state.attachmentUploads).filter(([key]) => key !== file.name)
        ),
        isAttachmentLoading: false
      }));
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      
      return null;
    }
  },
  
  fetchTaskAttachments: async (taskId) => {
    try {
      set({ isAttachmentLoading: true });
      
      const result = await AttachmentService.getTaskAttachments(taskId);
      
      if (result.error) {
        throw result.error;
      }
      
      // Update state with fetched attachments
      set(state => ({
        taskAttachments: {
          ...state.taskAttachments,
          [taskId]: result.data || []
        },
        isAttachmentLoading: false
      }));
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching task attachments:', error);
      
      set({ isAttachmentLoading: false });
      
      toast({
        title: "Failed to load attachments",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      
      return [];
    }
  },
  
  deleteAttachment: async (attachmentId) => {
    try {
      set({ isAttachmentLoading: true });
      
      const result = await AttachmentService.deleteAttachment(attachmentId);
      
      if (result.error) {
        throw result.error;
      }
      
      // Remove attachment from state
      set(state => {
        const updatedAttachments = { ...state.taskAttachments };
        
        // Find which taskId this attachment belongs to
        Object.keys(updatedAttachments).forEach(taskId => {
          updatedAttachments[taskId] = updatedAttachments[taskId].filter(
            attachment => attachment.id !== attachmentId
          );
        });
        
        return {
          taskAttachments: updatedAttachments,
          isAttachmentLoading: false
        };
      });
      
      toast({
        title: "Attachment deleted",
        description: "The file has been successfully removed."
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      
      set({ isAttachmentLoading: false });
      
      toast({
        title: "Failed to delete attachment",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      
      return false;
    }
  },
  
  getAttachmentUrl: (storagePath) => {
    return AttachmentService.getAttachmentUrl(storagePath);
  }
});
