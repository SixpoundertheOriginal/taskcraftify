
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Setup Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    // Get the current user's ID and task context from the request
    const { taskContext } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get the user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const userId = user.id;
    
    // Get the latest analysis results for this user
    const { data: analysis, error: analysisError } = await supabase
      .from('template_analysis')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (analysisError) {
      console.error('Error fetching template analysis:', analysisError);
      // If no analysis exists yet, just return popular templates
      const { data: popularTemplates, error: templatesError } = await supabase
        .from('templates')
        .select('id, name, description, structure, usage_count')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false })
        .limit(5);
        
      if (templatesError) {
        throw templatesError;
      }
      
      return new Response(JSON.stringify({ 
        suggestions: popularTemplates || [],
        context: 'popular',
        message: 'Based on your most used templates'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If we have task context, use it for more targeted suggestions
    if (taskContext) {
      const suggestions = await getSuggestionsBasedOnContext(userId, taskContext, analysis);
      
      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Default to returning popular templates if no context provided
    return new Response(JSON.stringify({ 
      suggestions: analysis.popular_templates || [],
      context: 'popular',
      message: 'Based on your most used templates'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in suggestTemplates function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Get template suggestions based on the current task context
 */
async function getSuggestionsBasedOnContext(userId, taskContext, analysis) {
  const { tags = [], projectId, title = '', description = '' } = taskContext;
  
  // Initialize with popular templates as fallback
  let suggestions = analysis.popular_templates || [];
  let context = 'popular';
  let message = 'Based on your most used templates';
  
  // Check if we have tag-based matches
  if (tags.length > 0 && analysis.tag_patterns) {
    const tagFrequencies = analysis.tag_patterns.frequencies || {};
    const relevantTags = tags.filter(tag => tagFrequencies[tag]);
    
    if (relevantTags.length > 0) {
      // Get templates that match the tags
      const { data: tagBasedTemplates, error } = await supabase
        .from('templates')
        .select('id, name, description, structure, usage_count')
        .eq('user_id', userId)
        .filter('structure->tags', 'cs', `{${relevantTags.join(',')}}`)
        .limit(5);
        
      if (!error && tagBasedTemplates && tagBasedTemplates.length > 0) {
        suggestions = tagBasedTemplates;
        context = 'tags';
        message = `Based on tags: ${relevantTags.join(', ')}`;
      }
    }
  }
  
  // Check if we have project-based matches
  if (projectId) {
    const { data: projectTemplates, error } = await supabase
      .from('templates')
      .select('id, name, description, structure, usage_count')
      .eq('user_id', userId)
      .filter('structure->projectId', 'eq', projectId)
      .limit(5);
      
    if (!error && projectTemplates && projectTemplates.length > 0) {
      suggestions = projectTemplates;
      context = 'project';
      message = 'Based on your selected project';
    }
  }
  
  // If title/description is provided, we could do semantic matching in the future
  // For now, we just use the other context clues
  
  return {
    suggestions,
    context,
    message
  };
}
