
import { StateCreator } from 'zustand';
import { 
  Task, 
  CreateTaskDTO, 
  UpdateTaskDTO,
  TaskStatus,
  TaskFilters,
  ActivityItem,
  Subtask,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  Comment,
  CreateCommentDTO,
  UpdateCommentDTO,
  APITask
} from '@/types/task';
import { TaskService } from '@/services/taskService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mapApiTaskToTask } from '@/utils/task';

export interface TaskSlice {
  // State
  tasks: Task[];
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
  currentTask: Task | null; // Add currentTask to the interface
  
  // Task CRUD operations
  fetchTasks: () => Promise<Task[]>;
  fetchTasksByProject: (projectId: string) => Promise<Task[]>;
  createTask: (taskData: CreateTaskDTO) => Promise<Task | null>;
  updateTask: (taskUpdate: UpdateTaskDTO) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  
  // Subtask operations
  fetchSubtasks: (taskId: string) => Promise<Subtask[]>;
  createSubtask: (subtaskData: CreateSubtaskDTO) => Promise<Subtask>;
  updateSubtask: (subtaskUpdate: UpdateSubtaskDTO) => Promise<Subtask>;
  deleteSubtask: (id: string) => Promise<void>;
  
  // Comment operations
  fetchComments: (taskId: string) => Promise<Comment[]>;
  createComment: (commentData: CreateCommentDTO) => Promise<Comment>;
  updateComment: (commentUpdate: UpdateCommentDTO) => Promise<Comment>;
  deleteComment: (id: string) => Promise<void>;
  
  // Activity operations
  fetchActivities: (taskId: string) => Promise<ActivityItem[]>;
  
  // Single task fetching
  fetchTask: (taskId: string) => Promise<Task | undefined>;
}

export const createTaskSlice: StateCreator<
  TaskSlice, 
  [], 
  [],
  TaskSlice
> = (set, get) => ({
  // State
  tasks: [],
  filters: {
    status: null, // Use null instead of TaskStatus.All
    project: null,
    search: ''
  },
  isLoading: false,
  error: null,
  currentTask: null, // Initialize currentTask as null
  
  // Task CRUD operations
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log("TaskSlice.fetchTasks(): Starting fetch");
      const result = await TaskService.fetchTasks();
      
      if (result.error) {
        console.error("Error in fetchTasks:", result.error);
        throw result.error;
      }
      
      // Make sure we have an array of tasks even if data is null or undefined
      const tasks = result.data || [];
      console.log(`TaskSlice.fetchTasks(): Received ${tasks.length} tasks`);
      
      set({ tasks, isLoading: false });
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      return [];
    }
  },
  
  fetchTasksByProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log("TaskSlice.fetchTasksByProject(): Starting fetch");
      const result = await TaskService.fetchTasksByProject(projectId);
      
      if (result.error) {
        console.error("Error in fetchTasksByProject:", result.error);
        throw result.error;
      }
      
      // Make sure we have an array of tasks even if data is null or undefined
      const tasks = result.data || [];
      console.log(`TaskSlice.fetchTasksByProject(): Received ${tasks.length} tasks`);
      
      set({ tasks, isLoading: false });
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      return [];
    }
  },
  
  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.createTask(taskData);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task data returned');
      }
      
      set(state => ({
        tasks: [result.data!, ...state.tasks],
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error creating task:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      throw error;
    }
  },
  
  updateTask: async (taskUpdate) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.updateTask(taskUpdate);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task data returned');
      }
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskUpdate.id ? result.data! : task
        ),
        currentTask: state.currentTask?.id === taskUpdate.id 
          ? result.data 
          : state.currentTask,
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating task:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      throw error;
    }
  },
  
  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.deleteTask(id);
      
      if (result.error) {
        throw result.error;
      }
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      throw error;
    }
  },
  
  setCurrentTask: (task) => {
    set({ currentTask: task });
  },
  
  // Subtasks operations
  fetchSubtasks: async (taskId) => {
    try {
      const result = await TaskService.fetchSubtasks(taskId);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No subtask data returned');
      }
      
      // Update the current task if applicable
      set(state => {
        if (state.currentTask && state.currentTask.id === taskId) {
          return {
            currentTask: {
              ...state.currentTask,
              subtasks: result.data
            }
          };
        }
        
        return {};
      });
      
      return result.data;
    } catch (error) {
      console.error('Error fetching subtasks:', error);
      throw error;
    }
  },
  
  createSubtask: async (subtaskData) => {
    try {
      const result = await TaskService.createSubtask(subtaskData);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No subtask data returned');
      }
      
      // Update the current task if applicable
      set(state => {
        if (state.currentTask && state.currentTask.id === subtaskData.taskId) {
          const currentSubtasks = state.currentTask.subtasks || [];
          
          return {
            currentTask: {
              ...state.currentTask,
              subtasks: [...currentSubtasks, result.data!]
            }
          };
        }
        
        return {};
      });
      
      return result.data;
    } catch (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  },
  
  updateSubtask: async (subtaskUpdate) => {
    try {
      const result = await TaskService.updateSubtask(subtaskUpdate);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No subtask data returned');
      }
      
      // Update the current task if applicable
      set(state => {
        if (state.currentTask && state.currentTask.subtasks) {
          const updatedSubtasks = state.currentTask.subtasks.map(subtask => 
            subtask.id === subtaskUpdate.id ? result.data! : subtask
          );
          
          return {
            currentTask: {
              ...state.currentTask,
              subtasks: updatedSubtasks
            }
          };
        }
        
        return {};
      });
      
      return result.data;
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  },
  
  deleteSubtask: async (id) => {
    try {
      const result = await TaskService.deleteSubtask(id);
      
      if (result.error) {
        throw result.error;
      }
      
      // Update the current task if applicable
      set(state => {
        if (state.currentTask && state.currentTask.subtasks) {
          const updatedSubtasks = state.currentTask.subtasks.filter(
            subtask => subtask.id !== id
          );
          
          return {
            currentTask: {
              ...state.currentTask,
              subtasks: updatedSubtasks
            }
          };
        }
        
        return {};
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  },
  
  // Comment operations
  fetchComments: async (taskId) => {
    try {
      const result = await TaskService.fetchComments(taskId);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No comment data returned');
      }
      
      // Update the current task if applicable
      set(state => {
        if (state.currentTask && state.currentTask.id === taskId) {
          return {
            currentTask: {
              ...state.currentTask,
              comments: result.data
            }
          };
        }
        
        return {};
      });
      
      return result.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },
  
  createComment: async (commentData) => {
    try {
      const result = await TaskService.createComment(commentData);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No comment data returned');
      }
      
      // Update the current task if applicable in an immutable way
      set(state => {
        if (state.currentTask && state.currentTask.id === commentData.taskId) {
          const currentComments = state.currentTask.comments || [];
          
          return {
            currentTask: {
              ...state.currentTask,
              comments: [...currentComments, result.data!]
            }
          };
        }
        
        return {};
      });
      
      return result.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },
  
  updateComment: async (commentUpdate) => {
    try {
      const result = await TaskService.updateComment(commentUpdate);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No comment data returned');
      }
      
      // Update the current task if applicable
      set(state => {
        if (state.currentTask && state.currentTask.comments) {
          const updatedComments = state.currentTask.comments.map(comment => 
            comment.id === commentUpdate.id ? result.data! : comment
          );
          
          return {
            currentTask: {
              ...state.currentTask,
              comments: updatedComments
            }
          };
        }
        
        return {};
      });
      
      return result.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },
  
  deleteComment: async (id) => {
    try {
      const result = await TaskService.deleteComment(id);
      
      if (result.error) {
        throw result.error;
      }
      
      // Update the current task if applicable
      set(state => {
        if (state.currentTask && state.currentTask.comments) {
          const updatedComments = state.currentTask.comments.filter(
            comment => comment.id !== id
          );
          
          return {
            currentTask: {
              ...state.currentTask,
              comments: updatedComments
            }
          };
        }
        
        return {};
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },
  
  // Activity operations
  fetchActivities: async (taskId) => {
    try {
      const result = await TaskService.fetchActivities(taskId);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No activity data returned');
      }
      
      // Update the current task if applicable in an immutable way
      set(state => {
        if (state.currentTask && state.currentTask.id === taskId) {
          return {
            currentTask: {
              ...state.currentTask,
              activities: result.data
            }
          };
        }
        
        return {};
      });
      
      return result.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },
  
  setTaskStatus: async (taskId, status) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.updateTask({
        id: taskId,
        status: status
      });
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task data returned');
      }
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? result.data! : task
        ),
        currentTask: state.currentTask?.id === taskId 
          ? result.data 
          : state.currentTask,
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      throw error;
    }
  },
  
  toggleSubtaskCompletion: async (subtaskId, completed) => {
    try {
      const result = await TaskService.updateSubtask({
        id: subtaskId,
        completed
      });
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No subtask data returned');
      }
      
      // Update the current task if applicable
      set(state => {
        if (state.currentTask && state.currentTask.subtasks) {
          const updatedSubtasks = state.currentTask.subtasks.map(subtask => 
            subtask.id === subtaskId ? result.data! : subtask
          );
          
          return {
            currentTask: {
              ...state.currentTask,
              subtasks: updatedSubtasks
            }
          };
        }
        
        return {};
      });
      
      return result.data;
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      throw error;
    }
  },
  
  // Single task fetching
  fetchTask: async (taskId: string): Promise<Task | undefined> => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (!data) {
        set({ isLoading: false });
        return undefined;
      }
      
      const task = mapApiTaskToTask(data as unknown as APITask);
      
      // Update the task in the store, maintaining other tasks
      set(state => {
        const updatedTasks = state.tasks.map(t => 
          t.id === taskId ? task : t
        );
        
        // If task wasn't in the store, add it
        if (!state.tasks.some(t => t.id === taskId)) {
          updatedTasks.push(task);
        }
        
        return { 
          tasks: updatedTasks,
          currentTask: task,
          isLoading: false 
        };
      });
      
      return task;
    } catch (error) {
      console.error('Error fetching task:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch task' 
      });
      return undefined;
    }
  }
});
