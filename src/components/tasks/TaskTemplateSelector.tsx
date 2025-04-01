
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, LayoutTemplate, Plus, Save } from 'lucide-react';
import { useTemplateStore } from '@/store/templateStore/templateStore';
import { CreateTaskDTO, TaskPriority, TaskStatus } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { TaskTemplate } from '@/types/template';

interface TaskTemplateSelectorProps {
  onSelectTemplate: (template: TaskTemplate) => void;
  currentTask: Partial<CreateTaskDTO>;
  onSaveAsTemplate: () => void;
}

export function TaskTemplateSelector({ 
  onSelectTemplate, 
  currentTask, 
  onSaveAsTemplate 
}: TaskTemplateSelectorProps) {
  const { templates = [], isLoading } = useTemplateStore();
  const [open, setOpen] = useState(false);
  
  const hasContent = Boolean(
    currentTask.title || 
    currentTask.description || 
    (currentTask.tags && currentTask.tags.length)
  );

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isLoading || templates.length === 0}
          >
            <LayoutTemplate className="h-4 w-4" />
            <span>Templates</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search templates..." />
            <CommandList>
              <CommandEmpty>No templates found.</CommandEmpty>
              <CommandGroup heading="Your Templates">
                {templates.map((template) => (
                  <CommandItem
                    key={template.id || `template-${Math.random()}`}
                    value={template.id || `template-value-${Math.random()}`}
                    onSelect={() => {
                      onSelectTemplate(template);
                      setOpen(false);
                    }}
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
                        <Badge key={tag} variant="outline" className="mr-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
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
  );
}
