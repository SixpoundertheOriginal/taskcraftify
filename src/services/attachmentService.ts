import { supabase } from '@/integrations/supabase/client';
import { 
  Attachment, 
  APIAttachment, 
  AttachmentUploadOptions, 
  mapAPIAttachmentToAttachment 
} from '@/types/attachment';
import { v4 as uuidv4 } from 'uuid';

// Service result type for consistent error handling
interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export const AttachmentService = {
  async uploadAttachment({ taskId, file, onProgress }: AttachmentUploadOptions): Promise<ServiceResult<Attachment>> {
    try {
      // Get user information
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Generate a unique filename to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      
      // The path where the file will be stored: user_id/task_id/filename
      const storagePath = `${userId}/${taskId}/${fileName}`;

      // Call the progress callback with a starting value
      if (onProgress) {
        onProgress(10); // Start with 10% progress indication
      }
      
      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('task-attachments')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      // Indicate upload is complete
      if (onProgress) {
        onProgress(100);
      }
      
      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }
      
      // Create entry in task_attachments table
      const attachmentRecord = {
        task_id: taskId,
        user_id: userId,
        file_name: fileName,
        original_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        thumbnail_path: null
      };
      
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('task_attachments')
        .insert(attachmentRecord)
        .select()
        .single();
      
      if (attachmentError) {
        // If there was an error creating the record, let's clean up the uploaded file
        await supabase.storage
          .from('task-attachments')
          .remove([storagePath]);
          
        throw new Error(`Database error: ${attachmentError.message}`);
      }
      
      return {
        data: mapAPIAttachmentToAttachment(attachmentData as APIAttachment),
        error: null
      };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async getTaskAttachments(taskId: string): Promise<ServiceResult<Attachment[]>> {
    try {
      console.log(`AttachmentService.getTaskAttachments: Fetching attachments for task ${taskId}`);
      
      // Check if storage bucket exists
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
        
      if (bucketsError) {
        console.error("Error checking storage buckets:", bucketsError);
        throw new Error(`Storage error: ${bucketsError.message}`);
      }
      
      const taskAttachmentsBucketExists = buckets.some(bucket => bucket.name === 'task-attachments');
      
      if (!taskAttachmentsBucketExists) {
        console.warn("Storage bucket 'task-attachments' does not exist");
        return { data: [], error: null };
      }
      
      // Fetch attachments for the given task
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log(`AttachmentService.getTaskAttachments: Found ${data?.length || 0} attachments for task ${taskId}`);
      
      return {
        data: (data as APIAttachment[]).map(mapAPIAttachmentToAttachment),
        error: null
      };
    } catch (error) {
      console.error(`Error fetching attachments for task ${taskId}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  async deleteAttachment(attachmentId: string): Promise<ServiceResult<void>> {
    try {
      // First, get the attachment details so we can also delete the file
      const { data, error: fetchError } = await supabase
        .from('task_attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single();
      
      if (fetchError) {
        throw new Error(`Fetch error: ${fetchError.message}`);
      }
      
      if (!data) {
        throw new Error('Attachment not found');
      }
      
      // Delete the file from storage
      const { error: removeError } = await supabase.storage
        .from('task-attachments')
        .remove([data.storage_path]);
      
      if (removeError) {
        throw new Error(`Storage error: ${removeError.message}`);
      }
      
      // Delete the record from the database
      const { error: deleteError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentId);
      
      if (deleteError) {
        throw new Error(`Database error: ${deleteError.message}`);
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting attachment:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },
  
  getAttachmentUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(storagePath);
    
    return data.publicUrl;
  }
};
