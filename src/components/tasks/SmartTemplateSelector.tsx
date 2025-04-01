
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { BrainCircuit, Check, ChevronDown, LayoutTemplate, Plus, Save, Sparkles } from 'lucide-react';
import { useTemplateStore } from '@/store/templateStore/templateStore';
import { CreateTaskDTO } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { TaskTemplate } from '@/types/template';
import { Skeleton } from "@/components/ui/skeleton";

interface SmartTemplateSelectorProps {
  onSelectTemplate: (template: TaskTemplate) => void;
  currentTask: Partial<CreateTaskDTO>;
  onSaveAsTemplate: () => void;
}

export function SmartTemplateSelector({ 
  onSelectTemplate, 
  currentTask, 
  onSaveAsTemplate 
}: SmartTemplateSelectorProps) {
  const { 
    templates = [], 
    isLoading: templatesLoading,
    suggestions = [], 
    suggestionsMessage, 
    isSuggestionsLoading,
    getSuggestions
  } = useTemplateStore();
  
  const hasContent = Boolean(
    currentTask.title || 
    currentTask.description || 
    currentTask.tags?.length
  );

  // Ensure templates and suggestions are arrays
  const safeTemplates = Array.isArray(templates) ? templates : [];
  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
  
  const hasTemplates = safeTemplates.length > 0;
  const hasSuggestions = safeSuggestions.length > 0;

  // Get smart suggestions based on the current task context
  useEffect(() => {
    if (currentTask.title || currentTask.tags?.length || currentTask.projectId) {
      getSuggestions(currentTask);
    }
  }, [currentTask.title, currentTask.tags, currentTask.projectId, getSuggestions]);

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full justify-between"
              disabled={templatesLoading || !hasTemplates}
            >
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                <span>Templates</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search templates..." />
              <CommandList>
                <CommandEmpty>No templates found.</CommandEmpty>
                {hasTemplates && (
                  <CommandGroup heading="Your Templates">
                    {safeTemplates.map((template) => (
                      <CommandItem
                        key={template.id || `template-${Math.random()}`}
                        value={template.id || `template-id-${Math.random()}`}
                        onSelect={() => onSelectTemplate(template)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Used {template.usageCount} times
                          </span>
                        </div>
                        <div className="flex items-center">
                          {template.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag || `tag-${Math.random()}`} variant="outline" className="mr-1">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {hasContent && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs"
            onClick={onSaveAsTemplate}
          >
            <Save className="h-3.5 w-3.5" />
            Save as template
          </Button>
        )}
      </div>
      
      {/* Smart Suggestions */}
      {(hasSuggestions || isSuggestionsLoading) && (
        <div className="bg-muted/40 rounded-lg p-3 border border-muted">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium">Suggested Templates</h4>
            <div className="text-xs text-muted-foreground ml-auto">{suggestionsMessage}</div>
          </div>
          
          {isSuggestionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {safeSuggestions.slice(0, 4).map((template) => (
                <Button
                  key={template.id || `suggestion-${Math.random()}`}
                  variant="outline"
                  size="sm"
                  className="justify-start overflow-hidden bg-background hover:bg-background/90 border-border/60"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="truncate">
                    {template.name}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
