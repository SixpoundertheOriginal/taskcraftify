
import { Fragment } from 'react';
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
  const { projects } = useProjectStore();

  const handleProjectSelect = (id: string | undefined) => {
    console.log("ProjectCommandMenu - Project selected:", id);
    if (id === 'create-new') {
      setShowProjectForm(true);
      return;
    }
    
    onProjectSelect(id);
  };

  return (
    <>
      {showProjectForm ? (
        <ProjectQuickCreateForm 
          onSuccess={onProjectCreated}
          onCancel={onCancel}
        />
      ) : (
        <Command className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Search projects..." 
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            
            <CommandGroup>
              <ProjectSelectorItem
                id={undefined}
                name="All Projects"
                isSelected={projectId === undefined || projectId === null}
                onSelect={handleProjectSelect}
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
            
            {projects.length > 0 && (
              <Fragment>
                <CommandSeparator />
                <CommandGroup heading="Your Projects">
                  {projects.map((project) => (
                    <ProjectSelectorItem
                      key={project.id}
                      id={project.id}
                      name={project.name}
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
      )}
    </>
  );
}
