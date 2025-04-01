
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
  const { projects, selectedProjectId, selectProject } = useProjectStore();
  const { fetchTasksByProject } = useTaskStore();
  
  const [open, setOpen] = useState(false);
  
  const handleOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
  };
  
  const handleSelectProject = async (id: string | null) => {
    console.log("ProjectSelector - Project selected:", id);
    selectProject(id);
    
    // If a project is selected, fetch its tasks
    if (id) {
      await fetchTasksByProject(id);
    }
    
    // If "No Project" is selected, fetch tasks with no project
    if (id === 'none') {
      await fetchTasksByProject('none');
    }
    
    setOpen(false);
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("gap-2", buttonClassName)} aria-label="Select project">
          {selectedProjectId === null
            ? "All Projects"
            : selectedProjectId === 'none'
              ? "No Project"
              : projects.find(p => p.id === selectedProjectId)?.name || "Select Project"}
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
        
        {projects.map(project => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleSelectProject(project.id)}
            className={cn(
              "flex items-center gap-2",
              selectedProjectId === project.id && "font-medium bg-accent"
            )}
          >
            <FolderInput className="h-4 w-4 text-muted-foreground" />
            {project.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
