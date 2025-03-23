
import { useState, useEffect } from 'react';
import { useProjectStore, useTaskStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Check, ChevronDown, FolderPlus, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectDialog } from './ProjectDialog';

export function ProjectSelector() {
  const [open, setOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const { projects, selectedProjectId, selectProject } = useProjectStore();
  const { setFilters, filters } = useTaskStore();
  
  const currentProject = projects.find(project => project.id === selectedProjectId);
  
  const handleSelect = (projectId: string | null) => {
    selectProject(projectId);
    
    // Update task filters
    setFilters({
      ...filters,
      projectId: projectId === 'none' ? 'none' : projectId
    });
    
    setOpen(false);
  };
  
  useEffect(() => {
    // Initialize filters with the selected project
    if (selectedProjectId && !filters.projectId) {
      setFilters({
        ...filters,
        projectId: selectedProjectId
      });
    }
  }, [selectedProjectId]);
  
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedProjectId ? (
                <>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: currentProject?.color || '#6E59A5' }}
                  />
                  <span className="truncate">{currentProject?.name || 'All Projects'}</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 opacity-70" />
                  <span>All Projects</span>
                </>
              )}
            </div>
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search projects..." className="h-9" />
            <CommandList>
              <CommandEmpty>No projects found.</CommandEmpty>
              <CommandGroup>
                <CommandItem 
                  onSelect={() => handleSelect(null)}
                  className="flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 opacity-70" />
                  <span>All Projects</span>
                  {!selectedProjectId && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
                
                <CommandItem 
                  onSelect={() => handleSelect('none')}
                  className="flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span>No Project</span>
                  {selectedProjectId === 'none' && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              </CommandGroup>
              
              {projects.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Your Projects">
                    {projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        onSelect={() => handleSelect(project.id)}
                        className="flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="truncate">{project.name}</span>
                        {selectedProjectId === project.id && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setIsProjectDialogOpen(true);
                  }}
                  className="flex items-center gap-2 text-primary"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create New Project</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <ProjectDialog 
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
      />
    </>
  );
}
