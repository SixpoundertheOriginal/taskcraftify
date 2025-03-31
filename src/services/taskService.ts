import { supabase } from '@/integrations/supabase/client';
import { 
  Task, 
  CreateTaskDTO, 
  UpdateTaskDTO,
  APITask,
  mapApiTaskToTask,
  Subtask,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  Comment,
  CreateCommentDTO,
  UpdateCommentDTO,
  ActivityItem,
  APIActivity
} from '@/types/task';
import { parseISO } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type TaskPriorityDB = Database['public']['Enums']['task_priority'];
type TaskStatusDB = Database['public']['Enums']['task_status'];

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

const debugTaskDateMapping = (apiTask: APITask, mappedTask: Task) => {
  console.log(`Task mapping debug for "${apiTask.title}" (${apiTask.id}):`);
  console.log(`  Raw due_date from API: ${apiTask.due_date} (${typeof apiTask.due_date})`);
  
  if (mappedTask.dueDate) {
    console.log(`  Mapped dueDate: ${mappedTask.dueDate.toISOString()} (${typeof mappedTask.dueDate})`);
  } else {
    console.log(`  Mapped dueDate: undefined`);
  }
  
  if (apiTask.due_date) {
    try {
      const parsedDate = parseISO(apiTask.due_date);
      console.log(`  Parsed due_date: ${parsedDate.toISOString()}`);
    } catch (e) {
      console.error(`  Error parsing due_date: ${e}`);
    }
  }
  
  return mappedTask;
};

export const TaskService = {
  async fetchTasks(): Promise<ServiceResult<Task[]>> {
    try {
      console.log("TaskService.fetchTasks(): Starting task fetch");
      
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
          project_id_value: task.project_id === null ? 'null' : task.project_id,
          due_date: task.due_date,
          due_date_type: typeof task.due_date
        }))
      );
      
      const mappedTasks = Array.isArray(data) ? (data as APITask[]).map(apiTask => {
        const task = mapApiTaskToTask(apiTask);
        return debugTaskDateMapping(apiTask, task);
      }) : [];
      
      console.log(`Fetched ${mappedTasks.length} tasks`);
      
      // Enhanced debugging: Log mapped tasks with better type information
      console.log('Mapped tasks with projectId and dueDate values:', 
        mappedTasks.map(t => ({ 
          id: t.id, 
          title: t.title, 
          projectId: t.projectId === undefined ? 'undefined' : 
                    t.projectId === null ? 'null' : t.projectId,
          projectIdType: typeof t.projectId,
          dueDate: t.dueDate,
          dueDateType: typeof t.dueDate
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
      const taskUpdateData: TaskUpdate = {
        id: taskUpdate.id
      };
      
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
      
      const { count: totalCount, error: totalError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });
        
      if (totalError) {
        throw new Error(`Error getting total task count: ${totalError.message}`);
      }
      
      const totalTaskCount = totalCount || 0;
      console.log(`1. Total tasks in database: ${totalTaskCount}`);
      
      const { count: noProjectCount, error: noProjectError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .is('project_id', null);
        
      if (noProjectError) {
        throw new Error(`Error getting no-project task count: ${noProjectError.message}`);
      }
      
      const noProjectTaskCount = noProjectCount || 0;
      console.log(`2. Tasks with no project: ${noProjectTaskCount}`);
      
      const { data: projectData, error: projectError } = await supabase
        .from('tasks')
        .select('project_id');
        
      if (projectError) {
        throw new Error(`Error getting project task counts: ${projectError.message}`);
      }
      
      const projectCounts: Record<string, number> = {};
      projectData?.forEach(row => {
        const projectId = row.project_id || 'null';
        projectCounts[projectId] = (projectCounts[projectId] || 0) + 1;
      });
      
      console.log('3. Tasks by project_id:');
      Object.entries(projectCounts).forEach(([projectId, count]) => {
        console.log(`   Project "${projectId}": ${count} tasks`);
      });
      
      const { data: rawTasks, error: rawError } = await supabase
        .from('tasks')
        .select('id, title, project_id')
        .limit(20);
        
      if (rawError) {
        console.error('Error fetching raw task data:', rawError);
      } else {
        console.log('4. Sample of raw task data from database:');
        rawTasks?.forEach((task, index) => {
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
  },

  async fetchSubtasks(taskId: string): Promise<ServiceResult<Subtask[]>> {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching subtasks:', error);
        return { data: null, error: new Error(error.message) };
      }

      const subtasks: Subtask[] = data.map(item => ({
        id: item.id,
        taskId: item.task_id,
        title: item.title,
        completed: item.completed,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));

      return { data: subtasks, error: null };
    } catch (error) {
      console.error('Unexpected error fetching subtasks:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  },

  async createSubtask(subtaskData: CreateSubtaskDTO): Promise<ServiceResult<Subtask>> {
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

      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: subtaskData.taskId,
          title: subtaskData.title,
          completed: false,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subtask:', error);
        return { data: null, error: new Error(error.message) };
      }

      await this.createActivityLog({
        taskId: subtaskData.taskId,
        type: 'subtask_added',
        description: `Added subtask: ${subtaskData.title}`
      });

      const subtask: Subtask = {
        id: data.id,
        taskId: data.task_id,
        title: data.title,
        completed: data.completed,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { data: subtask, error: null };
    } catch (error) {
      console.error('Unexpected error creating subtask:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async updateSubtask(subtaskUpdate: UpdateSubtaskDTO): Promise<ServiceResult<Subtask>> {
    try {
      const updateData: any = { id: subtaskUpdate.id };
      
      if (subtaskUpdate.title !== undefined) updateData.title = subtaskUpdate.title;
      if (subtaskUpdate.completed !== undefined) updateData.completed = subtaskUpdate.completed;

      const { data, error } = await supabase
        .from('subtasks')
        .update(updateData)
        .eq('id', subtaskUpdate.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating subtask:', error);
        return { data: null, error: new Error(error.message) };
      }

      const { data: subtaskData } = await supabase
        .from('subtasks')
        .select('task_id')
        .eq('id', subtaskUpdate.id)
        .single();

      if (subtaskData && subtaskUpdate.completed !== undefined) {
        await this.createActivityLog({
          taskId: subtaskData.task_id,
          type: 'subtask_completed',
          description: `${subtaskUpdate.completed ? 'Completed' : 'Reopened'} subtask: ${data.title}`
        });
      } else if (subtaskData && subtaskUpdate.title !== undefined) {
        await this.createActivityLog({
          taskId: subtaskData.task_id,
          type: 'subtask_edited',
          description: `Updated subtask: ${data.title}`
        });
      }

      const subtask: Subtask = {
        id: data.id,
        taskId: data.task_id,
        title: data.title,
        completed: data.completed,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { data: subtask, error: null };
    } catch (error) {
      console.error('Unexpected error updating subtask:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async deleteSubtask(id: string): Promise<ServiceResult<void>> {
    try {
      const { data: subtaskData } = await supabase
        .from('subtasks')
        .select('task_id, title')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting subtask:', error);
        return { data: null, error: new Error(error.message) };
      }

      if (subtaskData) {
        await this.createActivityLog({
          taskId: subtaskData.task_id,
          type: 'subtask_deleted',
          description: `Deleted subtask: ${subtaskData.title}`
        });
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error deleting subtask:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async fetchComments(taskId: string): Promise<ServiceResult<Comment[]>> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return { data: null, error: new Error(error.message) };
      }

      const comments: Comment[] = data.map(item => ({
        id: item.id,
        taskId: item.task_id,
        content: item.content,
        createdBy: item.created_by,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        edited: item.edited
      }));

      return { data: comments, error: null };
    } catch (error) {
      console.error('Unexpected error fetching comments:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  },

  async createComment(commentData: CreateCommentDTO): Promise<ServiceResult<Comment>> {
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

      const { data, error } = await supabase
        .from('comments')
        .insert({
          task_id: commentData.taskId,
          content: commentData.content,
          created_by: userId,
          edited: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        return { data: null, error: new Error(error.message) };
      }

      await this.createActivityLog({
        taskId: commentData.taskId,
        type: 'comment_added',
        description: `Added a comment`
      });

      const comment: Comment = {
        id: data.id,
        taskId: data.task_id,
        content: data.content,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        edited: data.edited
      };

      return { data: comment, error: null };
    } catch (error) {
      console.error('Unexpected error creating comment:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async updateComment(commentUpdate: UpdateCommentDTO): Promise<ServiceResult<Comment>> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: commentUpdate.content,
          edited: true
        })
        .eq('id', commentUpdate.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating comment:', error);
        return { data: null, error: new Error(error.message) };
      }

      await this.createActivityLog({
        taskId: data.task_id,
        type: 'comment_edited',
        description: `Edited a comment`
      });

      const comment: Comment = {
        id: data.id,
        taskId: data.task_id,
        content: data.content,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        edited: data.edited
      };

      return { data: comment, error: null };
    } catch (error) {
      console.error('Unexpected error updating comment:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async deleteComment(id: string): Promise<ServiceResult<void>> {
    try {
      const { data: commentData } = await supabase
        .from('comments')
        .select('task_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting comment:', error);
        return { data: null, error: new Error(error.message) };
      }

      if (commentData) {
        await this.createActivityLog({
          taskId: commentData.task_id,
          type: 'comment_deleted',
          description: `Deleted a comment`
        });
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error deleting comment:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async fetchActivities(taskId: string): Promise<ServiceResult<ActivityItem[]>> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        return { data: null, error: new Error(error.message) };
      }

      const activities: ActivityItem[] = data.map(item => ({
        id: item.id,
        taskId: item.task_id,
        type: item.type as ActivityItem['type'],
        description: item.description,
        createdAt: new Date(item.created_at),
        createdBy: item.created_by,
        metadata: item.metadata as Record<string, any> | null
      }));

      return { data: activities, error: null };
    } catch (error) {
      console.error('Unexpected error fetching activities:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  },

  async createActivityLog({
    taskId,
    type,
    description,
    metadata
  }: {
    taskId: string;
    type: ActivityItem['type'];
    description: string;
    metadata?: Record<string, any> | null;
  }): Promise<ServiceResult<ActivityItem>> {
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

      const { data, error } = await supabase
        .from('activities')
        .insert({
          task_id: taskId,
          type,
          description,
          created_by: userId,
          metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating activity log:', error);
        return { data: null, error: new Error(error.message) };
      }

      const activity: ActivityItem = {
        id: data.id,
        taskId: data.task_id,
        type: data.type as ActivityItem['type'],
        description: data.description,
        createdAt: new Date(data.created_at),
        createdBy: data.created_by,
        metadata: data.metadata as Record<string, any> | null
      };

      return { data: activity, error: null };
    } catch (error) {
      console.error('Unexpected error creating activity log:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
};
