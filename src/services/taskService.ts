
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

      const mappedTasks = (data as APITask[]).map(mapApiTaskToTask);
      console.log(`Fetched ${mappedTasks.length} tasks`);
      
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
  }
};
