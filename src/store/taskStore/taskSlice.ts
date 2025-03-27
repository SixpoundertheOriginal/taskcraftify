import { StateCreator } from 'zustand';
import { TaskService } from '@/services/taskService';
import { 
  Task, 
  TaskStatus, 
  Subtask, 
  Comment, 
  ActivityItem,
  CreateSubtaskDTO,
  UpdateSubtaskDTO,
  CreateCommentDTO,
  UpdateCommentDTO
} from '@/types/task';
import { toast } from '@/hooks/use-toast';

export interface TaskSlice {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Task operations
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (task: Partial<Task> & { id: string }) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  setTaskStatus: (id: string, status: Task['status']) => Promise<Task>;
  
  // Subtask operations
  fetchSubtasks: (taskId: string) => Promise<Subtask[]>;
  createSubtask: (subtask: CreateSubtaskDTO) => Promise<Subtask>;
  updateSubtask: (subtask: UpdateSubtaskDTO) => Promise<Subtask>;
  deleteSubtask: (id: string) => Promise<void>;
  toggleSubtaskCompletion: (id: string, completed: boolean) => Promise<Subtask>;
  
  // Comment operations
  fetchComments: (taskId: string) => Promise<Comment[]>;
  createComment: (comment: CreateCommentDTO) => Promise<Comment>;
  updateComment: (comment: UpdateCommentDTO) => Promise<Comment>;
  deleteComment: (id: string) => Promise<void>;
  
  // Activity operations
  fetchActivities: (taskId: string) => Promise<ActivityItem[]>;
  
  // Utility functions
  refreshTaskCounts: () => void;
  diagnosticDatabaseQuery: () => Promise<void>;
}

export const createTaskSlice: StateCreator<TaskSlice, [], [], TaskSlice> = (set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  
  // Task operations
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.fetchTasks();
      if (result.error) {
        throw result.error;
      }
      
      console.log(`Fetched ${result.data?.length || 0} tasks:`, result.data);
      
      // Group tasks by projectId
      const tasksByProject: Record<string, number> = {};
      result.data?.forEach(task => {
        const projectId = task.projectId || 'none';
        tasksByProject[projectId] = (tasksByProject[projectId] || 0) + 1;
      });
      
      console.log('Task counts by project:', tasksByProject);
      
      set({ tasks: result.data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks', 
        isLoading: false 
      });
    }
  },
  
  createTask: async (task) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Creating task with data:', task);
      const result = await TaskService.createTask(task);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task returned from creation');
      }
      
      console.log('Task created successfully:', result.data);
      console.log('Task projectId:', result.data.projectId);
      
      set((state) => ({ 
        tasks: [...state.tasks, result.data!],
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error creating task:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateTask: async (task) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Updating task with data:', task);
      const result = await TaskService.updateTask(task);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task returned from update');
      }
      
      console.log('Task updated successfully:', result.data);
      console.log('Updated task projectId:', result.data.projectId);
      
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? result.data! : t)),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating task:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  setTaskStatus: async (id, status) => {
    // This is a convenience method that calls updateTask with just the status change
    return get().updateTask({ id, status });
  },
  
  // Subtask operations
  fetchSubtasks: async (taskId: string) => {
    try {
      const result = await TaskService.fetchSubtasks(taskId);
      if (result.error) {
        throw result.error;
      }
      
      // Update the task with its subtasks
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId 
            ? { ...task, subtasks: result.data || [] } 
            : task
        )
      }));
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching subtasks:', error);
      toast({
        title: "Failed to fetch subtasks",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return [];
    }
  },
  
  createSubtask: async (subtaskData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.createSubtask(subtaskData);
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No subtask returned from creation');
      }
      
      // Add the subtask to the task
      set(state => ({
        tasks: state.tasks.map(task => {
          if (task.id === subtaskData.taskId) {
            const subtasks = task.subtasks || [];
            return {
              ...task,
              subtasks: [...subtasks, result.data!]
            };
          }
          return task;
        }),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error creating subtask:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create subtask', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateSubtask: async (subtaskData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.updateSubtask(subtaskData);
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No subtask returned from update');
      }
      
      // Update the subtask in the task
      set(state => ({
        tasks: state.tasks.map(task => {
          if (task.subtasks?.some(subtask => subtask.id === subtaskData.id)) {
            return {
              ...task,
              subtasks: task.subtasks.map(subtask => 
                subtask.id === subtaskData.id ? result.data! : subtask
              )
            };
          }
          return task;
        }),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating subtask:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update subtask', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteSubtask: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.deleteSubtask(id);
      if (result.error) {
        throw result.error;
      }
      
      // Remove the subtask from the task
      set(state => ({
        tasks: state.tasks.map(task => {
          if (task.subtasks?.some(subtask => subtask.id === id)) {
            return {
              ...task,
              subtasks: task.subtasks.filter(subtask => subtask.id !== id)
            };
          }
          return task;
        }),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting subtask:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete subtask', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  toggleSubtaskCompletion: async (id, completed) => {
    return get().updateSubtask({ id, completed });
  },
  
  // Comment operations
  fetchComments: async (taskId) => {
    try {
      const result = await TaskService.fetchComments(taskId);
      if (result.error) {
        throw result.error;
      }
      
      // Update the task with its comments
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId 
            ? { ...task, comments: result.data || [] } 
            : task
        )
      }));
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Failed to fetch comments",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return [];
    }
  },
  
  createComment: async (commentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.createComment(commentData);
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No comment returned from creation');
      }
      
      // Add the comment to the task
      set(state => ({
        tasks: state.tasks.map(task => {
          if (task.id === commentData.taskId) {
            const comments = task.comments || [];
            return {
              ...task,
              comments: [...comments, result.data!]
            };
          }
          return task;
        }),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create comment', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateComment: async (commentData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.updateComment(commentData);
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No comment returned from update');
      }
      
      // Update the comment in the task
      set(state => ({
        tasks: state.tasks.map(task => {
          if (task.comments?.some(comment => comment.id === commentData.id)) {
            return {
              ...task,
              comments: task.comments.map(comment => 
                comment.id === commentData.id ? result.data! : comment
              )
            };
          }
          return task;
        }),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update comment', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteComment: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.deleteComment(id);
      if (result.error) {
        throw result.error;
      }
      
      // Remove the comment from the task
      set(state => ({
        tasks: state.tasks.map(task => {
          if (task.comments?.some(comment => comment.id === id)) {
            return {
              ...task,
              comments: task.comments.filter(comment => comment.id !== id)
            };
          }
          return task;
        }),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete comment', 
        isLoading: false 
      });
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
      
      // Update the task with its activities
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId 
            ? { ...task, activities: result.data || [] } 
            : task
        )
      }));
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Failed to fetch activity history",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return [];
    }
  },
  
  // Utility functions
  refreshTaskCounts: () => {
    // Force a complete refresh by re-fetching all tasks
    const refreshTasks = async () => {
      console.log('----------------------------------------');
      console.log('DETAILED TASK COUNT REFRESH DIAGNOSTICS:');
      console.log('----------------------------------------');
      
      try {
        console.log('1. Fetching all tasks from database...');
        const result = await TaskService.fetchTasks();
        if (result.error) {
          throw result.error;
        }
        
        const tasks = result.data || [];
        console.log(`2. Successfully fetched ${tasks.length} tasks for counting`);
        
        // Log raw task data to inspect projectId values
        console.log('3. RAW TASK DATA FROM DATABASE:');
        tasks.forEach((task, index) => {
          console.log(`Task ${index + 1}:`, {
            id: task.id,
            title: task.title,
            status: task.status,
            projectId: task.projectId === undefined ? 'undefined' : 
                       task.projectId === null ? 'null' : 
                       task.projectId === '' ? 'empty string' : task.projectId,
            rawProjectId: task.projectId, // Raw value for comparison
          });
        });
        
        // Analyze task distribution by project (using more detailed approach)
        console.log('4. TASK DISTRIBUTION BY PROJECT:');
        const tasksByProject: Record<string, Task[]> = {};
        
        // Initialize with empty arrays for all projects and "none"
        tasksByProject["none"] = [];
        
        // Group tasks by project
        tasks.forEach(task => {
          const projectId = task.projectId || 'none';
          if (!tasksByProject[projectId]) {
            tasksByProject[projectId] = [];
          }
          tasksByProject[projectId].push(task);
        });
        
        // Log count information
        console.log('5. PROJECT TASK COUNTS:');
        Object.entries(tasksByProject).forEach(([projectId, projectTasks]) => {
          console.log(`Project "${projectId}": ${projectTasks.length} tasks`);
          if (projectTasks.length > 0) {
            console.log(`  Sample task from project "${projectId}":`, {
              id: projectTasks[0].id,
              title: projectTasks[0].title,
              projectId: projectTasks[0].projectId,
              projectIdType: typeof projectTasks[0].projectId
            });
          }
        });
        
        // Log current state before update
        console.log('6. CURRENT STATE BEFORE UPDATE:');
        console.log('Current task count in store:', get().tasks.length);
        
        // Force a state update by creating a new tasks array
        console.log('7. UPDATING STORE STATE WITH NEW TASK DATA');
        set({ tasks: [...tasks] });
        
        console.log('----------------------------------------');
        console.log('TASK COUNT REFRESH COMPLETED');
        console.log('----------------------------------------');
        
        toast({
          title: "Task counts refreshed",
          description: `Updated counts for ${tasks.length} tasks`,
        });
      } catch (error) {
        console.error('Error refreshing task counts:', error);
        toast({
          title: "Failed to refresh counts",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive"
        });
      }
    };
    
    // Execute the refresh
    refreshTasks();
  },
  
  diagnosticDatabaseQuery: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskService.directQueryTaskCounts();
      if (result.error) {
        throw result.error;
      }
      
      if (result.data) {
        const { totalCount, noProjectCount, projectCounts } = result.data;
        
        toast({
          title: "Database Query Results",
          description: `Total: ${totalCount}, No Project: ${noProjectCount}`,
        });
        
        // After diagnostics, refresh the UI with the latest data
        const tasksResult = await TaskService.fetchTasks();
        if (tasksResult.error) {
          throw tasksResult.error;
        }
        
        set({ 
          tasks: tasksResult.data || [], 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error in diagnostic database query:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to query database', 
        isLoading: false 
      });
      
      toast({
        title: "Database Query Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  }
});
