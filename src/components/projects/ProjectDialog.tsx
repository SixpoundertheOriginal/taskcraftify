
import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useProjectStore } from '@/store';
import { Project, CreateProjectDTO, UpdateProjectDTO } from '@/types/project';
import { toast } from '@/hooks/use-toast';
import { ColorPicker } from './ColorPicker';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: Project;
}

export function ProjectDialog({ open, onOpenChange, projectToEdit }: ProjectDialogProps) {
  const { addProject, updateProject, isSubmitting } = useProjectStore();
  const [selectedColor, setSelectedColor] = useState<string>(projectToEdit?.color || '#6E59A5');
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateProjectDTO | UpdateProjectDTO>({
    defaultValues: projectToEdit ? {
      id: projectToEdit.id,
      name: projectToEdit.name,
      description: projectToEdit.description,
      color: projectToEdit.color,
    } : {
      name: '',
      description: '',
      color: '#6E59A5',
    }
  });
  
  const onSubmit = async (data: CreateProjectDTO | UpdateProjectDTO) => {
    try {
      const projectData = {
        ...data,
        color: selectedColor
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
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              placeholder="e.g., Personal Tasks, Work Project"
              {...register('name', { required: 'Project name is required' })}
              className="w-full"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              placeholder="Add a brief description of this project..."
              {...register('description')}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Color</label>
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
            />
          </div>
          
          <DialogFooter className="pt-4">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
