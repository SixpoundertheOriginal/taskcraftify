
import { useState, useEffect, useMemo } from 'react';
import { useProjectStore, useTaskStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Check, ChevronDown, FolderPlus, Layers, Star, FileQuestion, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectDialog } from './ProjectDialog';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Project } from '@/types/project';

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
  
  // Organize projects into a hierarchy
  const projectHierarchy = useMemo(() => {
    const topLevelProjects: Project[] = [];
    const childrenMap: Record<string, Project[]> = {};
    
    // First pass: organize projects into parent-child relationships
    projects.forEach(project => {
      if (!project.parentProjectId) {
        topLevelProjects.push(project);
      } else {
        if (!childrenMap[project.parentProjectId]) {
          childrenMap[project.parentProjectId] = [];
        }
        childrenMap[project.parentProjectId].push(project);
      }
    });
    
    return { topLevelProjects, childrenMap };
  }, [projects]);
  
  // Get project path for breadcrumb display
  const getProjectPath = (projectId: string): Project[] => {
    const path: Project[] = [];
    let current = projects.find(p => p.id === projectId);
    
    while (current) {
      path.unshift(current);
      if (!current.parentProjectId) break;
      current = projects.find(p => p.id === current?.parentProjectId);
      
      // Safety check to prevent infinite loops
      if (path.some(p => p.id === current?.id)) break;
    }
    
    return path;
  };
  
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
  
  // Recursive render function for project hierarchy
  const renderProjectHierarchy = (projects: Project[], level: number = 0): React.ReactNode => {
    return projects.map(project => {
      const childProjects = projectHierarchy.childrenMap[project.id];
      const hasChildren = childProjects && childProjects.length > 0;
      
      return (
        <div key={project.id}>
          <CommandItem
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              level > 0 && `pl-${4 + level * 4}`
            )}
            onSelect={() => handleSelect(project.id)}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: project.color }}
            />
            <span className="truncate">{project.name}</span>
            {project.description && (
              <Badge variant="secondary" className="ml-auto text-[10px] px-1 py-0 flex-shrink-0">
                {project.description.length > 15 
                  ? project.description.slice(0, 15) + '...' 
                  : project.description
                }
              </Badge>
            )}
            {effectiveProjectId === project.id && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="ml-auto flex-shrink-0"
              >
                <Check className="h-4 w-4" />
              </motion.div>
            )}
          </CommandItem>
          
          {hasChildren && renderProjectHierarchy(childProjects, level + 1)}
        </div>
      );
    });
  };
  
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
              ) : effectiveProjectId && currentProject ? (
                <>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: currentProject.color }}
                  />
                  <div className="flex flex-col">
                    <span className="truncate text-sm">{currentProject.name}</span>
                    {currentProject.parentProjectId && (
                      <span className="text-xs text-muted-foreground truncate">
                        {getProjectPath(currentProject.id)
                          .slice(0, -1) // Remove the current project
                          .map(p => p.name)
                          .join(' > ')}
                      </span>
                    )}
                  </div>
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
                <CommandItem 
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={() => handleSelect(null)}
                >
                  <Layers className="h-4 w-4 opacity-70" />
                  <span>All Projects</span>
                  {!effectiveProjectId && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
                
                <CommandItem 
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={() => handleSelect('none')}
                >
                  <FileQuestion className="h-4 w-4 opacity-70" />
                  <span>No Project</span>
                  {effectiveProjectId === 'none' && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
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
                        <CommandItem
                          key={project.id}
                          className="flex items-center gap-2 cursor-pointer"
                          onSelect={() => handleSelect(project.id)}
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.name}</span>
                          {effectiveProjectId === project.id && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
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
                        <CommandItem
                          key={project.id}
                          className="flex items-center gap-2 cursor-pointer"
                          onSelect={() => handleSelect(project.id)}
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.name}</span>
                          {effectiveProjectId === project.id && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
              
              {projects.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Project Hierarchy">
                    {renderProjectHierarchy(projectHierarchy.topLevelProjects)}
                  </CommandGroup>
                </>
              )}
              
              <CommandSeparator />
              <CommandGroup>
                <CommandItem 
                  className="flex items-center gap-2 text-primary cursor-pointer"
                  onSelect={() => {
                    setOpen(false);
                    setIsProjectDialogOpen(true);
                  }}
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
