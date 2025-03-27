
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarEvent,
  CreateCalendarEventDTO,
  UpdateCalendarEventDTO,
  mapApiCalendarEventToCalendarEvent,
  mapCalendarEventToApiCalendarEvent
} from '@/types/integration';

export class CalendarService {
  // Fetch all calendar events for the current user
  static async fetchCalendarEvents(): Promise<{ data: CalendarEvent[] | null, error: Error | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return { data: null, error: new Error('No active session') };
      }
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      return { 
        data: data ? data.map(mapApiCalendarEventToCalendarEvent) : [], 
        error: null 
      };
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      return { data: null, error };
    }
  }
  
  // Fetch calendar events for a specific time range
  static async fetchCalendarEventsInRange(start: Date, end: Date): Promise<{ data: CalendarEvent[] | null, error: Error | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return { data: null, error: new Error('No active session') };
      }
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .or(`start_time.gte.${start.toISOString()},end_time.gte.${start.toISOString()}`)
        .lt('start_time', end.toISOString())
        .order('start_time', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      return { 
        data: data ? data.map(mapApiCalendarEventToCalendarEvent) : [], 
        error: null 
      };
    } catch (error: any) {
      console.error('Error fetching calendar events by range:', error);
      return { data: null, error };
    }
  }
  
  // Fetch calendar events linked to a specific task
  static async fetchCalendarEventsByTaskId(taskId: string): Promise<{ data: CalendarEvent[] | null, error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('task_id', taskId);
        
      if (error) {
        throw error;
      }
      
      return { 
        data: data ? data.map(mapApiCalendarEventToCalendarEvent) : [], 
        error: null 
      };
    } catch (error: any) {
      console.error('Error fetching calendar events by task:', error);
      return { data: null, error };
    }
  }
  
  // Create a new calendar event
  static async createCalendarEvent(eventData: CreateCalendarEventDTO): Promise<{ data: CalendarEvent | null, error: Error | null }> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        return { data: null, error: new Error('No active session') };
      }
      
      const userId = session.session.user.id;
      const mappedData = mapCalendarEventToApiCalendarEvent(eventData, userId);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(mappedData)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return { 
        data: mapApiCalendarEventToCalendarEvent(data), 
        error: null 
      };
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      return { data: null, error };
    }
  }
  
  // Update an existing calendar event
  static async updateCalendarEvent(eventData: UpdateCalendarEventDTO): Promise<{ data: CalendarEvent | null, error: Error | null }> {
    try {
      const mappedData = mapCalendarEventToApiCalendarEvent(eventData);
      
      const { data, error } = await supabase
        .from('calendar_events')
        .update(mappedData)
        .eq('id', eventData.id)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      return { 
        data: mapApiCalendarEventToCalendarEvent(data), 
        error: null 
      };
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      return { data: null, error };
    }
  }
  
  // Delete a calendar event
  static async deleteCalendarEvent(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      return { error };
    }
  }
  
  // Sync with external calendar provider (to be implemented with edge functions)
  static async syncWithExternalCalendar(integrationId: string): Promise<{ error: Error | null }> {
    try {
      // This would be handled by an edge function to securely access the external APIs
      const { error } = await supabase.functions.invoke('sync-calendar', {
        body: { integrationId }
      });
      
      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Error syncing with external calendar:', error);
      return { error };
    }
  }

  // Exports tasks as ICS file
  static exportTasksAsICS(taskIds: string[]): Promise<{ data: Blob | null, error: Error | null }> {
    // Implement ICS file generation logic
    return Promise.resolve({ data: null, error: new Error('Not implemented yet') });
  }
}
