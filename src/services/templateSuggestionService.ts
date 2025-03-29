
import { supabase } from '@/integrations/supabase/client';
import { TaskTemplate } from '@/types/template';
import { CreateTaskDTO } from '@/types/task';

export interface TemplateSuggestion {
  suggestions: TaskTemplate[];
  context: 'popular' | 'tags' | 'project' | 'semantic';
  message: string;
}

export const templateSuggestionService = {
  /**
   * Get template suggestions based on the current task context
   */
  async getSuggestions(taskContext?: Partial<CreateTaskDTO>): Promise<TemplateSuggestion> {
    try {
      const { data, error } = await supabase.functions.invoke('suggestTemplates', {
        body: { taskContext }
      });
      
      if (error) {
        console.error('Error getting template suggestions:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in templateSuggestionService.getSuggestions:', error);
      // Return empty suggestions as fallback
      return {
        suggestions: [],
        context: 'popular',
        message: 'Could not retrieve suggestions'
      };
    }
  },
  
  /**
   * Trigger a manual analysis of template usage patterns
   */
  async triggerAnalysis(): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('analyzeTemplateUsage', {
        method: 'POST'
      });
      
      if (error) {
        console.error('Error triggering template analysis:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in templateSuggestionService.triggerAnalysis:', error);
      throw error;
    }
  }
};
