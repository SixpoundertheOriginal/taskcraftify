
import { supabase } from '@/integrations/supabase/client';
import { 
  Task, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  mapApiTaskToTask, 
  mapTaskToApiTask,
  APITask
} from '@/types/task';
import { Database } from '@/integrations/supabase/types';

// Define the specific types from the database for type-safety
type TaskPriorityDB = Database['public']['Enums']['task_priority'];
type TaskStatusDB = Database['public']['Enums']['task_status'];

// Type for Supabase task insert
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export const TaskService = {
  async fetchTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return (data as APITask[]).map(mapApiTaskToTask);
  },

  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw userError;
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
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
      throw error;
    }

    return mapApiTaskToTask(data as APITask);
  },

  async updateTask(taskUpdate: UpdateTaskDTO): Promise<Task> {
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
      throw error;
    }

    return mapApiTaskToTask(data as APITask);
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  subscribeToTasks(callback: (tasks: Task[]) => void): (() => void) {
    const subscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        async () => {
          // When any change happens, refresh the task list
          try {
            const tasks = await this.fetchTasks();
            callback(tasks);
          } catch (error) {
            console.error('Error refreshing tasks after changes:', error);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }
};
