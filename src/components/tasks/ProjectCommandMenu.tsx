
import { Fragment, useMemo } from 'react';
import { FolderPlus } from 'lucide-react';
import { 
  Command, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandSeparator 
} from '@/components/ui/command';
import { useProjectStore } from '@/store';
import { ProjectSelectorItem } from '@/components/projects/ProjectSelectorItem';
import { ProjectQuickCreateForm } from '@/components/projects/ProjectQuickCreateForm';

interface ProjectCommandMenuProps {
  projectId: string | undefined;
  onProjectSelect: (id: string | undefined) => void;
  showProjectForm: boolean;
  setShowProjectForm: (show: boolean) => void;
  onProjectCreated: (newProjectId: string) => void;
  onCancel: () => void;
}

export function ProjectCommandMenu({
  projectId,
  onProjectSelect,
  showProjectForm,
  setShowProjectForm,
  onProjectCreated,
  onCancel
}: ProjectCommandMenuProps) {
  // Get projects and provide empty array as fallback
  const { projects } = useProjectStore();

  // Create a memoized, safe projects array to avoid repeated processing
  const safeProjects = useMemo(() => {
    // Ensure we have a valid array to work with
    if (!Array.isArray(projects)) return [];
    return projects;
  }, [projects]);

  const handleProjectSelect = (id: string | undefined) => {
    console.log("ProjectCommandMenu - Project selected:", id);
    if (id === 'create-new') {
      setShowProjectForm(true);
      return;
    }
    
    onProjectSelect(id);
  };

  // Don't render the Command component if showProjectForm is true
  if (showProjectForm) {
    return (
      <ProjectQuickCreateForm 
        onSuccess={onProjectCreated}
        onCancel={onCancel}
      />
    );
  }

  // Ensure we have valid projects to render
  const hasProjects = safeProjects.length > 0;

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput 
        placeholder="Search projects..." 
        className="h-9"
      />
      <CommandList>
        <CommandEmpty>No projects found.</CommandEmpty>
        
        <CommandGroup>
          <ProjectSelectorItem
            id="all"
            name="All Projects"
            isSelected={projectId === undefined || projectId === null}
            onSelect={() => handleProjectSelect(undefined)}
          />
          
          <ProjectSelectorItem
            id="none"
            name="No Project"
            isSelected={projectId === 'none'}
            onSelect={handleProjectSelect}
          />
          
          <ProjectSelectorItem
            id="create-new"
            name="Create New Project"
            isSelected={false}
            onSelect={handleProjectSelect}
            icon={<FolderPlus className="h-4 w-4 text-primary" />}
          />
        </CommandGroup>
        
        {/* Only render projects section if there are actually projects */}
        {hasProjects && (
          <Fragment>
            <CommandSeparator />
            <CommandGroup heading="Your Projects">
              {safeProjects.map((project) => (
                <ProjectSelectorItem
                  key={project.id || `fallback-${Math.random()}`}
                  id={project.id || ''}
                  name={project.name || 'Unnamed Project'}
                  color={project.color}
                  isSelected={projectId === project.id}
                  onSelect={handleProjectSelect}
                />
              ))}
            </CommandGroup>
          </Fragment>
        )}
      </CommandList>
    </Command>
  );
}
