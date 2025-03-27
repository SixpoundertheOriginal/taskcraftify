
import { supabase } from '@/integrations/supabase/client';
import { 
  EmailSettings,
  UpdateEmailSettingsDTO,
  mapApiEmailSettingsToEmailSettings,
  mapEmailSettingsToApiEmailSettings
} from '@/types/integration';

export class EmailService {
  // Fetch email settings for the current user
  static async fetchEmailSettings(): Promise<{ data: EmailSettings | null, error: Error | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return { data: null, error: new Error('No active session') };
      }
      
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .maybeSingle();
        
      if (error) {
        throw error;
      }
      
      return { 
        data: data ? mapApiEmailSettingsToEmailSettings(data) : null, 
        error: null 
      };
    } catch (error: any) {
      console.error('Error fetching email settings:', error);
      return { data: null, error };
    }
  }
  
  // Create or update email settings
  static async updateEmailSettings(settingsData: UpdateEmailSettingsDTO): Promise<{ data: EmailSettings | null, error: Error | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return { data: null, error: new Error('No active session') };
      }
      
      const userId = session.session.user.id;
      const mappedData = mapEmailSettingsToApiEmailSettings(settingsData, userId);
      
      // First check if settings already exist
      const { data: existingSettings } = await supabase
        .from('email_settings')
        .select('id')
        .maybeSingle();
      
      let result;
      
      if (existingSettings) {
        // Update existing settings
        result = await supabase
          .from('email_settings')
          .update(mappedData)
          .eq('id', existingSettings.id)
          .select()
          .single();
      } else {
        // Create new settings
        result = await supabase
          .from('email_settings')
          .insert(mappedData)
          .select()
          .single();
      }
      
      const { data, error } = result;
      
      if (error) {
        throw error;
      }
      
      return { 
        data: mapApiEmailSettingsToEmailSettings(data), 
        error: null 
      };
    } catch (error: any) {
      console.error('Error updating email settings:', error);
      return { data: null, error };
    }
  }
  
  // Send task summary via email
  static async sendTaskSummary(userId: string): Promise<{ error: Error | null }> {
    try {
      // This would be handled by an edge function
      const { error } = await supabase.functions.invoke('send-task-summary', {
        body: { userId }
      });
      
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Error sending task summary:', error);
      return { error };
    }
  }
  
  // Share task via email
  static async shareTaskViaEmail(taskId: string, email: string, message?: string): Promise<{ error: Error | null }> {
    try {
      // This would be handled by an edge function
      const { error } = await supabase.functions.invoke('share-task', {
        body: { taskId, email, message }
      });
      
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Error sharing task via email:', error);
      return { error };
    }
  }
}
