import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateTaskDTO, Task, TaskPriority, TaskStatus } from '@/types/task';
import { useTaskStore } from '@/store';
import { toast } from '@/hooks/use-toast';
import { TaskLog } from '@/components/tasks/TaskLog';
import { RichTextInput } from '@/components/ui/rich-text-input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { useProjectStore } from '@/store';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTask?: Task;
  initialDueDate?: Date;
  initialStatus?: TaskStatus;
}

export function UnifiedTaskForm({ 
  open, 
  onOpenChange, 
  initialTask, 
  initialDueDate, 
  initialStatus 
}: TaskFormProps) {
  const { createTask, updateTask, isLoading, uploadAttachment, fetchTask } = useTaskStore();
  const { projects, selectedProjectId } = useProjectStore();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialTask?.tags || []);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialTask?.dueDate || initialDueDate
  );
  const [projectId, setProjectId] = useState<string | undefined>(
    initialTask?.projectId || selectedProjectId || undefined
  );
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [descriptionFiles, setDescriptionFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(initialTask);
  
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<CreateTaskDTO>({
    defaultValues: initialTask ? {
      title: initialTask.title,
      description: initialTask.description,
      status: initialTask.status,
      priority: initialTask.priority,
    } : {
      title: '',
      description: '',
      status: initialStatus || TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    }
  });
  
  const description = watch('description');
  
  useEffect(() => {
    if (initialTask && initialTask.id) {
      fetchTask(initialTask.id).then(refreshedTask => {
        if (refreshedTask) {
          setCurrentTask(refreshedTask);
        }
      });
    }
  }, [initialTask, fetchTask]);
  
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
  
  const handleDescriptionFilesChange = (files: File[]) => {
    setDescriptionFiles(files);
  };
  
  const onSubmit = async (data: CreateTaskDTO) => {
    try {
      setIsSubmitting(true);
      
      const taskData: CreateTaskDTO = {
        ...data,
        dueDate,
        tags,
        projectId: projectId === 'none' ? undefined : projectId
      };
      
      let taskId: string;
      let updatedTask: Task;
      
      if (initialTask) {
        updatedTask = await updateTask({
          id: initialTask.id,
          ...taskData
        });
        
        taskId = initialTask.id;
        setCurrentTask(updatedTask);
        
        toast({
          title: "Task updated",
          description: "Your task has been updated successfully.",
        });
      } else {
        const newTask = await createTask(taskData);
        updatedTask = newTask;
        taskId = newTask.id;
        setCurrentTask(newTask);
        
        toast({
          title: "Task created",
          description: "Your task has been created successfully.",
        });
      }
      
      if (descriptionFiles.length > 0 && taskId) {
        for (const file of descriptionFiles) {
          await uploadAttachment({
            taskId: taskId,
            file,
            onProgress: (progress) => {
              console.log(`Uploading ${file.name}: ${progress}%`);
            }
          });
        }
        
        toast({
          title: "Files uploaded",
          description: `${descriptionFiles.length} file(s) have been attached to the task.`,
        });
        
        const refreshedTask = await fetchTask(taskId);
        if (refreshedTask) {
          setCurrentTask(refreshedTask);
        }
      }
      
      if (!initialTask) {
        reset();
        setTags([]);
        setDueDate(undefined);
        setDescriptionFiles([]);
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: initialTask ? "Failed to update task" : "Failed to create task",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (!initialTask) {
      reset();
      setTags([]);
      setDueDate(undefined);
      setDescriptionFiles([]);
    }
    onOpenChange(false);
  };
  
  useEffect(() => {
    if (initialTask) {
      setActiveTab("details");
    } else {
      setActiveTab("details");
    }
  }, [initialTask, open]);
  
  const currentProject = projectId ? projects.find(p => p.id === projectId) : null;
  
  const handleProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectSelectorOpen(!projectSelectorOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{initialTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2 mb-4">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              placeholder="Task title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          
          {initialTask ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="log">Task Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="flex-1 overflow-auto space-y-4 pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      Status <span className="text-destructive">*</span>
                    </label>
                    <Select 
                      onValueChange={(value) => setValue('status', value as TaskStatus)}
                      defaultValue={watch('status')}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TaskStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === TaskStatus.TODO ? 'To Do' : 
                              status === TaskStatus.IN_PROGRESS ? 'In Progress' : 
                              status === TaskStatus.DONE ? 'Done' : 
                              status === TaskStatus.BACKLOG ? 'Backlog' : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="priority" className="text-sm font-medium">
                      Priority <span className="text-destructive">*</span>
                    </label>
                    <Select
                      onValueChange={(value) => setValue('priority', value as TaskPriority)}
                      defaultValue={watch('priority')}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TaskPriority).map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority === TaskPriority.LOW ? 'Low' : 
                              priority === TaskPriority.MEDIUM ? 'Medium' : 
                              priority === TaskPriority.HIGH ? 'High' : 
                              priority === TaskPriority.URGENT ? 'Urgent' : priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="dueDate"
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP') : <span className="text-muted-foreground">Select due date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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
                  <label htmlFor="project" className="text-sm font-medium">Project</label>
                  <Popover open={projectSelectorOpen} onOpenChange={setProjectSelectorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        id="project"
                        type="button"
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
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search projects..." />
                        <CommandList>
                          <CommandEmpty>No projects found.</CommandEmpty>
                          
                          <CommandGroup>
                            <CommandItem 
                              className="flex items-center gap-2 cursor-pointer"
                              onSelect={() => handleProjectSelect(undefined)}
                            >
                              <span>All Projects</span>
                              {!projectId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            
                            <CommandItem 
                              className="flex items-center gap-2 cursor-pointer"
                              onSelect={() => handleProjectSelect('none')}
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
                                    className="flex items-center gap-2 cursor-pointer"
                                    onSelect={() => handleProjectSelect(project.id)}
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
                  <label htmlFor="tags" className="text-sm font-medium">Tags</label>
                  <div className="flex space-x-2">
                    <Input
                      id="tags"
                      placeholder="Add tag and press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
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
                            type="button"
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove tag</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <RichTextInput
                    id="description"
                    placeholder="Add details about this task..."
                    value={description}
                    onChange={(e) => setValue('description', e.target.value)}
                    files={descriptionFiles}
                    onFilesChange={handleDescriptionFilesChange}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="log" className="flex-1 overflow-auto">
                {currentTask && <TaskLog task={currentTask} />}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4 flex-1 overflow-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status <span className="text-destructive">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => setValue('status', value as TaskStatus)}
                    defaultValue={initialStatus || TaskStatus.TODO}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === TaskStatus.TODO ? 'To Do' : 
                            status === TaskStatus.IN_PROGRESS ? 'In Progress' : 
                            status === TaskStatus.DONE ? 'Done' : 
                            status === TaskStatus.BACKLOG ? 'Backlog' : status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Priority <span className="text-destructive">*</span>
                  </label>
                  <Select
                    onValueChange={(value) => setValue('priority', value as TaskPriority)}
                    defaultValue={TaskPriority.MEDIUM}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority === TaskPriority.LOW ? 'Low' : 
                            priority === TaskPriority.MEDIUM ? 'Medium' : 
                            priority === TaskPriority.HIGH ? 'High' : 
                            priority === TaskPriority.URGENT ? 'Urgent' : priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      id="dueDate"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : <span className="text-muted-foreground">Select due date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
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
                <label htmlFor="project" className="text-sm font-medium">Project</label>
                <Popover open={projectSelectorOpen} onOpenChange={setProjectSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      id="project"
                      type="button"
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
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search projects..." />
                      <CommandList>
                        <CommandEmpty>No projects found.</CommandEmpty>
                        
                        <CommandGroup>
                          <CommandItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={() => handleProjectSelect(undefined)}
                          >
                            <span>All Projects</span>
                            {!projectId && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                          
                          <CommandItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={() => handleProjectSelect('none')}
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
                                  className="flex items-center gap-2 cursor-pointer"
                                  onSelect={() => handleProjectSelect(project.id)}
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
                <label htmlFor="tags" className="text-sm font-medium">Tags</label>
                <div className="flex space-x-2">
                  <Input
                    id="tags"
                    placeholder="Add tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
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
                          type="button"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove tag</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <RichTextInput
                  id="description"
                  placeholder="Add details about this task..."
                  value={description}
                  onChange={(e) => setValue('description', e.target.value)}
                  files={descriptionFiles}
                  onFilesChange={handleDescriptionFilesChange}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {(isLoading || isSubmitting) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialTask ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialTask ? 'Update Task' : 'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
