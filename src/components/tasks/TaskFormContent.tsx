import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Loader2, Plus, Tag, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CreateTaskDTO, TaskPriority, TaskStatus, Task } from '@/types/task';
import { getPriorityLabel, getStatusLabel } from '@/lib/utils';
import { useTaskStore, useProjectStore, useTemplateStore } from '@/store';
import { toast } from '@/hooks/use-toast';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { TaskTemplate } from '@/types/template';
import { templateService } from '@/services/templateService';
import { SmartTemplateSelector } from './SmartTemplateSelector';

interface TaskFormContentProps {
  onSuccess: () => void;
  taskToEdit?: Task;
  initialStatus?: TaskStatus;
  initialDueDate?: Date;
}

export function TaskFormContent({ onSuccess, taskToEdit, initialStatus, initialDueDate }: TaskFormContentProps) {
  const { createTask, updateTask, isLoading, error } = useTaskStore();
  const { projects, selectedProjectId } = useProjectStore();
  const { fetchTemplates, useTemplate } = useTemplateStore();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(taskToEdit?.tags || []);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    taskToEdit?.dueDate || initialDueDate
  );
  const [projectId, setProjectId] = useState<string | undefined>(
    taskToEdit?.projectId || selectedProjectId || undefined
  );
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  
  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<CreateTaskDTO>({
    defaultValues: taskToEdit ? {
      title: taskToEdit.title,
      description: taskToEdit.description,
      status: taskToEdit.status,
      priority: taskToEdit.priority,
    } : {
      title: '',
      description: '',
      status: initialStatus || TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    }
  });
  
  const formValues = watch();
  
  useEffect(() => {
    fetchTemplates().catch(err => {
      console.error("Failed to load templates:", err);
      toast({
        title: "Template loading failed",
        description: "Could not load your saved templates. Please try again later.",
        variant: "destructive"
      });
    });
  }, [fetchTemplates]);
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleProjectSelect = (id: string | undefined) => {
    setProjectId(id === 'none' ? undefined : id);
    setProjectSelectorOpen(false);
  };
  
  const handleSelectTemplate = async (template: TaskTemplate) => {
    setSelectedTemplateId(template.id);
    
    if (template.structure.title) {
      setValue('title', template.structure.title);
    }
    
    if (template.structure.description) {
      setValue('description', template.structure.description);
    }
    
    if (template.structure.status) {
      setValue('status', template.structure.status);
    }
    
    if (template.structure.priority) {
      setValue('priority', template.structure.priority);
    }
    
    if (template.structure.tags && template.structure.tags.length > 0) {
      setTags(template.structure.tags);
    }
    
    if (template.structure.dueDate) {
      setDueDate(new Date(template.structure.dueDate));
    }
    
    if (template.structure.projectId) {
      setProjectId(template.structure.projectId);
    }
    
    await useTemplate(template.id);
    
    toast({
      title: "Template applied",
      description: `Applied the "${template.name}" template.`,
    });
  };
  
  const handleSaveAsTemplate = () => {
    setSaveTemplateOpen(true);
  };
  
  const getCurrentFormData = (): Partial<CreateTaskDTO> => {
    return {
      ...formValues,
      tags,
      dueDate,
      projectId: projectId === 'none' ? undefined : projectId
    };
  };
  
  const onSubmit = async (data: CreateTaskDTO) => {
    try {
      const taskData: CreateTaskDTO = {
        ...data,
        dueDate,
        tags,
        projectId: projectId === 'none' ? undefined : projectId
      };
      
      let taskId: string;
      
      if (taskToEdit) {
        const updatedTask = await updateTask({
          id: taskToEdit.id,
          ...taskData
        });
        taskId = updatedTask.id;
        
        toast({
          title: "Task updated",
          description: "Your task has been updated successfully.",
        });
      } else {
        const newTask = await createTask(taskData);
        taskId = newTask.id;
        
        if (selectedTemplateId) {
          try {
            await templateService.recordTemplateUsage(selectedTemplateId, taskId);
          } catch (err) {
            console.error("Failed to record template usage:", err);
          }
        }
        
        toast({
          title: "Task created",
          description: "Your task has been created successfully.",
        });
      }
      
      reset();
      setTags([]);
      setDueDate(undefined);
      setSelectedTemplateId(undefined);
      onSuccess();
    } catch (err) {
      toast({
        title: taskToEdit ? "Failed to update task" : "Failed to create task",
        description: error ? (typeof error === 'string' ? error : "An unexpected error occurred.") : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };
  
  const currentProject = projectId ? projects.find(p => p.id === projectId) : null;

  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectSelectorOpen(!projectSelectorOpen);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      {!taskToEdit && (
        <SmartTemplateSelector 
          onSelectTemplate={handleSelectTemplate}
          currentTask={getCurrentFormData()}
          onSaveAsTemplate={handleSaveAsTemplate}
        />
      )}
      
      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        taskData={getCurrentFormData()}
      />
      
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          placeholder="Task title"
          {...register('title', { required: 'Title is required' })}
          className="w-full"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <Textarea
          id="description"
          placeholder="Add details about this task..."
          {...register('description')}
          className="min-h-[100px]"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status <span className="text-destructive">*</span>
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">
            Priority <span className="text-destructive">*</span>
          </label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TaskPriority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {getPriorityLabel(priority)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="project" className="text-sm font-medium">Project</label>
        <Popover open={projectSelectorOpen} onOpenChange={setProjectSelectorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={projectSelectorOpen}
              className="w-full justify-between"
              id="project"
              onClick={handleProjectClick}
              type="button" // Explicitly set type to prevent form submission
            >
              {projectId && currentProject ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: currentProject.color }}
                  />
                  <span>{currentProject.name}</span>
                </div>
              ) : projectId === 'none' ? (
                <span>No Project</span>
              ) : (
                <span className="text-muted-foreground">Select project</span>
              )}
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 z-50">
            <Command>
              <CommandInput placeholder="Search projects..." className="h-9" />
              <CommandList>
                <CommandEmpty>No projects found.</CommandEmpty>
                
                <CommandGroup>
                  <CommandItem 
                    onSelect={() => handleProjectSelect('none')}
                    className="flex items-center gap-2"
                  >
                    <span>No Project</span>
                    {projectId === 'none' && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                </CommandGroup>
                
                {projects.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Your Projects">
                      {projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          onSelect={() => handleProjectSelect(project.id)}
                          className="flex items-center gap-2"
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span>{project.name}</span>
                          {projectId === project.id && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              id="dueDate"
              type="button" // Explicitly set type to prevent form submission
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : <span className="text-muted-foreground">Select due date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="tags" className="text-sm font-medium">Tags</label>
        <div className="flex space-x-2">
          <Input
            id="tags"
            placeholder="Add tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            className="w-full"
          />
          <Button type="button" size="icon" onClick={handleAddTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {tag}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tag)}
                  type="button" // Explicitly set type to prevent form submission
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove tag</span>
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {taskToEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            taskToEdit ? 'Update Task' : 'Create Task'
          )}
        </Button>
      </div>
    </form>
  );
}
