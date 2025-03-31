
import { useState, useEffect } from 'react';
import { useProjectStore, useTaskStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Check, ChevronDown, FolderPlus, Layers, Star, FileQuestion, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectDialog } from './ProjectDialog';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ProjectSelectorProps {
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string | null) => void;
  buttonClassName?: string;
}

export function ProjectSelector({ 
  selectedProjectId: externalSelectedProjectId, 
  onProjectSelect,
  buttonClassName
}: ProjectSelectorProps = {}) {
  const [open, setOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const { projects, selectedProjectId: storeSelectedProjectId, selectProject } = useProjectStore();
  const { setFilters, filters } = useTaskStore();
  
  const effectiveProjectId = externalSelectedProjectId !== undefined ? externalSelectedProjectId : storeSelectedProjectId;
  
  const currentProject = projects.find(project => project.id === effectiveProjectId);
  
  const favoriteProjects = (() => {
    const saved = localStorage.getItem('favoriteProjects');
    return saved ? JSON.parse(saved) : [];
  })();
  
  const recentProjects = (() => {
    const saved = localStorage.getItem('recentProjects');
    return saved ? JSON.parse(saved) : [];
  })();
  
  const handleSelect = (projectId: string | null) => {
    console.log('ProjectSelector handleSelect called with:', projectId);
    if (onProjectSelect) {
      onProjectSelect(projectId);
    } else {
      selectProject(projectId);
      
      setFilters({
        ...filters,
        projectId: projectId === 'none' ? 'none' : projectId
      });
    }
    
    setOpen(false);
  };
  
  useEffect(() => {
    if (storeSelectedProjectId && !filters.projectId && externalSelectedProjectId === undefined) {
      setFilters({
        ...filters,
        projectId: storeSelectedProjectId
      });
    }
  }, [storeSelectedProjectId, filters, setFilters, externalSelectedProjectId]);
  
  // Create a task item component for improved clickability
  const ProjectItem = ({ 
    id, 
    name, 
    color, 
    description, 
    isSelected 
  }: { 
    id: string | null; 
    name: string; 
    color?: string; 
    description?: string; 
    isSelected: boolean;
  }) => (
    <div 
      className="flex items-center gap-2 w-full px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation(); 
        console.log(`Clicking project: ${id}, ${name}`);
        handleSelect(id);
      }}
    >
      {color ? (
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0 transition-transform hover:scale-110" 
          style={{ backgroundColor: color }}
        />
      ) : id === 'none' ? (
        <div className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-300" />
      ) : (
        <Layers className="w-4 h-4 opacity-70 flex-shrink-0" />
      )}
      
      <span className="truncate">{name}</span>
      
      {description && (
        <Badge variant="secondary" className="ml-auto text-[10px] px-1 py-0 flex-shrink-0">
          {description.length > 15 
            ? description.slice(0, 15) + '...' 
            : description
          }
        </Badge>
      )}
      
      {isSelected && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="ml-auto flex-shrink-0"
        >
          <Check className="h-4 w-4" />
        </motion.div>
      )}
    </div>
  );
  
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open}
            className={cn(
              "flex items-center justify-between w-full text-left transition-all",
              "border border-input/50 hover:border-input focus:border-input focus-visible:ring-1 focus-visible:ring-ring",
              buttonClassName
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            <div className="flex items-center gap-2 truncate">
              {effectiveProjectId === 'none' ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="truncate">No Project</span>
                </>
              ) : effectiveProjectId ? (
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
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search projects..." className="h-9" />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <div className="rounded-full bg-muted p-2 mb-2">
                    <FolderPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">No projects found</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1.5"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpen(false);
                      setIsProjectDialogOpen(true);
                    }}
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    Create New Project
                  </Button>
                </div>
              </CommandEmpty>
              
              <CommandGroup>
                <div className="px-1">
                  <ProjectItem 
                    id={null} 
                    name="All Projects" 
                    isSelected={!effectiveProjectId} 
                  />
                </div>
                
                <div className="px-1">
                  <ProjectItem 
                    id="none" 
                    name="No Project" 
                    isSelected={effectiveProjectId === 'none'} 
                  />
                </div>
              </CommandGroup>
              
              {favoriteProjects.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span>Favorites</span>
                    </div>
                  }>
                    {favoriteProjects.map(id => {
                      const project = projects.find(p => p.id === id);
                      if (!project) return null;
                      
                      return (
                        <div key={project.id} className="px-1">
                          <ProjectItem
                            id={project.id}
                            name={project.name}
                            color={project.color}
                            description={project.description}
                            isSelected={effectiveProjectId === project.id}
                          />
                        </div>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
              
              {recentProjects.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>Recent</span>
                    </div>
                  }>
                    {recentProjects.map(id => {
                      const project = projects.find(p => p.id === id);
                      if (!project) return null;
                      
                      return (
                        <div key={project.id} className="px-1">
                          <ProjectItem
                            id={project.id}
                            name={project.name}
                            color={project.color}
                            description={project.description}
                            isSelected={effectiveProjectId === project.id}
                          />
                        </div>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
              
              {projects.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="All Projects">
                    {projects.map((project) => (
                      <div key={project.id} className="px-1">
                        <ProjectItem
                          id={project.id}
                          name={project.name}
                          color={project.color}
                          description={project.description}
                          isSelected={effectiveProjectId === project.id}
                        />
                      </div>
                    ))}
                  </CommandGroup>
                </>
              )}
              
              <CommandSeparator />
              <CommandGroup>
                <div 
                  className="flex items-center gap-2 text-primary cursor-pointer w-full px-2 py-1.5 hover:bg-accent rounded-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    setIsProjectDialogOpen(true);
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Create New Project</span>
                </div>
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
