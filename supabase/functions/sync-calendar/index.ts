import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integrationId } = await req.json();
    
    // Validate required params
    if (!integrationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Get the integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .single();
    
    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integration not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Check if token is expired and refresh if needed
    const now = new Date();
    const tokenExpiry = new Date(integration.token_expires_at);
    
    if (now > tokenExpiry) {
      // Token is expired, refresh it
      if (integration.provider === 'google' && integration.refresh_token) {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token',
          }),
        });
        
        const refreshData = await refreshResponse.json();
        
        if (!refreshResponse.ok) {
          console.error('Error refreshing token:', refreshData);
          return new Response(
            JSON.stringify({ error: 'Failed to refresh access token' }),
            { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        // Update the integration with the new access token
        const { error: updateError } = await supabase
          .from('integrations')
          .update({
            access_token: refreshData.access_token,
            token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          })
          .eq('id', integrationId);
        
        if (updateError) {
          console.error('Error updating integration with new token:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update integration with new token' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        
        // Update local copy with new token
        integration.access_token = refreshData.access_token;
      } else {
        return new Response(
          JSON.stringify({ error: 'Token expired and cannot be refreshed' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }
    
    // Fetch tasks with due dates
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .not('due_date', 'is', null);
    
    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tasks' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Sync logic depends on the provider
    if (integration.provider === 'google') {
      // Fetch existing calendar events first to avoid duplicates
      const { data: existingEvents, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_id', integrationId);
      
      if (eventsError) {
        console.error('Error fetching calendar events:', eventsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch existing calendar events' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Create a map for quick lookup
      const existingEventsByTaskId = new Map();
      existingEvents?.forEach(event => {
        if (event.task_id) {
          existingEventsByTaskId.set(event.task_id, event);
        }
      });
      
      // For each task, create or update calendar event
      const calendarPromises = tasks.map(async (task) => {
        try {
          const existingEvent = existingEventsByTaskId.get(task.id);
          
          // If we have an existing event for this task, update it
          if (existingEvent) {
            // Update Google Calendar first
            const updateResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.external_event_id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                summary: task.title,
                description: task.description || `Priority: ${task.priority}`,
                start: {
                  dateTime: new Date(task.due_date).toISOString(),
                  timeZone: 'UTC',
                },
                end: {
                  dateTime: new Date(new Date(task.due_date).getTime() + 30 * 60 * 1000).toISOString(),
                  timeZone: 'UTC',
                },
              }),
            });
            
            if (!updateResponse.ok) {
              console.error('Error updating Google Calendar event:', await updateResponse.text());
              continue;
            }
            
            const updatedGoogleEvent = await updateResponse.json();
            
            // Then update our local event record
            await supabase
              .from('calendar_events')
              .update({
                title: task.title,
                description: task.description,
                start_time: new Date(task.due_date).toISOString(),
                end_time: new Date(new Date(task.due_date).getTime() + 30 * 60 * 1000).toISOString(),
                last_synced_at: new Date().toISOString(),
              })
              .eq('id', existingEvent.id);
          } else {
            // Create a new event in Google Calendar
            const createResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                summary: task.title,
                description: task.description || `Priority: ${task.priority}`,
                start: {
                  dateTime: new Date(task.due_date).toISOString(),
                  timeZone: 'UTC',
                },
                end: {
                  dateTime: new Date(new Date(task.due_date).getTime() + 30 * 60 * 1000).toISOString(),
                  timeZone: 'UTC',
                },
              }),
            });
            
            if (!createResponse.ok) {
              console.error('Error creating Google Calendar event:', await createResponse.text());
              continue;
            }
            
            const newGoogleEvent = await createResponse.json();
            
            // Then create a local event record
            await supabase
              .from('calendar_events')
              .insert({
                user_id: user.id,
                integration_id: integrationId,
                external_event_id: newGoogleEvent.id,
                task_id: task.id,
                title: task.title,
                description: task.description,
                start_time: new Date(task.due_date).toISOString(),
                end_time: new Date(new Date(task.due_date).getTime() + 30 * 60 * 1000).toISOString(),
                calendar_id: 'primary',
                last_synced_at: new Date().toISOString(),
              });
          }
        } catch (error) {
          console.error(`Error syncing task ${task.id}:`, error);
          // Continue with other tasks
        }
      });
      
      // Wait for all calendar operations to complete
      await Promise.allSettled(calendarPromises);
      
      // Now fetch events from Google Calendar and create tasks for them
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + 
        new Date().toISOString() + '&maxResults=100', {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
        },
      });
      
      if (!calendarResponse.ok) {
        console.error('Error fetching Google Calendar events:', await calendarResponse.text());
        return new Response(
          JSON.stringify({ error: 'Failed to fetch Google Calendar events' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      const googleEvents = await calendarResponse.json();
      
      // Process the events - keeping this simple for now, just importing events that don't exist yet
      for (const event of googleEvents.items || []) {
        // Skip events we've already created from tasks
        const { data: existingImportedEvent } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('external_event_id', event.id)
          .eq('integration_id', integrationId)
          .maybeSingle();
        
        if (existingImportedEvent) {
          // Already imported this event, skip
          continue;
        }
        
        // Create a new calendar event record for this Google Calendar event
        await supabase
          .from('calendar_events')
          .insert({
            user_id: user.id,
            integration_id: integrationId,
            external_event_id: event.id,
            title: event.summary,
            description: event.description,
            start_time: event.start?.dateTime || event.start?.date,
            end_time: event.end?.dateTime || event.end?.date,
            all_day: !event.start?.dateTime,
            location: event.location,
            calendar_id: 'primary',
            last_synced_at: new Date().toISOString(),
          });
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Calendar synced successfully',
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: `Calendar provider ${integration.provider} not supported` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
