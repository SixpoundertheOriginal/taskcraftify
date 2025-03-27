
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
    const { taskId, email, message } = await req.json();
    
    // Validate required params
    if (!taskId || !email) {
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
    
    // Get the task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();
    
    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }
    
    const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : user.email;
    
    // Generate email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          h1, h2, h3 {
            color: #444;
          }
          .task {
            padding: 20px;
            margin-bottom: 20px;
            background-color: #f9f9f9;
            border-left: 4px solid #ddd;
          }
          .high { border-left-color: #e74c3c; }
          .medium { border-left-color: #f39c12; }
          .low { border-left-color: #3498db; }
          .task-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .task-details {
            margin-bottom: 15px;
          }
          .task-meta {
            color: #666;
            font-size: 0.9em;
            margin-top: 15px;
          }
          .message {
            padding: 15px;
            margin: 20px 0;
            background-color: #f2f9ff;
            border-left: 4px solid #3498db;
          }
          .footer {
            margin-top: 40px;
            font-size: 0.8em;
            color: #999;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Task Shared With You</h1>
        <p>${userName} has shared a task with you from TaskCraft.</p>
        
        ${message ? `
          <div class="message">
            <strong>Message from ${userName}:</strong>
            <p>${message}</p>
          </div>
        ` : ''}
        
        <div class="task ${task.priority.toLowerCase()}">
          <div class="task-title">${task.title}</div>
          <div class="task-details">
            ${task.description || 'No description provided.'}
          </div>
          <div class="task-meta">
            <div>Status: ${task.status.replace('_', ' ')}</div>
            <div>Priority: ${task.priority}</div>
            ${task.due_date ? `<div>Due Date: ${new Date(task.due_date).toLocaleDateString()}</div>` : ''}
            ${task.tags && task.tags.length > 0 ? `<div>Tags: ${task.tags.join(', ')}</div>` : ''}
          </div>
        </div>
        
        <p>To view more details or collaborate on this task, you can request an account invitation from the task owner.</p>
        
        <div class="footer">
          <p>This email was sent from TaskCraft, a task management application.</p>
        </div>
      </body>
      </html>
    `;
    
    // In a real implementation, you would use an email service like SendGrid, Mailgun, or AWS SES
    // For this example, we'll just return the email content as if it was sent
    
    // Add an activity record for sharing this task
    await supabase
      .from('activities')
      .insert({
        task_id: taskId,
        type: 'share',
        description: `Task shared with ${email}`,
        created_by: user.id,
        metadata: { recipient: email, message: message || null }
      });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Task "${task.title}" shared with ${email}`,
        emailContent: emailHtml,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Error sharing task:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
