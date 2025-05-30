import { create } from 'zustand';
import { 
  Integration, 
  CalendarEvent, 
  EmailSettings,
  CreateIntegrationDTO,
  UpdateIntegrationDTO,
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
  UpdateEmailSettingsDTO 
} from '@/types/integration';
import { IntegrationService } from '@/services/integrationService';
import { CalendarService } from '@/services/calendarService';
import { EmailService } from '@/services/emailService';
import { supabase } from '@/integrations/supabase/client';

export type IntegrationState = {
  integrations: Integration[];
  calendarEvents: CalendarEvent[];
  emailSettings: EmailSettings | null;
  isLoading: boolean;
  error: string | null;
};

export type IntegrationActions = {
  fetchIntegrations: () => Promise<void>;
  fetchIntegrationByProvider: (provider: string) => Promise<Integration | null>;
  createIntegration: (data: CreateIntegrationDTO) => Promise<Integration | null>;
  updateIntegration: (data: UpdateIntegrationDTO) => Promise<Integration | null>;
  deleteIntegration: (id: string) => Promise<boolean>;
  fetchCalendarEvents: () => Promise<void>;
  fetchCalendarEventsInRange: (start: Date, end: Date) => Promise<CalendarEvent[] | null>;
  createCalendarEvent: (data: CreateCalendarEventDTO) => Promise<CalendarEvent | null>;
  updateCalendarEvent: (data: UpdateCalendarEventDTO) => Promise<CalendarEvent | null>;
  deleteCalendarEvent: (id: string) => Promise<boolean>;
  syncWithExternalCalendar: (integrationId: string) => Promise<boolean>;
  exportTasksAsICS: (taskIds: string[]) => Promise<Blob | null>;
  fetchEmailSettings: () => Promise<void>;
  updateEmailSettings: (data: UpdateEmailSettingsDTO) => Promise<EmailSettings | null>;
  sendTaskSummary: (userId: string) => Promise<boolean>;
  shareTaskViaEmail: (taskId: string, email: string, message?: string) => Promise<boolean>;
  startOAuthFlow: (provider: string) => void;
  handleOAuthCallback: (provider: string, code: string, redirectUri: string) => Promise<boolean>;
};

export const createIntegrationSlice = (set: any, get: any) => ({
  integrations: [],
  calendarEvents: [],
  emailSettings: null,
  isLoading: false,
  error: null,

  fetchIntegrations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await IntegrationService.fetchIntegrations();
      
      if (error) {
        throw error;
      }
      
      set({ integrations: data || [] });
      return;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch integrations' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchIntegrationByProvider: async (provider: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await IntegrationService.fetchIntegrationByProvider(provider);
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch integration' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  createIntegration: async (data: CreateIntegrationDTO) => {
    set({ isLoading: true, error: null });
    try {
      const { data: integration, error } = await IntegrationService.createIntegration(data);
      
      if (error) {
        throw error;
      }
      
      set((state: IntegrationState) => ({
        integrations: [...state.integrations, integration!]
      }));
      
      return integration;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create integration' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateIntegration: async (data: UpdateIntegrationDTO) => {
    set({ isLoading: true, error: null });
    try {
      const { data: integration, error } = await IntegrationService.updateIntegration(data);
      
      if (error) {
        throw error;
      }
      
      set((state: IntegrationState) => ({
        integrations: state.integrations.map(i => 
          i.id === integration!.id ? integration! : i
        )
      }));
      
      return integration;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update integration' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteIntegration: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await IntegrationService.deleteIntegration(id);
      
      if (error) {
        throw error;
      }
      
      set((state: IntegrationState) => ({
        integrations: state.integrations.filter(i => i.id !== id)
      }));
      
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete integration' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchCalendarEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await CalendarService.fetchCalendarEvents();
      
      if (error) {
        throw error;
      }
      
      set({ calendarEvents: data || [] });
      return;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch calendar events' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchCalendarEventsInRange: async (start: Date, end: Date) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await CalendarService.fetchCalendarEventsInRange(start, end);
      
      if (error) {
        throw error;
      }
      
      set({ calendarEvents: data || [] });
      
      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch calendar events in range' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  createCalendarEvent: async (data: CreateCalendarEventDTO) => {
    set({ isLoading: true, error: null });
    try {
      const { data: event, error } = await CalendarService.createCalendarEvent(data);
      
      if (error) {
        throw error;
      }
      
      set((state: IntegrationState) => ({
        calendarEvents: [...state.calendarEvents, event!]
      }));
      
      return event;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create calendar event' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateCalendarEvent: async (data: UpdateCalendarEventDTO) => {
    set({ isLoading: true, error: null });
    try {
      const { data: event, error } = await CalendarService.updateCalendarEvent(data);
      
      if (error) {
        throw error;
      }
      
      set((state: IntegrationState) => ({
        calendarEvents: state.calendarEvents.map(e => 
          e.id === event!.id ? event! : e
        )
      }));
      
      return event;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update calendar event' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteCalendarEvent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await CalendarService.deleteCalendarEvent(id);
      
      if (error) {
        throw error;
      }
      
      set((state: IntegrationState) => ({
        calendarEvents: state.calendarEvents.filter(e => e.id !== id)
      }));
      
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete calendar event' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  syncWithExternalCalendar: async (integrationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await CalendarService.syncWithExternalCalendar(integrationId);
      
      if (error) {
        throw error;
      }
      
      await get().fetchCalendarEvents();
      
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to sync with external calendar' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  exportTasksAsICS: async (taskIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await CalendarService.exportTasksAsICS(taskIds);
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to export tasks as ICS' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchEmailSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await EmailService.fetchEmailSettings();
      
      if (error) {
        throw error;
      }
      
      set({ emailSettings: data });
      return;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch email settings' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateEmailSettings: async (data: UpdateEmailSettingsDTO) => {
    set({ isLoading: true, error: null });
    try {
      const { data: settings, error } = await EmailService.updateEmailSettings(data);
      
      if (error) {
        throw error;
      }
      
      set({ emailSettings: settings });
      
      return settings;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update email settings' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  sendTaskSummary: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await EmailService.sendTaskSummary(userId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to send task summary' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  shareTaskViaEmail: async (taskId: string, email: string, message?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await EmailService.shareTaskViaEmail(taskId, email, message);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Failed to share task via email' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  startOAuthFlow: (provider: string) => {
    try {
      const redirectURL = window.location.origin + '/auth/callback';
      console.log(`Starting OAuth flow for ${provider} with redirect URL: ${redirectURL}`);
      const oauthURL = IntegrationService.generateOAuthUrl(provider, redirectURL);
      console.log(`Generated OAuth URL: ${oauthURL}`);
      window.location.href = oauthURL;
    } catch (error: any) {
      console.error(`Failed to start OAuth flow for ${provider}:`, error);
      set({ error: error.message || 'Failed to start OAuth flow' });
    }
  },
  
  handleOAuthCallback: async (provider: string, code: string, redirectUri: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`Processing OAuth callback for ${provider} with redirect URI: ${redirectUri}`);
      
      const { data: authSessionData } = await supabase.auth.getSession();
      const authToken = authSessionData.session?.access_token;
      
      if (!authToken) {
        throw new Error('No authentication token available');
      }
      
      console.log(`Calling OAuth callback edge function for ${provider}`);
      
      const debugTimestamp = new Date().toISOString();
      
      console.log('Preparing OAuth callback request with data:', { 
        provider, 
        code: code.substring(0, 5) + '...',
        redirect_uri: redirectUri,
        token: authToken.substring(0, 5) + '...',
        timestamp: debugTimestamp
      });
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || ''}/oauth-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Debug-Timestamp': debugTimestamp
        },
        body: JSON.stringify({ 
          provider, 
          code,
          redirect_uri: redirectUri
        }),
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP error: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('OAuth callback error response:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          try {
            const errorText = await response.text();
            console.error('OAuth callback error text:', errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error('Could not parse error response as text');
          }
        }
        
        throw new Error(`Failed to complete OAuth flow: ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log('OAuth callback successful:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'OAuth flow completed but was not successful');
      }
      
      await get().fetchIntegrations();
      
      return true;
    } catch (error: any) {
      console.error('Failed to handle OAuth callback:', error);
      set({ error: error.message || 'Failed to handle OAuth callback' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
});
