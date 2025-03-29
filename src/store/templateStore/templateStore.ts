
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CreateTemplateDTO, TaskTemplate, UpdateTemplateDTO } from '@/types/template';
import { templateService } from '@/services/templateService';

interface TemplateState {
  templates: TaskTemplate[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTemplates: () => Promise<void>;
  createTemplate: (template: CreateTemplateDTO) => Promise<TaskTemplate>;
  updateTemplate: (template: UpdateTemplateDTO) => Promise<TaskTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  useTemplate: (id: string) => Promise<void>;
  recordTemplateUsage: (templateId: string, taskId: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>()(
  devtools(
    (set, get) => ({
      templates: [],
      isLoading: false,
      error: null,
      
      fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const templates = await templateService.fetchTemplates();
          set({ templates, isLoading: false });
        } catch (error) {
          console.error('Error in fetchTemplates:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch templates', 
            isLoading: false 
          });
        }
      },
      
      createTemplate: async (template: CreateTemplateDTO) => {
        set({ isLoading: true, error: null });
        
        try {
          const newTemplate = await templateService.createTemplate(template);
          set(state => ({
            templates: [...state.templates, newTemplate],
            isLoading: false
          }));
          return newTemplate;
        } catch (error) {
          console.error('Error in createTemplate:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create template', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateTemplate: async (template: UpdateTemplateDTO) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedTemplate = await templateService.updateTemplate(template);
          set(state => ({
            templates: state.templates.map(t => 
              t.id === updatedTemplate.id ? updatedTemplate : t
            ),
            isLoading: false
          }));
          return updatedTemplate;
        } catch (error) {
          console.error('Error in updateTemplate:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update template', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      deleteTemplate: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await templateService.deleteTemplate(id);
          set(state => ({
            templates: state.templates.filter(t => t.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error in deleteTemplate:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete template', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      useTemplate: async (id: string) => {
        try {
          await templateService.incrementUsage(id);
          
          set(state => ({
            templates: state.templates.map(t => {
              if (t.id === id) {
                return {
                  ...t,
                  usageCount: t.usageCount + 1,
                  lastUsed: new Date()
                };
              }
              return t;
            })
          }));
        } catch (error) {
          console.error('Error incrementing template usage:', error);
          // Don't throw or set error - non-critical operation
        }
      },
      
      recordTemplateUsage: async (templateId: string, taskId: string) => {
        try {
          await templateService.recordTemplateUsage(templateId, taskId);
          // Usage count is already incremented by the recordTemplateUsage method
          // through the incrementUsage call, so we don't need to update the state here
        } catch (error) {
          console.error('Error recording template usage:', error);
          // Don't throw or set error - non-critical operation
        }
      }
    })
  )
);
