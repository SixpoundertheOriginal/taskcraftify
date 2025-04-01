import { supabase } from '@/integrations/supabase/client';
import { 
  TaskGroup, 
  CreateTaskGroupDTO, 
  UpdateTaskGroupDTO, 
  APITaskGroup, 
  mapApiTaskGroupToTaskGroup, 
  mapTaskGroupToApiTaskGroup 
} from '@/types/taskGroup';
import { Task, mapApiTaskToTask } from '@/types/task';

interface ServiceResult<T> {
  data?: T;
  error?: Error;
}

export const TaskGroupService = {
  async fetchTaskGroups(projectId?: string): Promise<ServiceResult<TaskGroup[]>> {
    try {
      // Get the user's ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        return {
          error: new Error('User not authenticated')
        };
      }

      let query = supabase
        .from('task_groups')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });
        
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching task groups:', error);
        return { error: new Error(error.message) };
      }

      if (!data) {
        return { data: [] };
      }

      const taskGroups = (data as unknown as APITaskGroup[]).map(apiGroup => 
        mapApiTaskGroupToTaskGroup(apiGroup)
      );

      return { data: taskGroups };
    } catch (error) {
      console.error('Error in fetchTaskGroups:', error);
      return {
        error: error instanceof Error 
          ? error 
          : new Error('An unknown error occurred while fetching task groups')
      };
    }
  },

  async createTaskGroup(taskGroupData: CreateTaskGroupDTO): Promise<ServiceResult<TaskGroup>> {
    try {
      // Get the user's ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        return {
          error: new Error('User not authenticated')
        };
      }

      // Get current highest position
      const { data: positionData, error: positionError } = await supabase
        .from('task_groups')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) {
        console.error('Error getting highest position:', positionError);
        return { error: new Error(positionError.message) };
      }

      const highestPosition = positionData && positionData.length > 0 ? positionData[0].position : -1;
      const newPosition = taskGroupData.position !== undefined ? taskGroupData.position : highestPosition + 1;

      // Map to API format - ensuring required fields are present
      const apiTaskGroup = mapTaskGroupToApiTaskGroup({
        ...taskGroupData,
        position: newPosition
      }, userId);

      // Ensure name is present as it's required
      if (!apiTaskGroup.name) {
        return { error: new Error('Task group name is required') };
      }

      // Insert a single object
      const { data, error } = await supabase
        .from('task_groups')
        .insert(apiTaskGroup)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating task group:', error);
        return { error: new Error(error.message) };
      }

      if (!data) {
        return { error: new Error('No data returned from create operation') };
      }

      const taskGroup = mapApiTaskGroupToTaskGroup(data as unknown as APITaskGroup);
      return { data: taskGroup };
    } catch (error) {
      console.error('Error in createTaskGroup:', error);
      return {
        error: error instanceof Error 
          ? error 
          : new Error('An unknown error occurred while creating task group')
      };
    }
  },

  async updateTaskGroup(taskGroupUpdate: UpdateTaskGroupDTO): Promise<ServiceResult<TaskGroup>> {
    try {
      // Get the user's ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        return {
          error: new Error('User not authenticated')
        };
      }

      const apiTaskGroup = mapTaskGroupToApiTaskGroup(taskGroupUpdate);

      const { data, error } = await supabase
        .from('task_groups')
        .update(apiTaskGroup)
        .eq('id', taskGroupUpdate.id)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating task group:', error);
        return { error: new Error(error.message) };
      }

      if (!data) {
        return { error: new Error('No data returned from update operation') };
      }

      const taskGroup = mapApiTaskGroupToTaskGroup(data as unknown as APITaskGroup);
      return { data: taskGroup };
    } catch (error) {
      console.error('Error in updateTaskGroup:', error);
      return {
        error: error instanceof Error 
          ? error 
          : new Error('An unknown error occurred while updating task group')
      };
    }
  },

  async deleteTaskGroup(id: string): Promise<ServiceResult<void>> {
    try {
      // Get the user's ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        return {
          error: new Error('User not authenticated')
        };
      }

      const { error } = await supabase
        .from('task_groups')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting task group:', error);
        return { error: new Error(error.message) };
      }

      return {};
    } catch (error) {
      console.error('Error in deleteTaskGroup:', error);
      return {
        error: error instanceof Error 
          ? error 
          : new Error('An unknown error occurred while deleting task group')
      };
    }
  },

  async getTasksInGroup(groupId: string): Promise<ServiceResult<Task[]>> {
    try {
      // Get the user's ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        return {
          error: new Error('User not authenticated')
        };
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('task_group_id', groupId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching tasks in group:', error);
        return { error: new Error(error.message) };
      }

      if (!data) {
        return { data: [] };
      }

      // Map the API tasks to our Task interface
      const tasks = data.map(apiTask => mapApiTaskToTask({
        ...apiTask,
        task_group_id: apiTask.task_group_id || null,
        position: apiTask.position || 0
      }));
      
      return { data: tasks };
    } catch (error) {
      console.error('Error in getTasksInGroup:', error);
      return {
        error: error instanceof Error 
          ? error 
          : new Error('An unknown error occurred while fetching tasks in group')
      };
    }
  },

  async updateTaskPositions(taskUpdates: { id: string; position: number; taskGroupId?: string }[]): Promise<ServiceResult<void>> {
    try {
      // Get the user's ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        return {
          error: new Error('User not authenticated')
        };
      }

      // We need to perform updates one by one to ensure atomicity
      for (const update of taskUpdates) {
        const { error } = await supabase
          .from('tasks')
          .update({
            position: update.position,
            task_group_id: update.taskGroupId || null
          })
          .eq('id', update.id)
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating task position:', error);
          return { error: new Error(error.message) };
        }
      }

      return {};
    } catch (error) {
      console.error('Error in updateTaskPositions:', error);
      return {
        error: error instanceof Error 
          ? error 
          : new Error('An unknown error occurred while updating task positions')
      };
    }
  }
};
