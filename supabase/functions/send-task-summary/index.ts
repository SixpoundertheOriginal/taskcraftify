
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
    
    // Get user's email settings
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (settingsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch email settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // If no settings or email address, can't send an email
    if (!emailSettings || !emailSettings.email_address) {
      return new Response(
        JSON.stringify({ error: 'No email address configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Get user's tasks for summary
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .not('status', 'eq', 'DONE')
      .not('status', 'eq', 'ARCHIVED')
      .order('due_date', { ascending: true });
    
    if (tasksError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tasks' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Generate email content
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate.toDateString() === today.toDateString();
    });
    
    const tomorrowTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return dueDate.toDateString() === tomorrow.toDateString();
    });
    
    const upcomingTasks = tasks.filter(task => {
      if (!task.due_date) return true; // Tasks without due dates are "upcoming"
      const dueDate = new Date(task.due_date);
      return dueDate > tomorrow;
    });
    
    // Simple HTML email template
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
            padding: 10px;
            margin-bottom: 10px;
            background-color: #f9f9f9;
            border-left: 4px solid #ddd;
          }
          .high { border-left-color: #e74c3c; }
          .medium { border-left-color: #f39c12; }
          .low { border-left-color: #3498db; }
          .task-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .task-details {
            color: #666;
            font-size: 0.9em;
          }
          .section {
            margin-bottom: 30px;
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
        <h1>Your Task Summary</h1>
        <p>Here's a summary of your tasks as of ${today.toLocaleDateString()}</p>
        
        <div class="section">
          <h2>Today's Tasks (${todayTasks.length})</h2>
          ${todayTasks.length > 0 
            ? todayTasks.map(task => `
                <div class="task ${task.priority.toLowerCase()}">
                  <div class="task-title">${task.title}</div>
                  <div class="task-details">
                    Status: ${task.status.replace('_', ' ')} | Priority: ${task.priority}
                    ${task.description ? `<br>${task.description}` : ''}
                  </div>
                </div>
              `).join('')
            : '<p>No tasks due today.</p>'
          }
        </div>
        
        <div class="section">
          <h2>Tomorrow's Tasks (${tomorrowTasks.length})</h2>
          ${tomorrowTasks.length > 0 
            ? tomorrowTasks.map(task => `
                <div class="task ${task.priority.toLowerCase()}">
                  <div class="task-title">${task.title}</div>
                  <div class="task-details">
                    Status: ${task.status.replace('_', ' ')} | Priority: ${task.priority}
                    ${task.description ? `<br>${task.description}` : ''}
                  </div>
                </div>
              `).join('')
            : '<p>No tasks due tomorrow.</p>'
          }
        </div>
        
        <div class="section">
          <h2>Upcoming Tasks (${upcomingTasks.length})</h2>
          ${upcomingTasks.length > 0 
            ? upcomingTasks.slice(0, 5).map(task => `
                <div class="task ${task.priority.toLowerCase()}">
                  <div class="task-title">${task.title}</div>
                  <div class="task-details">
                    Status: ${task.status.replace('_', ' ')} | Priority: ${task.priority}
                    ${task.due_date ? `<br>Due: ${new Date(task.due_date).toLocaleDateString()}` : ''}
                    ${task.description ? `<br>${task.description}` : ''}
                  </div>
                </div>
              `).join('')
            : '<p>No upcoming tasks.</p>'
          }
          ${upcomingTasks.length > 5 ? `<p>...and ${upcomingTasks.length - 5} more tasks</p>` : ''}
        </div>
        
        <div class="footer">
          <p>This email was sent from TaskCraft. Manage your notification preferences in the app settings.</p>
        </div>
      </body>
      </html>
    `;
    
    // In a real implementation, you would use an email service like SendGrid, Mailgun, or AWS SES
    // For this example, we'll just return the email content as if it was sent
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email summary generated successfully',
        emailContent: emailHtml,
        recipient: emailSettings.email_address,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Error sending task summary:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
