
import { StateCreator } from 'zustand';
import { IntegrationService } from '@/services/integrationService';
import { CalendarService } from '@/services/calendarService';
import { EmailService } from '@/services/emailService';
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
import { toast } from '@/hooks/use-toast';

export interface IntegrationSlice {
  integrations: Integration[];
  calendarEvents: CalendarEvent[];
  emailSettings: EmailSettings | null;
  isLoading: boolean;
  error: string | null;
  
  // Integration operations
  fetchIntegrations: () => Promise<void>;
  createIntegration: (integration: CreateIntegrationDTO) => Promise<Integration | null>;
  updateIntegration: (integration: UpdateIntegrationDTO) => Promise<Integration | null>;
  deleteIntegration: (id: string) => Promise<void>;
  
  // Calendar operations
  fetchCalendarEvents: () => Promise<void>;
  fetchCalendarEventsInRange: (start: Date, end: Date) => Promise<CalendarEvent[] | null>;
  createCalendarEvent: (event: CreateCalendarEventDTO) => Promise<CalendarEvent | null>;
  updateCalendarEvent: (event: UpdateCalendarEventDTO) => Promise<CalendarEvent | null>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  syncWithExternalCalendar: (integrationId: string) => Promise<void>;
  exportTasksAsICS: (taskIds: string[]) => Promise<Blob | null>;
  
  // Email operations
  fetchEmailSettings: () => Promise<void>;
  updateEmailSettings: (settings: UpdateEmailSettingsDTO) => Promise<EmailSettings | null>;
  sendTaskSummary: (userId: string) => Promise<void>;
  shareTaskViaEmail: (taskId: string, email: string, message?: string) => Promise<void>;
  
  // Utility functions
  startOAuthFlow: (provider: string) => void;
  handleOAuthCallback: (provider: string, code: string) => Promise<void>;
}

export const createIntegrationSlice: StateCreator<IntegrationSlice, [], [], IntegrationSlice> = (set, get) => ({
  integrations: [],
  calendarEvents: [],
  emailSettings: null,
  isLoading: false,
  error: null,
  
  // Integration operations
  fetchIntegrations: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await IntegrationService.fetchIntegrations();
      if (result.error) {
        throw result.error;
      }
      
      set({ integrations: result.data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching integrations:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch integrations', 
        isLoading: false 
      });
    }
  },
  
  createIntegration: async (integration) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await IntegrationService.createIntegration(integration);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No integration returned from creation');
      }
      
      set((state) => ({ 
        integrations: [...state.integrations, result.data!],
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error creating integration:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create integration', 
        isLoading: false 
      });
      return null;
    }
  },
  
  updateIntegration: async (integration) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await IntegrationService.updateIntegration(integration);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No integration returned from update');
      }
      
      set((state) => ({
        integrations: state.integrations.map((i) => (i.id === integration.id ? result.data! : i)),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating integration:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update integration', 
        isLoading: false 
      });
      return null;
    }
  },
  
  deleteIntegration: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await IntegrationService.deleteIntegration(id);
      
      if (result.error) {
        throw result.error;
      }
      
      set((state) => ({
        integrations: state.integrations.filter((i) => i.id !== id),
        isLoading: false
      }));
      
      toast({
        title: "Integration removed",
        description: "Integration has been successfully removed"
      });
    } catch (error) {
      console.error('Error deleting integration:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete integration', 
        isLoading: false 
      });
    }
  },
  
  // Calendar operations
  fetchCalendarEvents: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await CalendarService.fetchCalendarEvents();
      if (result.error) {
        throw result.error;
      }
      
      set({ calendarEvents: result.data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events', 
        isLoading: false 
      });
    }
  },
  
  fetchCalendarEventsInRange: async (start, end) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await CalendarService.fetchCalendarEventsInRange(start, end);
      if (result.error) {
        throw result.error;
      }
      
      // Update state but also return for immediate use
      set({ isLoading: false });
      return result.data;
    } catch (error) {
      console.error('Error fetching calendar events in range:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events', 
        isLoading: false 
      });
      return null;
    }
  },
  
  createCalendarEvent: async (event) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await CalendarService.createCalendarEvent(event);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No event returned from creation');
      }
      
      set((state) => ({ 
        calendarEvents: [...state.calendarEvents, result.data!],
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create calendar event', 
        isLoading: false 
      });
      return null;
    }
  },
  
  updateCalendarEvent: async (event) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await CalendarService.updateCalendarEvent(event);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No event returned from update');
      }
      
      set((state) => ({
        calendarEvents: state.calendarEvents.map((e) => (e.id === event.id ? result.data! : e)),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update calendar event', 
        isLoading: false 
      });
      return null;
    }
  },
  
  deleteCalendarEvent: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await CalendarService.deleteCalendarEvent(id);
      
      if (result.error) {
        throw result.error;
      }
      
      set((state) => ({
        calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
        isLoading: false
      }));
      
      toast({
        title: "Event deleted",
        description: "Calendar event has been successfully deleted"
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete calendar event', 
        isLoading: false 
      });
    }
  },
  
  syncWithExternalCalendar: async (integrationId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await CalendarService.syncWithExternalCalendar(integrationId);
      
      if (result.error) {
        throw result.error;
      }
      
      // Refresh calendar events after sync
      await get().fetchCalendarEvents();
      
      toast({
        title: "Calendar synced",
        description: "Your calendar has been successfully synchronized"
      });
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error syncing with external calendar:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sync with external calendar', 
        isLoading: false 
      });
      
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync with external calendar",
        variant: "destructive"
      });
    }
  },
  
  exportTasksAsICS: async (taskIds) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await CalendarService.exportTasksAsICS(taskIds);
      
      if (result.error) {
        throw result.error;
      }
      
      set({ isLoading: false });
      return result.data;
    } catch (error) {
      console.error('Error exporting tasks as ICS:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to export tasks', 
        isLoading: false 
      });
      return null;
    }
  },
  
  // Email operations
  fetchEmailSettings: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await EmailService.fetchEmailSettings();
      if (result.error) {
        throw result.error;
      }
      
      set({ emailSettings: result.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching email settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch email settings', 
        isLoading: false 
      });
    }
  },
  
  updateEmailSettings: async (settings) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await EmailService.updateEmailSettings(settings);
      
      if (result.error) {
        throw result.error;
      }
      
      set({ emailSettings: result.data, isLoading: false });
      
      toast({
        title: "Settings updated",
        description: "Your email settings have been updated successfully"
      });
      
      return result.data;
    } catch (error) {
      console.error('Error updating email settings:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update email settings', 
        isLoading: false 
      });
      return null;
    }
  },
  
  sendTaskSummary: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await EmailService.sendTaskSummary(userId);
      
      if (result.error) {
        throw result.error;
      }
      
      set({ isLoading: false });
      
      toast({
        title: "Summary sent",
        description: "Task summary has been sent to your email"
      });
    } catch (error) {
      console.error('Error sending task summary:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send task summary', 
        isLoading: false 
      });
      
      toast({
        title: "Failed to send summary",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  },
  
  shareTaskViaEmail: async (taskId, email, message) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await EmailService.shareTaskViaEmail(taskId, email, message);
      
      if (result.error) {
        throw result.error;
      }
      
      set({ isLoading: false });
      
      toast({
        title: "Task shared",
        description: `Task has been shared with ${email}`
      });
    } catch (error) {
      console.error('Error sharing task via email:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to share task', 
        isLoading: false 
      });
      
      toast({
        title: "Failed to share task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  },
  
  // Utility functions
  startOAuthFlow: (provider) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const authUrl = IntegrationService.generateOAuthUrl(provider, redirectUrl);
    window.location.href = authUrl;
  },
  
  handleOAuthCallback: async (provider, code) => {
    set({ isLoading: true, error: null });
    
    try {
      // Handle OAuth callback via edge function to exchange code for tokens securely
      const { error, data } = await supabase.functions.invoke('oauth-callback', {
        body: { provider, code, redirectUri: `${window.location.origin}/auth/callback` }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data || !data.integration) {
        throw new Error('No integration data returned');
      }
      
      // Refresh integrations after successful OAuth flow
      await get().fetchIntegrations();
      
      set({ isLoading: false });
      
      toast({
        title: "Integration connected",
        description: `Your ${provider} account has been successfully connected`
      });
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to complete authentication', 
        isLoading: false 
      });
      
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Failed to connect integration",
        variant: "destructive"
      });
    }
  }
});
