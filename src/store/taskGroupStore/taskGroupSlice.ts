import { StateCreator } from 'zustand';
import { 
  TaskGroup, 
  CreateTaskGroupDTO, 
  UpdateTaskGroupDTO,
} from '@/types/taskGroup';
import { TaskGroupService } from '@/services/taskGroupService';
import { toast } from '@/hooks/use-toast';

export interface TaskGroupSlice {
  // State
  taskGroups: TaskGroup[];
  isLoading: boolean;
  error: string | null;
  
  // Task Group CRUD operations
  fetchTaskGroups: (projectId?: string) => Promise<TaskGroup[]>;
  createTaskGroup: (taskGroupData: CreateTaskGroupDTO) => Promise<TaskGroup>;
  updateTaskGroup: (taskGroupUpdate: UpdateTaskGroupDTO) => Promise<TaskGroup>;
  deleteTaskGroup: (id: string) => Promise<void>;
  
  // Task position operations
  updateTaskPositions: (tasks: { id: string; position: number; taskGroupId?: string }[]) => Promise<void>;
}

export const createTaskGroupSlice: StateCreator<
  TaskGroupSlice, 
  [], 
  [],
  TaskGroupSlice
> = (set, get) => ({
  // State
  taskGroups: [],
  isLoading: false,
  error: null,
  
  // Task Group CRUD operations
  fetchTaskGroups: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      console.log("TaskGroupSlice.fetchTaskGroups(): Starting fetch");
      const result = await TaskGroupService.fetchTaskGroups(projectId);
      
      if (result.error) {
        console.error("Error in fetchTaskGroups:", result.error);
        throw result.error;
      }
      
      // Make sure we have an array of task groups even if data is null or undefined
      const taskGroups = result.data || [];
      console.log(`TaskGroupSlice.fetchTaskGroups(): Received ${taskGroups.length} task groups`);
      
      set({ taskGroups, isLoading: false });
      return taskGroups;
    } catch (error) {
      console.error('Error fetching task groups:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      return [];
    }
  },
  
  createTaskGroup: async (taskGroupData) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskGroupService.createTaskGroup(taskGroupData);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task group data returned');
      }
      
      set(state => ({
        taskGroups: [...state.taskGroups, result.data!],
        isLoading: false
      }));
      
      toast({
        title: "Task group created",
        description: `${result.data.name} has been created successfully.`
      });
      
      return result.data;
    } catch (error) {
      console.error('Error creating task group:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      
      toast({
        variant: "destructive",
        title: "Failed to create task group",
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      throw error;
    }
  },
  
  updateTaskGroup: async (taskGroupUpdate) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskGroupService.updateTaskGroup(taskGroupUpdate);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('No task group data returned');
      }
      
      set(state => ({
        taskGroups: state.taskGroups.map(group => 
          group.id === taskGroupUpdate.id ? result.data! : group
        ),
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      console.error('Error updating task group:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      
      toast({
        variant: "destructive",
        title: "Failed to update task group",
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      throw error;
    }
  },
  
  deleteTaskGroup: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await TaskGroupService.deleteTaskGroup(id);
      
      if (result.error) {
        throw result.error;
      }
      
      set(state => ({
        taskGroups: state.taskGroups.filter(group => group.id !== id),
        isLoading: false
      }));
      
      toast({
        title: "Task group deleted",
        description: "The task group has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting task group:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      
      toast({
        variant: "destructive",
        title: "Failed to delete task group",
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      throw error;
    }
  },
  
  // Task position operations
  updateTaskPositions: async (tasks) => {
    try {
      const result = await TaskGroupService.updateTaskPositions(tasks);
      
      if (result.error) {
        throw result.error;
      }
      
      return;
    } catch (error) {
      console.error('Error updating task positions:', error);
      
      toast({
        variant: "destructive",
        title: "Failed to update task positions",
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      
      throw error;
    }
  }
});
