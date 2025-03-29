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
  UpdateCommentDTO
} from '@/types/task';
import { TaskService } from '@/services/taskService';
import { toast } from '@/hooks/use-toast';

export interface TaskSlice {
  // State
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  
  // Task CRUD operations
  fetchTasks: () => Promise<Task[]>;
  createTask: (taskData: CreateTaskDTO) => Promise<Task>;
  updateTask: (taskUpdate: UpdateTaskDTO) => Promise<Task>;
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
}

export const createTaskSlice: StateCreator<
  TaskSlice & { filteredTasks: Task[] },
  [],
  [],
  TaskSlice
> = (set, get) => ({
  // State
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  
  // Task CRUD operations
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.fetchTasks();
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task data returned');
      }
      
      set({ tasks: result.data, isLoading: false });
      return result.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
      
      // Update the current task if applicable
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
      
      // Update the current task if applicable
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
  }
});
