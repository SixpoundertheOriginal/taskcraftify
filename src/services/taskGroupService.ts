
import { supabase } from '@/integrations/supabase/client';
import { 
  TaskGroup, 
  CreateTaskGroupDTO, 
  UpdateTaskGroupDTO, 
  mapApiTaskGroupToTaskGroup, 
  APITaskGroup 
} from '@/types/taskGroup';
import { Database } from '@/types/database';

// Service result type for consistent error handling
interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export const TaskGroupService = {
  async fetchTaskGroups(projectId?: string): Promise<ServiceResult<TaskGroup[]>> {
    try {
      let query = supabase
        .from('task_groups')
        .select('*')
        .order('position', { ascending: true });
        
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching task groups:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { 
        data: (data as APITaskGroup[]).map(mapApiTaskGroupToTaskGroup), 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error fetching task groups:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  },

  async createTaskGroup(taskGroupData: CreateTaskGroupDTO): Promise<ServiceResult<TaskGroup>> {
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

      // Get the highest position for ordering
      let position = 0;
      if (taskGroupData.projectId) {
        const { data: existingGroups } = await supabase
          .from('task_groups')
          .select('position')
          .eq('project_id', taskGroupData.projectId)
          .order('position', { ascending: false })
          .limit(1);
          
        if (existingGroups && existingGroups.length > 0) {
          position = (existingGroups[0].position || 0) + 1;
        }
      }

      const taskGroupInsert = {
        name: taskGroupData.name,
        description: taskGroupData.description || null,
        project_id: taskGroupData.projectId || null,
        color: taskGroupData.color || null,
        position: taskGroupData.position !== undefined ? taskGroupData.position : position,
        user_id: userId
      };
      
      const { data, error } = await supabase
        .from('task_groups')
        .insert(taskGroupInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating task group:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { 
        data: mapApiTaskGroupToTaskGroup(data as APITaskGroup), 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error creating task group:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async updateTaskGroup(taskGroupUpdate: UpdateTaskGroupDTO): Promise<ServiceResult<TaskGroup>> {
    try {
      // Use Record<string, any> to avoid TypeScript property checking
      const taskGroupUpdateData: Record<string, any> = {
        id: taskGroupUpdate.id
      };
      
      if (taskGroupUpdate.name !== undefined) taskGroupUpdateData.name = taskGroupUpdate.name;
      if (taskGroupUpdate.description !== undefined) taskGroupUpdateData.description = taskGroupUpdate.description || null;
      if (taskGroupUpdate.projectId !== undefined) taskGroupUpdateData.project_id = taskGroupUpdate.projectId || null;
      if (taskGroupUpdate.color !== undefined) taskGroupUpdateData.color = taskGroupUpdate.color || null;
      if (taskGroupUpdate.position !== undefined) taskGroupUpdateData.position = taskGroupUpdate.position;
      taskGroupUpdateData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('task_groups')
        .update(taskGroupUpdateData)
        .eq('id', taskGroupUpdate.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task group:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { 
        data: mapApiTaskGroupToTaskGroup(data as APITaskGroup), 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error updating task group:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async deleteTaskGroup(id: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from('task_groups')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task group:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error deleting task group:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async updateTaskPositions(tasks: { id: string; position: number }[]): Promise<ServiceResult<void>> {
    try {
      // Use a transaction to update all task positions
      const updatePromises = tasks.map(task => 
        supabase
          .from('tasks')
          .update({ position: task.position })
          .eq('id', task.id)
      );
      
      await Promise.all(updatePromises);
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error updating task positions:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  subscribeToTaskGroups(callback: (taskGroups: TaskGroup[]) => void): (() => void) {
    const channel = supabase
      .channel('public:task_groups')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'task_groups' }, 
        async () => {
          try {
            const result = await this.fetchTaskGroups();
            if (result.data) {
              callback(result.data);
            } else if (result.error) {
              console.error('Error refreshing task groups after changes:', result.error);
            }
          } catch (error) {
            console.error('Error in subscription callback:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
