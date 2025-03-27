
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.25.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncCalendarRequest {
  integrationId: string;
}

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { integrationId } = await req.json() as SyncCalendarRequest;

    if (!integrationId) {
      throw new Error("Missing required parameter: integrationId");
    }

    // Log basic info
    console.log(`Syncing calendar for integration ID: ${integrationId}`);

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("*")
      .eq("id", integrationId)
      .single();

    if (integrationError) {
      throw new Error(`Failed to retrieve integration: ${integrationError.message}`);
    }

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    const tokenExpiresAt = new Date(integration.token_expires_at);
    
    let accessToken = integration.access_token;
    
    if (tokenExpiresAt <= now && integration.refresh_token) {
      console.log("Access token expired, refreshing...");
      
      // Refresh token based on provider
      if (integration.provider === "google") {
        const client_id = Deno.env.get("GOOGLE_CLIENT_ID");
        const client_secret = Deno.env.get("GOOGLE_CLIENT_SECRET");
        
        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id,
            client_secret,
            refresh_token: integration.refresh_token,
            grant_type: "refresh_token",
          }),
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          accessToken = refreshData.access_token;
          
          // Calculate new expiration
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + refreshData.expires_in);
          
          // Update integration with new token
          const { error: updateError } = await supabase
            .from("integrations")
            .update({
              access_token: accessToken,
              token_expires_at: expiresAt.toISOString(),
            })
            .eq("id", integrationId);
          
          if (updateError) {
            console.error("Failed to update integration with new token:", updateError);
          }
        } else {
          const errorData = await refreshResponse.text();
          throw new Error(`Failed to refresh token: ${errorData}`);
        }
      }
    }

    // Implement calendar sync based on provider
    if (integration.provider === "google") {
      // Set time range for syncing (e.g., last 30 days to next 90 days)
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 90);
      
      // Fetch calendar events from Google
      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.text();
        throw new Error(`Failed to fetch Google Calendar events: ${errorData}`);
      }
      
      const calendarData = await calendarResponse.json();
      const events = calendarData.items || [];
      
      console.log(`Found ${events.length} events to sync`);
      
      // Get existing events for this integration
      const { data: existingEvents } = await supabase
        .from("calendar_events")
        .select("id, external_event_id")
        .eq("integration_id", integrationId);
      
      const existingEventMap = new Map();
      if (existingEvents) {
        existingEvents.forEach((event) => {
          existingEventMap.set(event.external_event_id, event.id);
        });
      }
      
      // Process each event
      for (const event of events) {
        const eventData = {
          user_id: integration.user_id,
          integration_id: integrationId,
          external_event_id: event.id,
          title: event.summary || "Untitled Event",
          description: event.description || null,
          start_time: event.start?.dateTime || (event.start?.date ? `${event.start.date}T00:00:00Z` : null),
          end_time: event.end?.dateTime || (event.end?.date ? `${event.end.date}T23:59:59Z` : null),
          all_day: !!event.start?.date,
          location: event.location || null,
          status: event.status || null,
          calendar_id: event.organizer?.email || "primary",
          recurrence: event.recurrence || null,
          last_synced_at: new Date().toISOString(),
        };
        
        if (existingEventMap.has(event.id)) {
          // Update existing event
          const { error: updateError } = await supabase
            .from("calendar_events")
            .update(eventData)
            .eq("id", existingEventMap.get(event.id));
          
          if (updateError) {
            console.error(`Error updating event ${event.id}:`, updateError);
          }
        } else {
          // Create new event
          const { error: insertError } = await supabase
            .from("calendar_events")
            .insert(eventData);
          
          if (insertError) {
            console.error(`Error inserting event ${event.id}:`, insertError);
          }
        }
      }
    } else {
      throw new Error(`Calendar sync not implemented for provider: ${integration.provider}`);
    }

    console.log("Calendar sync completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Calendar sync completed successfully",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in sync-calendar function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
