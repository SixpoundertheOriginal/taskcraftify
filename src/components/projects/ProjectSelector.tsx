
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
import { useProjectStore } from '@/store';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store';

interface ProjectSelectorProps {
  buttonClassName?: string;
  triggerClassName?: string;
}

export function ProjectSelector({ 
  buttonClassName, 
  triggerClassName 
}: ProjectSelectorProps) {
  // Ensure projects is never undefined
  const { projects = [], selectedProjectId, selectProject } = useProjectStore();
  const { fetchTasksByProject, filters, setFilters, fetchTasks } = useTaskStore();
  
  // Ensure projects is an array
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  const [open, setOpen] = useState(false);
  
  const handleOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
  };
  
  const handleSelectProject = async (id: string | null) => {
    console.log("ProjectSelector - Project selected:", id);
    selectProject(id);
    
    // Update filters based on project selection
    const newFilters = { ...filters };
    
    if (id === null) {
      // Remove project filter when "All Projects" is selected
      if (newFilters.projectId) {
        const { projectId, ...restFilters } = newFilters;
        setFilters(restFilters);
      }
      
      // Fetch all tasks when "All Projects" is selected
      console.log("ProjectSelector - Fetching all tasks after selecting 'All Projects'");
      await fetchTasks();
    } else {
      // Set project filter when specific project or "No Project" is selected
      newFilters.projectId = id === 'none' ? 'none' : id;
      setFilters(newFilters);
      
      // Fetch tasks for the selected project
      console.log(`ProjectSelector - Fetching tasks for project: ${id}`);
      await fetchTasksByProject(id);
    }
    
    setOpen(false);
  };

  // Determine the current project name to display
  let currentProjectText = "Select Project";
  if (selectedProjectId === null) {
    currentProjectText = "All Projects";
  } else if (selectedProjectId === 'none') {
    currentProjectText = "No Project";
  } else if (selectedProjectId && safeProjects.length > 0) {
    const project = safeProjects.find(p => p.id === selectedProjectId);
    if (project) {
      currentProjectText = project.name || "Unnamed Project";
    }
  }
  
  console.log("ProjectSelector - Current state:", {
    selectedProjectId,
    projectsCount: safeProjects.length,
    currentText: currentProjectText
  });
  
  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("gap-2", buttonClassName)} aria-label="Select project">
          {currentProjectText}
          <MoreHorizontal className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem 
          onClick={() => handleSelectProject(null)}
          className={cn(
            "flex items-center gap-2",
            selectedProjectId === null && "font-medium bg-accent"
          )}
        >
          <Database className="h-4 w-4 text-muted-foreground" />
          All Projects
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleSelectProject('none')}
          className={cn(
            "flex items-center gap-2",
            selectedProjectId === 'none' && "font-medium bg-accent"
          )}
        >
          <FolderInput className="h-4 w-4 text-muted-foreground" />
          No Project
        </DropdownMenuItem>
        
        {safeProjects.length > 0 && safeProjects.map(project => (
          <DropdownMenuItem
            key={project.id || `project-${Math.random()}`}
            onClick={() => handleSelectProject(project.id)}
            className={cn(
              "flex items-center gap-2",
              selectedProjectId === project.id && "font-medium bg-accent"
            )}
          >
            <FolderInput className="h-4 w-4 text-muted-foreground" />
            {project.name || "Unnamed Project"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
