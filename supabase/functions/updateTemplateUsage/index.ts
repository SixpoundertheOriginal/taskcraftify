
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Get the authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Handle the actual request
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { templateId, taskId } = await req.json();
    
    if (!templateId) {
      return new Response(
        JSON.stringify({ error: 'Template ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user ID from auth context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Call the increment_template_usage function
    const { error: rpcError } = await supabase.rpc('increment_template_usage', {
      template_id: templateId
    });
    
    if (rpcError) {
      console.error('Error updating template usage via RPC:', rpcError);
      
      // Fallback: manually update the template if RPC fails
      const { error: updateError } = await supabase
        .from('templates')
        .update({ 
          usage_count: supabase.sql`usage_count + 1`,
          last_used: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('user_id', user.id);
        
      if (updateError) {
        console.error('Error updating template usage directly:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update template usage' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // If taskId is provided, log template_usage record
    if (taskId) {
      const { error: usageError } = await supabase
        .from('template_usage')
        .insert({
          template_id: templateId,
          task_id: taskId,
          user_id: user.id
        });
        
      if (usageError) {
        console.error('Error logging template usage:', usageError);
        // Non-critical error, continue
      }
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in updateTemplateUsage:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
