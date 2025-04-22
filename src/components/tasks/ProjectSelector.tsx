
import { useProjectStore } from '@/store';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { 
  Database, 
  FolderInput, 
  MoreHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTaskStore } from '@/store';

interface ProjectSelectorProps {
  className?: string;
  projectId?: string; // Added to fix TypeScript error
  onProjectSelect?: (id: string | undefined) => void; // Added to fix TypeScript error
  buttonClassName?: string;
  triggerClassName?: string;
}

export function ProjectSelector({ 
  className,
  projectId,
  onProjectSelect,
  buttonClassName, 
  triggerClassName 
}: ProjectSelectorProps) {
  // Get the globally selected project from the store
  const { selectedProjectId, projects = [], selectProject } = useProjectStore();
  const { fetchTasksByProject } = useTaskStore();
  
  // If projectId prop is provided, use it instead of the globally selected project
  const effectiveProjectId = projectId !== undefined ? projectId : selectedProjectId;
  
  const [open, setOpen] = useState(false);
  
  const handleOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
  };
  
  const handleSelectProject = async (id: string | null) => {
    console.log("ProjectSelector - Project selected:", id);
    
    // Update the global state if no specific onProjectSelect handler is provided
    if (!onProjectSelect) {
      selectProject(id);
      
      // If a project is selected, fetch its tasks
      if (id) {
        await fetchTasksByProject(id);
      }
      
      // If "No Project" is selected, fetch tasks with no project
      if (id === 'none') {
        await fetchTasksByProject('none');
      }
    } else {
      // Call the provided handler with the selected project id
      onProjectSelect(id === null ? undefined : id);
    }
    
    setOpen(false);
  };
  
  // Find the currently selected project
  const project = effectiveProjectId && effectiveProjectId !== 'none'
    ? projects.find((p) => p.id === effectiveProjectId)
    : null;
  
  // Determine the name to display
  let displayName = 'All Projects';
  if (effectiveProjectId === 'none') {
    displayName = 'No Project';
  } else if (project) {
    displayName = project.name || 'Unnamed Project';
  }
  
  // Decide which rendering style to use based on provided props
  if (buttonClassName !== undefined || triggerClassName !== undefined) {
    // Use the dropdown menu style
    return (
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn("gap-2", buttonClassName)} aria-label="Select project">
            {displayName}
            <MoreHorizontal className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem 
            onClick={() => handleSelectProject(null)}
            className={cn(
              "flex items-center gap-2",
              effectiveProjectId === null && "font-medium bg-accent"
            )}
          >
            <Database className="h-4 w-4 text-muted-foreground" />
            All Projects
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleSelectProject('none')}
            className={cn(
              "flex items-center gap-2",
              effectiveProjectId === 'none' && "font-medium bg-accent"
            )}
          >
            <FolderInput className="h-4 w-4 text-muted-foreground" />
            No Project
          </DropdownMenuItem>
          
          {projects.length > 0 && projects.map(project => (
            <DropdownMenuItem
              key={project.id || `project-${Math.random()}`}
              onClick={() => handleSelectProject(project.id)}
              className={cn(
                "flex items-center gap-2",
                effectiveProjectId === project.id && "font-medium bg-accent"
              )}
            >
              <FolderInput className="h-4 w-4 text-muted-foreground" />
              {project.name || "Unnamed Project"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } else {
    // Use the simple display style
    return (
      <div
        className={cn(
          'px-3 py-2 text-sm font-medium rounded bg-muted flex items-center gap-2',
          className
        )}
      >
        <span>
          Project:&nbsp;
          <span className="font-semibold">{displayName}</span>
        </span>
        {project?.color && (
          <span
            className="ml-2 w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: project.color }}
          />
        )}
      </div>
    );
  }
}
