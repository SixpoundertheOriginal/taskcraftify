import { supabase } from '@/integrations/supabase/client';
import { 
  Task, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  mapApiTaskToTask, 
  TaskPriority,
  TaskStatus,
  APITask
} from '@/types/task';
import { Database } from '@/integrations/supabase/types';

// Define the specific types from the database for type-safety
type TaskPriorityDB = Database['public']['Enums']['task_priority'];
type TaskStatusDB = Database['public']['Enums']['task_status'];

// Type for Supabase task insert
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Service result type for consistent error handling
interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export const TaskService = {
  async fetchTasks(): Promise<ServiceResult<Task[]>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return { data: null, error: new Error(error.message) };
      }

      // Enhanced debugging: Log raw API data with explicit type information
      console.log('Raw API task data before mapping:', 
        data?.map((task: any) => ({
          id: task.id,
          title: task.title,
          project_id: task.project_id,
          project_id_type: typeof task.project_id,
          project_id_value: task.project_id === null ? 'null' : task.project_id
        }))
      );
      
      const mappedTasks = (data as APITask[]).map(mapApiTaskToTask);
      console.log(`Fetched ${mappedTasks.length} tasks`);
      
      // Enhanced debugging: Log mapped tasks with better type information
      console.log('Mapped tasks with projectId values:', 
        mappedTasks.map(t => ({ 
          id: t.id, 
          title: t.title, 
          projectId: t.projectId === undefined ? 'undefined' : 
                    t.projectId === null ? 'null' : t.projectId,
          projectIdType: typeof t.projectId,
          projectIdValue: JSON.stringify(t.projectId)
        }))
      );
      
      return { 
        data: mappedTasks, 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error fetching tasks:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  },

  async createTask(taskData: CreateTaskDTO): Promise<ServiceResult<Task>> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return { data: null, error: new Error(userError.message) };
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        return { data: null, error: new Error('User not authenticated') };
      }

      // Convert the task data to a properly typed insert object
      const taskInsert: TaskInsert = {
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status as TaskStatusDB,
        priority: taskData.priority as TaskPriorityDB,
        due_date: taskData.dueDate ? taskData.dueDate.toISOString() : null,
        tags: taskData.tags || null,
        user_id: userId
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { 
        data: mapApiTaskToTask(data as APITask), 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error creating task:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async updateTask(taskUpdate: UpdateTaskDTO): Promise<ServiceResult<Task>> {
    try {
      // Create a properly typed update object
      const taskUpdateData: TaskUpdate = {
        id: taskUpdate.id
      };
      
      // Only add properties that are defined in the update DTO
      if (taskUpdate.title !== undefined) taskUpdateData.title = taskUpdate.title;
      if (taskUpdate.description !== undefined) taskUpdateData.description = taskUpdate.description || null;
      if (taskUpdate.status !== undefined) taskUpdateData.status = taskUpdate.status as TaskStatusDB;
      if (taskUpdate.priority !== undefined) taskUpdateData.priority = taskUpdate.priority as TaskPriorityDB;
      if (taskUpdate.dueDate !== undefined) taskUpdateData.due_date = taskUpdate.dueDate ? taskUpdate.dueDate.toISOString() : null;
      if (taskUpdate.tags !== undefined) taskUpdateData.tags = taskUpdate.tags || null;
      
      const { data, error } = await supabase
        .from('tasks')
        .update(taskUpdateData)
        .eq('id', taskUpdate.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { 
        data: mapApiTaskToTask(data as APITask), 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error updating task:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async deleteTask(id: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error deleting task:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  subscribeToTasks(callback: (tasks: Task[]) => void): (() => void) {
    console.log("Setting up realtime subscription to tasks table");
    
    const channel = supabase
      .channel('tasks-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        async (payload) => {
          console.log("Realtime task update detected:", payload.eventType);
          // When any change happens, refresh the task list
          try {
            const result = await this.fetchTasks();
            if (result.data) {
              callback(result.data);
            } else if (result.error) {
              console.error('Error refreshing tasks after changes:', result.error);
            }
          } catch (error) {
            console.error('Error in subscription callback:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Tasks subscription status: ${status}`);
      });

    // Return unsubscribe function
    return () => {
      console.log("Removing tasks subscription");
      supabase.removeChannel(channel);
    };
  },

  async directQueryTaskCounts(): Promise<ServiceResult<{
    totalCount: number;
    noProjectCount: number;
    projectCounts: Record<string, number>;
  }>> {
    try {
      console.log('----------------------------------------');
      console.log('DIRECT DATABASE QUERY FOR TASK COUNTS:');
      console.log('----------------------------------------');
      
      // Get total count of tasks
      const { count: totalCount, error: totalError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });
        
      if (totalError) {
        throw new Error(`Error getting total task count: ${totalError.message}`);
      }
      
      // Fix: Type-safe access for count which is now a number
      const totalTaskCount = totalCount || 0;
      console.log(`1. Total tasks in database: ${totalTaskCount}`);
      
      // Get count of tasks with no project
      const { count: noProjectCount, error: noProjectError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .is('project_id', null);
        
      if (noProjectError) {
        throw new Error(`Error getting no-project task count: ${noProjectError.message}`);
      }
      
      // Fix: Type-safe access for count
      const noProjectTaskCount = noProjectCount || 0;
      console.log(`2. Tasks with no project: ${noProjectTaskCount}`);
      
      // Get counts by project
      const { data: projectData, error: projectError } = await supabase
        .from('tasks')
        .select('project_id');
        
      if (projectError) {
        throw new Error(`Error getting project task counts: ${projectError.message}`);
      }
      
      // Count tasks by project ID
      const projectCounts: Record<string, number> = {};
      projectData?.forEach(row => {
        const projectId = row.project_id || 'null';
        projectCounts[projectId] = (projectCounts[projectId] || 0) + 1;
      });
      
      console.log('3. Tasks by project_id:');
      Object.entries(projectCounts).forEach(([projectId, count]) => {
        console.log(`   Project "${projectId}": ${count} tasks`);
      });
      
      // Debug: Fetch and log raw task data
      const { data: rawTasks, error: rawError } = await supabase
        .from('tasks')
        .select('id, title, project_id')
        .limit(20);
        
      if (rawError) {
        console.error('Error fetching raw task data:', rawError);
      } else {
        console.log('4. Sample of raw task data from database:');
        rawTasks?.forEach((task, index) => {
          // More explicit type logging
          console.log(`   Task ${index + 1}: id=${task.id}, title=${task.title}, project_id=${
            task.project_id === null ? 'null' : task.project_id
          }, type=${typeof task.project_id}, JSON=${JSON.stringify(task.project_id)}`);
        });
      }
      
      console.log('----------------------------------------');
      console.log('DATABASE QUERY COMPLETED');
      console.log('----------------------------------------');
      
      return {
        data: {
          totalCount: totalTaskCount,
          noProjectCount: noProjectTaskCount,
          projectCounts
        },
        error: null
      };
    } catch (error) {
      console.error('Error in direct database query:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
};
