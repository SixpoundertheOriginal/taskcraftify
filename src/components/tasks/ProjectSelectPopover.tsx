import { useState, useMemo } from 'react';
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
  // Get projects from store with a default empty array if undefined
  const projectStore = useProjectStore();
  const [open, setOpen] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  // Ensure we ALWAYS have a valid array with useMemo
  const safeProjects = useMemo(() => {
    return Array.isArray(projectStore.projects) ? projectStore.projects : [];
  }, [projectStore.projects]);
  
  // Find current project safely with useMemo
  const currentProject = useMemo(() => {
    if (!projectId) return null;
    return safeProjects.find(p => p.id === projectId) || null;
  }, [projectId, safeProjects]);

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
              {currentProject.color && (
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: currentProject.color }}
                />
              )}
              <span>{currentProject.name || 'Unnamed Project'}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">No Project</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 z-50" align="start">
        {/* Only render the ProjectCommandMenu if open is true */}
        {open && (
          <ProjectCommandMenu
            projectId={projectId}
            onProjectSelect={handleProjectSelect}
            showProjectForm={showProjectForm}
            setShowProjectForm={setShowProjectForm}
            onProjectCreated={handleProjectCreated}
            onCancel={handleCancelProjectCreation}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
