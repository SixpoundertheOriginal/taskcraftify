
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

/**
 * Analyzes template usage patterns to determine:
 * 1. Which templates are most popular
 * 2. Which templates are most effective (used for completed tasks)
 * 3. Context-specific template suggestions based on tags, project, etc.
 */
async function analyzeTemplateUsage() {
  console.log('Starting template usage analysis...');
  
  try {
    // Get all users who have templates
    const { data: users, error: usersError } = await supabase
      .from('templates')
      .select('user_id')
      .distinct();
      
    if (usersError) {
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('No users with templates found.');
      return;
    }
    
    // Process each user's templates
    for (const userObj of users) {
      const userId = userObj.user_id;
      
      // 1. Find most frequently used templates
      const { data: popularTemplates, error: popularError } = await supabase
        .from('templates')
        .select('id, name, usage_count, structure')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false })
        .limit(5);
        
      if (popularError) {
        console.error(`Error getting popular templates for user ${userId}:`, popularError);
        continue;
      }
      
      // 2. Find templates used for successfully completed tasks
      const { data: effectiveTemplates, error: effectiveError } = await supabase.rpc(
        'get_effective_templates',
        { user_id_param: userId }
      );
      
      if (effectiveError) {
        console.error(`Error getting effective templates for user ${userId}:`, effectiveError);
        // Continue with other analytics even if this one fails
      }
      
      // 3. Find tag-based patterns
      const { data: templateTags, error: tagsError } = await supabase
        .from('templates')
        .select('id, name, structure')
        .eq('user_id', userId);
        
      if (tagsError) {
        console.error(`Error getting template tags for user ${userId}:`, tagsError);
        continue;
      }
      
      // Extract and analyze tags from templates
      const tagPatterns = analyzeTagPatterns(templateTags);
      
      // 4. Store analysis results in the template_analysis table
      const { error: analysisError } = await supabase
        .from('template_analysis')
        .upsert({
          user_id: userId,
          popular_templates: popularTemplates || [],
          effective_templates: effectiveTemplates || [],
          tag_patterns: tagPatterns,
          analyzed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
        
      if (analysisError) {
        console.error(`Error storing analysis for user ${userId}:`, analysisError);
      } else {
        console.log(`Analysis completed successfully for user ${userId}`);
      }
    }
    
    console.log('Template usage analysis completed.');
  } catch (error) {
    console.error('Error during template analysis:', error);
  }
}

/**
 * Helper function to analyze tag patterns from templates
 */
function analyzeTagPatterns(templates) {
  const tagFrequency = {};
  const tagCooccurrence = {};
  
  templates.forEach(template => {
    const tags = template.structure.tags || [];
    
    // Count tag frequency
    tags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      
      // Analyze tag co-occurrence
      tags.forEach(otherTag => {
        if (tag !== otherTag) {
          if (!tagCooccurrence[tag]) {
            tagCooccurrence[tag] = {};
          }
          tagCooccurrence[tag][otherTag] = (tagCooccurrence[tag][otherTag] || 0) + 1;
        }
      });
    });
  });
  
  return {
    frequencies: tagFrequency,
    cooccurrences: tagCooccurrence
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Allow manual triggering with POST or scheduled execution
  if (req.method === 'POST') {
    try {
      // Run the analysis
      await analyzeTemplateUsage();
      
      return new Response(JSON.stringify({ success: true, message: 'Template analysis completed successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (error) {
      console.error('Error in analyzeTemplateUsage function:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 405
  });
});
