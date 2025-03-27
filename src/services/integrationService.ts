
import { supabase } from '@/integrations/supabase/client';
import { 
  Integration,
  CreateIntegrationDTO,
  UpdateIntegrationDTO,
  mapApiIntegrationToIntegration,
  mapIntegrationToApiIntegration
} from '@/types/integration';

export class IntegrationService {
  // Fetch all integrations for the current user
  static async fetchIntegrations(): Promise<{ data: Integration[] | null, error: Error | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return { data: null, error: new Error('No active session') };
      }
      
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return { 
        data: data ? data.map(mapApiIntegrationToIntegration) : [], 
        error: null 
      };
    } catch (error: any) {
      console.error('Error fetching integrations:', error);
      return { data: null, error };
    }
  }
  
  // Fetch a specific integration by ID
  static async fetchIntegrationById(id: string): Promise<{ data: Integration | null, error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (error) {
        throw error;
      }
      
      return { 
        data: data ? mapApiIntegrationToIntegration(data) : null, 
        error: null 
      };
    } catch (error: any) {
      console.error('Error fetching integration:', error);
      return { data: null, error };
    }
  }
  
  // Fetch integration by provider
  static async fetchIntegrationByProvider(provider: string): Promise<{ data: Integration | null, error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider', provider)
        .maybeSingle();
        
      if (error) {
        throw error;
      }
      
      return { 
        data: data ? mapApiIntegrationToIntegration(data) : null, 
        error: null 
      };
    } catch (error: any) {
      console.error('Error fetching integration by provider:', error);
      return { data: null, error };
    }
  }
  
  // Create a new integration
  static async createIntegration(integrationData: CreateIntegrationDTO): Promise<{ data: Integration | null, error: Error | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return { data: null, error: new Error('No active session') };
      }
      
      const userId = session.session.user.id;
      const mappedData = mapIntegrationToApiIntegration(integrationData, userId);
      
      const { data, error } = await supabase
        .from('integrations')
        .insert({
          ...mappedData,
          provider: integrationData.provider,
          user_id: userId
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return { 
        data: mapApiIntegrationToIntegration(data), 
        error: null 
      };
    } catch (error: any) {
      console.error('Error creating integration:', error);
      return { data: null, error };
    }
  }
  
  // Update an existing integration
  static async updateIntegration(integrationData: UpdateIntegrationDTO): Promise<{ data: Integration | null, error: Error | null }> {
    try {
      const mappedData = mapIntegrationToApiIntegration(integrationData);
      
      // Remove undefined fields and ensure ID is included
      const updateData = Object.fromEntries(
        Object.entries(mappedData).filter(([_, v]) => v !== undefined)
      );
      
      const { data, error } = await supabase
        .from('integrations')
        .update(updateData)
        .eq('id', integrationData.id)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return { 
        data: mapApiIntegrationToIntegration(data), 
        error: null 
      };
    } catch (error: any) {
      console.error('Error updating integration:', error);
      return { data: null, error };
    }
  }
  
  // Delete an integration
  static async deleteIntegration(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting integration:', error);
      return { error };
    }
  }
  
  // Generate OAuth URL for a specific provider
  static generateOAuthUrl(provider: string, redirectUrl: string): string {
    if (provider === 'google') {
      // Google Calendar OAuth configuration
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar');
      
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    } else if (provider === 'microsoft') {
      // Microsoft Graph OAuth configuration
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
      // Include all required scopes for Microsoft
      const scope = encodeURIComponent('Calendars.ReadWrite User.Read offline_access');
      
      // Ensure we're using the correct authority, endpoints and parameters
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=${scope}&response_mode=query`;
    }
    
    throw new Error(`OAuth URL generation not implemented for provider: ${provider}`);
  }
}
