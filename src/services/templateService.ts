
import { supabase } from '@/integrations/supabase/client';
import { CreateTemplateDTO, TaskTemplate, UpdateTemplateDTO, mapApiTemplateToTemplate } from '@/types/template';

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
    
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: template.name,
        description: template.description,
        structure: template.structure,
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
    const { data, error } = await supabase
      .from('templates')
      .update({
        name: template.name,
        description: template.description,
        structure: template.structure,
        usage_count: template.usageCount,
        last_used: template.lastUsed ? template.lastUsed.toISOString() : null
      })
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
