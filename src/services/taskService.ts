
import { supabase } from '@/integrations/supabase/client';
import { 
  Task, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  mapApiTaskToTask, 
  mapTaskToApiTask,
  APITask
} from '@/types/task';

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

    const apiTask = mapTaskToApiTask(taskData, userId);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(apiTask)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return mapApiTaskToTask(data as APITask);
  },

  async updateTask(taskUpdate: UpdateTaskDTO): Promise<Task> {
    const apiTask = mapTaskToApiTask(taskUpdate);
    
    const { data, error } = await supabase
      .from('tasks')
      .update(apiTask)
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
