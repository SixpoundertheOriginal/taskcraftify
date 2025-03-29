
import { supabase } from '@/integrations/supabase/client';
import { CreateTaskDTO } from '@/types/task';
import { CreateTemplateDTO, TaskTemplate, UpdateTemplateDTO, mapApiTemplateToTemplate } from '@/types/template';

// Helper function to make template structure JSON-safe
const prepareStructureForStorage = (structure: Partial<CreateTaskDTO>): Record<string, any> => {
  // Create a new object to avoid mutating the original
  const jsonSafeStructure = { ...structure };
  
  // Convert Date objects to ISO strings for JSON compatibility
  if (jsonSafeStructure.dueDate instanceof Date) {
    // Convert to string instead of assigning directly to avoid type error
    const dueDateString = jsonSafeStructure.dueDate.toISOString();
    // Using type assertion to tell TypeScript this is intentional
    (jsonSafeStructure as any).dueDate = dueDateString;
  }
  
  return jsonSafeStructure;
};

export const templateService = {
  // Fetch all templates for the current user
  async fetchTemplates(): Promise<TaskTemplate[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }
    
    // Use the raw 'from' method with type assertion to bypass type checking
    // for tables not yet in the generated types
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
    
    return data.map(template => mapApiTemplateToTemplate(template));
  },
  
  // Create a new template
  async createTemplate(template: CreateTemplateDTO): Promise<TaskTemplate> {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('User not authenticated');
    }
    
    const jsonSafeStructure = prepareStructureForStorage(template.structure);
    
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: template.name,
        description: template.description,
        structure: jsonSafeStructure,
        user_id: session.session.user.id,
        usage_count: 0
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating template:', error);
      throw error;
    }
    
    return mapApiTemplateToTemplate(data);
  },
  
  // Update an existing template
  async updateTemplate(template: UpdateTemplateDTO): Promise<TaskTemplate> {
    const updateData: Record<string, any> = {
      name: template.name,
      description: template.description,
      usage_count: template.usageCount,
    };
    
    if (template.structure) {
      updateData.structure = prepareStructureForStorage(template.structure);
    }
    
    if (template.lastUsed) {
      updateData.last_used = template.lastUsed.toISOString();
    }
    
    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', template.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating template:', error);
      throw error;
    }
    
    return mapApiTemplateToTemplate(data);
  },
  
  // Delete a template
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },
  
  // Increment template usage count
  async incrementUsage(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_template_usage', {
      template_id: id
    });
    
    if (error) {
      console.error('Error incrementing template usage:', error);
      // Don't throw here - just log the error
    }
  }
};
