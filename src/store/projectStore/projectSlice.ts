
import { Project, CreateProjectDTO, UpdateProjectDTO } from '@/types/project';
import { ProjectService } from '@/services/projectService';
import { StateCreator } from 'zustand';
import { ProjectStore } from './projectStore';

export interface ProjectSlice {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: Error | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  addProject: (project: CreateProjectDTO) => Promise<string | null>;
  updateProject: (projectUpdate: UpdateProjectDTO) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  selectProject: (id: string | null) => void;
  
  // Selectors
  getProjectById: (id: string) => Project | undefined;
  getCurrentProject: () => Project | undefined;
}

export const createProjectSlice: StateCreator<ProjectStore, [], [], ProjectSlice> = (set, get) => ({
  projects: [],
  selectedProjectId: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  
  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const result = await ProjectService.fetchProjects();
      
      if (result.error) {
        set({ error: result.error, isLoading: false });
        return;
      }
      
      set({ projects: result.data || [], isLoading: false });
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch projects'), 
        isLoading: false 
      });
    }
  },
  
  addProject: async (projectData: CreateProjectDTO) => {
    try {
      set({ isSubmitting: true, error: null });
      
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const tempProject: Project = {
        id: tempId,
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set(state => ({
        projects: [tempProject, ...state.projects],
      }));
      
      // Actual API call
      const result = await ProjectService.createProject(projectData);
      
      if (result.error) {
        // Revert optimistic update
        set(state => ({
          projects: state.projects.filter(p => p.id !== tempId),
          error: result.error,
          isSubmitting: false
        }));
        return null;
      }
      
      if (!result.data) {
        // Handle unexpected case where no data is returned but no error either
        set(state => ({
          projects: state.projects.filter(p => p.id !== tempId),
          error: new Error('Failed to create project: No data returned'),
          isSubmitting: false
        }));
        return null;
      }
      
      // Replace temp project with actual project
      set(state => ({
        projects: state.projects.map(p => p.id === tempId ? result.data! : p),
        selectedProjectId: result.data.id,
        isSubmitting: false
      }));
      
      return result.data.id;
    } catch (error) {
      console.error('Error in addProject:', error);
      
      // Remove temp project on error
      set(state => ({
        projects: state.projects.filter(p => !p.id.startsWith('temp-')),
        error: error instanceof Error ? error : new Error('Failed to add project'),
        isSubmitting: false
      }));
      
      return null;
    }
  },
  
  updateProject: async (projectUpdate: UpdateProjectDTO) => {
    try {
      set({ isSubmitting: true, error: null });
      
      // Store the original project for potential rollback
      const originalProject = get().projects.find(project => project.id === projectUpdate.id);
      if (!originalProject) {
        set({ 
          error: new Error('Project not found'), 
          isSubmitting: false 
        });
        return false;
      }
      
      // Optimistic update
      set(state => ({
        projects: state.projects.map(project => 
          project.id === projectUpdate.id
            ? { 
                ...project, 
                ...projectUpdate, 
                updatedAt: new Date() 
              }
            : project
        )
      }));
      
      // Actual API call
      const result = await ProjectService.updateProject(projectUpdate);
      
      if (result.error) {
        // Revert optimistic update on error
        set(state => ({
          projects: state.projects.map(project => 
            project.id === projectUpdate.id ? originalProject : project
          ),
          error: result.error,
          isSubmitting: false
        }));
        return false;
      }
      
      set({ isSubmitting: false });
      return true;
    } catch (error) {
      console.error('Error in updateProject:', error);
      
      // Get the original project state and revert
      const originalProject = get().projects.find(project => project.id === projectUpdate.id);
      
      // Revert optimistic update on error
      if (originalProject) {
        set(state => ({
          projects: state.projects.map(project => 
            project.id === projectUpdate.id ? originalProject : project
          ),
          error: error instanceof Error ? error : new Error('Failed to update project'),
          isSubmitting: false
        }));
      } else {
        set({ 
          error: error instanceof Error ? error : new Error('Failed to update project'), 
          isSubmitting: false 
        });
      }
      
      return false;
    }
  },
  
  deleteProject: async (id: string) => {
    try {
      set({ isSubmitting: true, error: null });
      
      // Store the project being deleted for potential rollback
      const deletedProject = get().projects.find(p => p.id === id);
      if (!deletedProject) {
        set({ 
          error: new Error('Project not found'), 
          isSubmitting: false 
        });
        return false;
      }
      
      // Optimistic delete
      set(state => ({
        projects: state.projects.filter(project => project.id !== id),
        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId
      }));
      
      // Actual API call
      const result = await ProjectService.deleteProject(id);
      
      if (result.error) {
        // Revert optimistic delete on error
        set(state => ({
          projects: [...state.projects, deletedProject],
          error: result.error,
          isSubmitting: false
        }));
        return false;
      }
      
      set({ isSubmitting: false });
      return true;
    } catch (error) {
      console.error('Error in deleteProject:', error);
      
      // Get the original project and revert
      const deletedProject = get().projects.find(p => p.id === id);
      
      // Revert optimistic delete on error
      if (deletedProject) {
        set(state => ({
          projects: [...state.projects, deletedProject],
          error: error instanceof Error ? error : new Error('Failed to delete project'),
          isSubmitting: false
        }));
      } else {
        set({ 
          error: error instanceof Error ? error : new Error('Failed to delete project'), 
          isSubmitting: false 
        });
      }
      
      return false;
    }
  },
  
  selectProject: (id: string | null) => {
    set({ selectedProjectId: id });
  },
  
  getProjectById: (id: string) => {
    return get().projects.find(project => project.id === id);
  },
  
  getCurrentProject: () => {
    const { selectedProjectId, projects } = get();
    return selectedProjectId ? projects.find(project => project.id === selectedProjectId) : undefined;
  },
});
