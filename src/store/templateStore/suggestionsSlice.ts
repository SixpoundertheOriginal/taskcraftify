
import { StateCreator } from 'zustand';
import { TaskTemplate } from '@/types/template';
import { templateSuggestionService, TemplateSuggestion } from '@/services/templateSuggestionService';
import { CreateTaskDTO } from '@/types/task';

export interface TemplateSuggestionsState {
  suggestions: TaskTemplate[];
  suggestionsContext: string;
  suggestionsMessage: string;
  isSuggestionsLoading: boolean;
  suggestionsError: string | null;
  
  // Actions
  getSuggestions: (taskContext?: Partial<CreateTaskDTO>) => Promise<void>;
  triggerAnalysis: () => Promise<void>;
}

export const createTemplateSuggestionsSlice: StateCreator<
  TemplateSuggestionsState,
  [],
  [],
  TemplateSuggestionsState
> = (set) => ({
  suggestions: [],
  suggestionsContext: 'popular',
  suggestionsMessage: '',
  isSuggestionsLoading: false,
  suggestionsError: null,
  
  getSuggestions: async (taskContext?: Partial<CreateTaskDTO>) => {
    set({ isSuggestionsLoading: true, suggestionsError: null });
    
    try {
      const result = await templateSuggestionService.getSuggestions(taskContext);
      
      set({
        suggestions: result.suggestions,
        suggestionsContext: result.context,
        suggestionsMessage: result.message,
        isSuggestionsLoading: false
      });
    } catch (error) {
      console.error('Error in getSuggestions:', error);
      set({
        suggestions: [],
        suggestionsError: error instanceof Error ? error.message : 'Failed to fetch template suggestions',
        isSuggestionsLoading: false
      });
    }
  },
  
  triggerAnalysis: async () => {
    set({ isSuggestionsLoading: true, suggestionsError: null });
    
    try {
      await templateSuggestionService.triggerAnalysis();
      set({ isSuggestionsLoading: false });
    } catch (error) {
      console.error('Error in triggerAnalysis:', error);
      set({
        suggestionsError: error instanceof Error ? error.message : 'Failed to trigger template analysis',
        isSuggestionsLoading: false
      });
    }
  }
});
