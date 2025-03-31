
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { useProjectStore } from '@/store';
import { Project, CreateProjectDTO, UpdateProjectDTO } from '@/types/project';
import { toast } from '@/hooks/use-toast';
import { ColorPicker } from './ColorPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: Project;
}

export function ProjectDialog({ open, onOpenChange, projectToEdit }: ProjectDialogProps) {
  const { addProject, updateProject, isSubmitting, projects } = useProjectStore();
  const [selectedColor, setSelectedColor] = useState<string>(projectToEdit?.color || '#6E59A5');
  const [parentProjectId, setParentProjectId] = useState<string | undefined>(projectToEdit?.parentProjectId);
  const [parentSelectorOpen, setParentSelectorOpen] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateProjectDTO | UpdateProjectDTO>({
    defaultValues: projectToEdit ? {
      id: projectToEdit.id,
      name: projectToEdit.name,
      description: projectToEdit.description,
      color: projectToEdit.color,
      parentProjectId: projectToEdit.parentProjectId,
    } : {
      name: '',
      description: '',
      color: '#6E59A5',
      parentProjectId: undefined,
    }
  });
  
  // Watch the project name to give live preview
  const projectName = watch('name');
  
  // Available parent projects (exclude self for editing and any child projects)
  const availableParentProjects = projects.filter(p => {
    if (projectToEdit) {
      // Cannot select self as parent
      if (p.id === projectToEdit.id) return false;
      
      // Cannot select any descendant as parent (would create a cycle)
      let current = p;
      while (current.parentProjectId) {
        if (current.parentProjectId === projectToEdit.id) return false;
        current = projects.find(parent => parent.id === current.parentProjectId) || current;
        if (current.id === current.parentProjectId) break; // Safety check
      }
    }
    return true;
  });
  
  // Find current parent project for display
  const currentParentProject = parentProjectId 
    ? projects.find(p => p.id === parentProjectId) 
    : undefined;
  
  // Update form when projectToEdit changes
  useEffect(() => {
    if (projectToEdit) {
      setValue('id', projectToEdit.id);
      setValue('name', projectToEdit.name);
      setValue('description', projectToEdit.description || '');
      setValue('color', projectToEdit.color);
      setValue('parentProjectId', projectToEdit.parentProjectId);
      setSelectedColor(projectToEdit.color);
      setParentProjectId(projectToEdit.parentProjectId);
    } else {
      reset({
        name: '',
        description: '',
        color: '#6E59A5',
        parentProjectId: undefined,
      });
      setSelectedColor('#6E59A5');
      setParentProjectId(undefined);
    }
  }, [projectToEdit, setValue, reset]);
  
  const handleParentProjectSelect = (id: string | undefined) => {
    setParentProjectId(id);
    setParentSelectorOpen(false);
  };
  
  const onSubmit = async (data: CreateProjectDTO | UpdateProjectDTO) => {
    try {
      const projectData = {
        ...data,
        color: selectedColor,
        parentProjectId: parentProjectId,
      };
      
      if (projectToEdit) {
        // Update existing project
        await updateProject(projectData as UpdateProjectDTO);
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
        });
      } else {
        // Add new project
        await addProject(projectData as CreateProjectDTO);
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        });
      }
      
      // Reset form and close dialog
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Failed to save project",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{projectToEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {projectToEdit 
              ? 'Update your project details below.'
              : 'Fill out the form below to create a new project.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <label htmlFor="name" className="text-sm font-medium">
                Project Name <span className="text-destructive">*</span>
              </label>
              <span className="text-xs text-muted-foreground">
                {projectName?.length || 0}/50
              </span>
            </div>
            <Input
              id="name"
              placeholder="e.g., Personal Tasks, Work Project"
              {...register('name', { 
                required: 'Project name is required',
                maxLength: {
                  value: 50,
                  message: 'Project name cannot exceed 50 characters'
                }
              })}
              className="w-full"
              maxLength={50}
            />
            {errors.name && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {errors.name.message}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <span className="text-xs text-muted-foreground">
                {watch('description')?.length || 0}/200
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Add a brief description of this project..."
              {...register('description', {
                maxLength: {
                  value: 200,
                  message: 'Description cannot exceed 200 characters'
                }
              })}
              className="min-h-[80px]"
              maxLength={200}
            />
            {errors.description && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {errors.description.message}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Color</label>
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="parentProject" className="text-sm font-medium">Parent Project</label>
            <Popover open={parentSelectorOpen} onOpenChange={setParentSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={parentSelectorOpen}
                  className="w-full justify-between"
                  id="parentProject"
                  type="button"
                >
                  {parentProjectId && currentParentProject ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: currentParentProject.color }}
                      />
                      <span>{currentParentProject.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No parent project (top level)</span>
                  )}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search projects..." />
                  <CommandList>
                    <CommandEmpty>No projects found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        className="flex items-center gap-2 cursor-pointer"
                        onSelect={() => handleParentProjectSelect(undefined)}
                      >
                        <span>No parent project (top level)</span>
                        {!parentProjectId && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    </CommandGroup>
                    
                    {availableParentProjects.length > 0 && (
                      <CommandGroup heading="Available Parent Projects">
                        {availableParentProjects.map((project) => (
                          <CommandItem
                            key={project.id}
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={() => handleParentProjectSelect(project.id)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: project.color }}
                            />
                            <span>{project.name}</span>
                            {parentProjectId === project.id && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="pt-4 space-y-4">
            <div className="flex items-center rounded-md border p-4">
              <div 
                className="mr-3 h-8 w-8 rounded-full" 
                style={{ backgroundColor: selectedColor }}
              />
              <div>
                <p className="text-sm font-medium">
                  {projectName || "Project Name"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {watch('description') || "No description provided"}
                </p>
                {parentProjectId && currentParentProject && (
                  <p className="text-xs mt-1">
                    <span className="text-muted-foreground">Parent: </span>
                    <span className="font-medium">{currentParentProject.name}</span>
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {projectToEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  projectToEdit ? 'Update Project' : 'Create Project'
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
