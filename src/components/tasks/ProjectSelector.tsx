
import React, { useState } from 'react';
import { useProjectStore } from '@/store';
import { cn } from '@/lib/utils';
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
  projectId?: string;
  onProjectSelect?: (id: string | undefined) => void;
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
  const { selectedProjectId, projects = [], selectProject } = useProjectStore();
  const { fetchTasksByProject, setFilters, filters, fetchTasks } = useTaskStore();
  
  // To prevent initialization issues, ensure projects is an array
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  // Use the passed projectId if provided, otherwise use the global selected project
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
      
      // Update filters based on project selection
      const newFilters = { ...filters };
      
      if (id === null) {
        // Remove project filter when "All Projects" is selected
        const { projectId, ...restFilters } = newFilters;
        setFilters(restFilters);
        
        // Fetch all tasks when "All Projects" is selected
        await fetchTasks();
      } else {
        // Set project filter when specific project or "No Project" is selected
        newFilters.projectId = id === 'none' ? 'none' : id;
        setFilters(newFilters);
        
        // Fetch tasks for the selected project
        await fetchTasksByProject(id);
      }
    } else {
      // Call the provided handler with the selected project id
      onProjectSelect(id === null ? undefined : id);
    }
    
    setOpen(false);
  };
  
  const project = effectiveProjectId && effectiveProjectId !== 'none'
    ? safeProjects.find((p) => p.id === effectiveProjectId)
    : null;
  
  let displayName = 'All Projects';
  if (effectiveProjectId === 'none') {
    displayName = 'No Project';
  } else if (project) {
    displayName = project.name || 'Unnamed Project';
  }
  
  if (buttonClassName !== undefined || triggerClassName !== undefined) {
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
          
          {safeProjects.length > 0 && safeProjects.map(project => (
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
