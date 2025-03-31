
import { supabase } from '@/integrations/supabase/client';
import { 
  Project, 
  CreateProjectDTO, 
  UpdateProjectDTO, 
  mapApiProjectToProject, 
  APIProject 
} from '@/types/project';
import { Database } from '@/types/database';

// Service result type for consistent error handling
interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

export const ProjectService = {
  async fetchProjects(): Promise<ServiceResult<Project[]>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { 
        data: (data as APIProject[]).map(mapApiProjectToProject), 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error fetching projects:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  },

  async createProject(projectData: CreateProjectDTO): Promise<ServiceResult<Project>> {
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

      const projectInsert = {
        name: projectData.name,
        description: projectData.description || null,
        color: projectData.color,
        parent_project_id: projectData.parentProjectId || null,
        user_id: userId
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert(projectInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { 
        data: mapApiProjectToProject(data as APIProject), 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error creating project:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async updateProject(projectUpdate: UpdateProjectDTO): Promise<ServiceResult<Project>> {
    try {
      const projectUpdateData: Record<string, any> = {
        id: projectUpdate.id
      };
      
      if (projectUpdate.name !== undefined) projectUpdateData.name = projectUpdate.name;
      if (projectUpdate.description !== undefined) projectUpdateData.description = projectUpdate.description || null;
      if (projectUpdate.color !== undefined) projectUpdateData.color = projectUpdate.color;
      if (projectUpdate.parentProjectId !== undefined) projectUpdateData.parent_project_id = projectUpdate.parentProjectId || null;
      projectUpdateData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('projects')
        .update(projectUpdateData)
        .eq('id', projectUpdate.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { 
        data: mapApiProjectToProject(data as APIProject), 
        error: null 
      };
    } catch (error) {
      console.error('Unexpected error updating project:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  async deleteProject(id: string): Promise<ServiceResult<void>> {
    try {
      // First, get all child projects
      const { data: childProjects, error: fetchError } = await supabase
        .from('projects')
        .select('id')
        .eq('parent_project_id', id);
        
      if (fetchError) {
        console.error('Error fetching child projects:', fetchError);
        return { data: null, error: new Error(fetchError.message) };
      }
      
      // Update all child projects to have no parent
      if (childProjects && childProjects.length > 0) {
        const childIds = childProjects.map(project => project.id);
        const { error: updateError } = await supabase
          .from('projects')
          .update({ parent_project_id: null })
          .in('id', childIds);
          
        if (updateError) {
          console.error('Error updating child projects:', updateError);
          return { data: null, error: new Error(updateError.message) };
        }
      }
      
      // Delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting project:', error);
        return { data: null, error: new Error(error.message) };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error deleting project:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  subscribeToProjects(callback: (projects: Project[]) => void): (() => void) {
    const channel = supabase
      .channel('public:projects')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        async () => {
          try {
            const result = await this.fetchProjects();
            if (result.data) {
              callback(result.data);
            } else if (result.error) {
              console.error('Error refreshing projects after changes:', result.error);
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
