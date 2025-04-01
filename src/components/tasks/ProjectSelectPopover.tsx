
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjectStore } from '@/store';
import { ProjectCommandMenu } from './ProjectCommandMenu';

interface ProjectSelectPopoverProps {
  projectId: string | undefined;
  onProjectSelect: (id: string | undefined) => void;
}

export function ProjectSelectPopover({ projectId, onProjectSelect }: ProjectSelectPopoverProps) {
  const { projects = [] } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  const currentProject = projectId ? projects.find(p => p.id === projectId) : null;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // If closing, also ensure we hide the project form
      setShowProjectForm(false);
    }
    setOpen(isOpen);
  };

  const handleProjectCreated = (newProjectId: string) => {
    console.log("ProjectSelectPopover - New project created:", newProjectId);
    onProjectSelect(newProjectId);
    setShowProjectForm(false);
    setOpen(false);
  };

  const handleCancelProjectCreation = () => {
    setShowProjectForm(false);
  };

  const handleProjectSelect = (id: string | undefined) => {
    console.log("ProjectSelectPopover - Project selected:", id);
    // Handle 'none' as a special case, converting it to undefined for the task
    const finalProjectId = id === 'none' ? undefined : id;
    console.log("ProjectSelectPopover - Final project ID to store:", finalProjectId);
    onProjectSelect(finalProjectId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
          ) : (
            <span className="text-muted-foreground">No Project</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 z-50" align="start">
        <ProjectCommandMenu
          projectId={projectId}
          onProjectSelect={handleProjectSelect}
          showProjectForm={showProjectForm}
          setShowProjectForm={setShowProjectForm}
          onProjectCreated={handleProjectCreated}
          onCancel={handleCancelProjectCreation}
        />
      </PopoverContent>
    </Popover>
  );
}
