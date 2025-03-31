import { useState, useEffect, useRef } from 'react';
import { useProjectStore, useTaskStore } from '@/store';
import { Task, countTasksByProject } from '@/types/task';
import { Project } from '@/types/project';
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroupAction,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { 
  Layers, 
  FolderPlus, 
  Pencil, 
  Trash2,
  FileQuestion,
  RefreshCw,
  Database,
  ChevronDown,
  ChevronRight,
  Plus,
  Star,
  Clock,
  PanelLeft,
  Grip,
  Info,
  FolderTree,
  FolderRoot,
  FolderClosed,
  FolderOpen
} from 'lucide-react';
import { useMemo, useCallback } from 'react';
import { ProjectDialog } from './ProjectDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDndSortable } from '@/hooks/use-dnd-sortable';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export function ProjectList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentOpen, setRecentOpen] = useState(true);
  const [favoriteOpen, setFavoriteOpen] = useState(true);
  const [allProjectsOpen, setAllProjectsOpen] = useState(true);
  const [projectInfoId, setProjectInfoId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  
  const { projects, selectedProjectId, selectProject, deleteProject, updateProject } = useProjectStore();
  const { filters, setFilters, tasks, refreshTaskCounts, fetchTasks, diagnosticDatabaseQuery } = useTaskStore();
  
  const [recentProjects, setRecentProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentProjects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [favoriteProjects, setFavoriteProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteProjects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const projectHierarchy = useMemo(() => {
    const topLevelProjects: Project[] = [];
    const childrenMap: Record<string, Project[]> = {};
    
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
  
  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };
  
  const hasChildren = (projectId: string) => {
    return projectHierarchy.childrenMap[projectId] && projectHierarchy.childrenMap[projectId].length > 0;
  };
  
  const getAllDescendantIds = (projectId: string): string[] => {
    const children = projectHierarchy.childrenMap[projectId] || [];
    let descendants = children.map(child => child.id);
    
    children.forEach(child => {
      descendants = [...descendants, ...getAllDescendantIds(child.id)];
    });
    
    return descendants;
  };
  
  const getProjectTotalTaskCount = (projectId: string): number => {
    const directCount = taskCounts[projectId] || 0;
    const descendantIds = getAllDescendantIds(projectId);
    const descendantCount = descendantIds.reduce((total, id) => total + (taskCounts[id] || 0), 0);
    return directCount + descendantCount;
  };
  
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== 'none') {
      setRecentProjects(prev => {
        const filtered = prev.filter(id => id !== selectedProjectId);
        const updated = [selectedProjectId, ...filtered].slice(0, 5);
        localStorage.setItem('recentProjects', JSON.stringify(updated));
        return updated;
      });
    }
  }, [selectedProjectId]);
  
  useEffect(() => {
    localStorage.setItem('favoriteProjects', JSON.stringify(favoriteProjects));
  }, [favoriteProjects]);
  
  const { items: sortedProjects, onDragEnd } = useDndSortable(projects);
  
  useEffect(() => {
    console.log(`ProjectList: Rendering with ${tasks.length} tasks`);
  }, [tasks.length]);
  
  const taskCounts = useMemo(() => {
    console.log(`Computing task counts for ${tasks.length} tasks`);
    const counts: Record<string, number> = {};
    
    tasks.forEach((task: Task) => {
      const projectId = task.projectId ?? 'none';
      counts[projectId] = (counts[projectId] || 0) + 1;
    });
    
    console.log('Task counts by project (from useMemo):', counts);
    return counts;
  }, [tasks]);
  
  const totalTaskCount = useMemo(() => {
    const count = countTasksByProject(tasks, undefined);
    console.log(`Total task count: ${count}`);
    return count;
  }, [tasks]);
  
  const noProjectTaskCount = useMemo(() => {
    const count = countTasksByProject(tasks, null);
    console.log(`No project task count: ${count}`);
    return count;
  }, [tasks]);
  
  const handleSelectProject = (projectId: string | null) => {
    selectProject(projectId);
    setFilters({
      ...filters,
      projectId: projectId === 'none' ? 'none' : projectId
    });
  };
  
  const handleEditProject = (projectId: string) => {
    setProjectToEdit(projectId);
  };
  
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject(projectToDelete);
      
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
      
      if (selectedProjectId === projectToDelete) {
        handleSelectProject(null);
      }
      
      if (favoriteProjects.includes(projectToDelete)) {
        setFavoriteProjects(prev => prev.filter(id => id !== projectToDelete));
      }
      
      if (recentProjects.includes(projectToDelete)) {
        setRecentProjects(prev => prev.filter(id => id !== projectToDelete));
      }
      
      setTimeout(() => {
        refreshTaskCounts();
      }, 500);
    } catch (error) {
      toast({
        title: "Failed to delete project",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setProjectToDelete(null);
    }
  };
  
  const handleRefreshCounts = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('----------------------------------------');
      console.log('MANUAL REFRESH INITIATED FROM PROJECT LIST UI');
      console.log('Timestamp:', new Date().toISOString());
      console.log('----------------------------------------');
      
      await fetchTasks();
      
      setTimeout(() => {
        refreshTaskCounts();
      }, 300);
      
      toast({
        title: "Task counts refreshed",
        description: "Project counters have been updated with the latest data.",
      });
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast({
        title: "Refresh failed",
        description: "There was a problem refreshing the task counts.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };
  
  const handleDiagnosticQuery = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('----------------------------------------');
      console.log('DIRECT DATABASE DIAGNOSTIC INITIATED');
      console.log('Timestamp:', new Date().toISOString());
      console.log('----------------------------------------');
      
      await diagnosticDatabaseQuery();
      
      console.log('----------------------------------------');
      console.log('TESTING countTasksByProject FUNCTION:');
      console.log('----------------------------------------');
      console.log(`All tasks (undefined): ${countTasksByProject(tasks, undefined)}`);
      console.log(`Null project (null): ${countTasksByProject(tasks, null)}`);
      console.log(`No project ('none'): ${countTasksByProject(tasks, 'none')}`);
      
      if (projects.length > 0) {
        const sampleProjectId = projects[0].id;
        console.log(`Project ${sampleProjectId}: ${countTasksByProject(tasks, sampleProjectId)}`);
      }
      
      console.log('----------------------------------------');
      
      toast({
        title: "Database diagnostic completed",
        description: "Check the console for detailed information.",
      });
    } catch (error) {
      console.error("Error during database diagnostic:", error);
      toast({
        title: "Diagnostic failed",
        description: "There was a problem querying the database.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };
  
  const toggleFavorite = (projectId: string) => {
    setFavoriteProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };
  
  const getProjectById = (id: string) => {
    return projects.find(p => p.id === id);
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setCreateDialogOpen(true);
        return;
      }
      
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        
        const visibleProjects = sortedProjects.map(p => p.id);
        const currentIndex = selectedProjectId ? visibleProjects.indexOf(selectedProjectId) : -1;
        
        let newIndex;
        if (e.key === 'ArrowUp') {
          newIndex = currentIndex <= 0 ? visibleProjects.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex === visibleProjects.length - 1 || currentIndex === -1 ? 0 : currentIndex + 1;
        }
        
        if (visibleProjects[newIndex]) {
          handleSelectProject(visibleProjects[newIndex]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProjectId, sortedProjects, handleSelectProject]);
  
  const renderProjectHierarchy = (project: Project, isFavorite = false, level = 0) => {
    const hasChildProjects = hasChildren(project.id);
    const isExpanded = Boolean(expandedProjects[project.id]);
    const childProjects = projectHierarchy.childrenMap[project.id] || [];
    const totalTaskCount = getProjectTotalTaskCount(project.id);
    
    return (
      <div key={project.id} className="relative">
        <SidebarMenuItem className="group relative transition-all duration-200">
          <div 
            className="absolute left-0 top-1/2 h-[60%] w-0.5 -translate-y-1/2 rounded-r-full bg-primary/70 opacity-0 transition-opacity data-[active=true]:opacity-100" 
            data-active={selectedProjectId === project.id}
          />
          
          <div className="relative flex items-center w-full">
            {hasChildProjects && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0.5 ml-0 mr-1 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleProjectExpansion(project.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            
            <SidebarMenuButton 
              isActive={selectedProjectId === project.id}
              onClick={() => handleSelectProject(project.id)}
              className={cn(
                "group relative pl-2 pr-20 transition-all hover:pl-3",
                hasChildProjects ? "" : "ml-6"
              )}
            >
              <div className="relative">
                <div 
                  className="absolute left-0 top-1/2 -ml-4 h-2 w-2 -translate-y-1/2 rounded-full transition-all group-hover:scale-110" 
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate max-w-[140px] inline-block">{project.name}</span>
              </div>
              
              <SidebarMenuBadge className="absolute right-3 transition-all z-10">
                {totalTaskCount || 0}
              </SidebarMenuBadge>
              
              <div className="absolute right-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 z-20 bg-card/80 rounded-full">
                {isFavorite ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded-full p-0 text-yellow-400 hover:text-yellow-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(project.id);
                        }}
                      >
                        <Star className="h-3.5 w-3.5" />
                        <span className="sr-only">Unfavorite</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Unfavorite</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded-full p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(project.id);
                        }}
                      >
                        <Star className="h-3.5 w-3.5" />
                        <span className="sr-only">Favorite</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Favorite</TooltipContent>
                  </Tooltip>
                )}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 rounded-full p-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToEdit(project.id);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 rounded-full p-0 text-muted-foreground hover:text-destructive" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 rounded-full p-0 text-muted-foreground hover:text-foreground" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectInfoId(projectInfoId === project.id ? null : project.id);
                      }}
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span className="sr-only">Info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Info</TooltipContent>
                </Tooltip>
              </div>
            </SidebarMenuButton>
          </div>
          
          {projectInfoId === project.id && project.description && (
            <div className="mx-4 my-1 rounded-md bg-card/50 p-2 text-xs text-card-foreground">
              {project.description}
            </div>
          )}
        </SidebarMenuItem>
        
        {hasChildProjects && isExpanded && (
          <div className="pl-6 ml-1 border-l border-dashed border-border/30 my-0.5">
            {childProjects.map(childProject => 
              renderProjectHierarchy(childProject, favoriteProjects.includes(childProject.id), level + 1)
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <TooltipProvider delayDuration={300}>
      <>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <h4 className="text-sm font-medium">Projects</h4>
            <kbd className="ml-2 rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              Alt+↑↓
            </kbd>
          </div>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={handleDiagnosticQuery}
                  disabled={isRefreshing}
                >
                  <Database className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Database Diagnostic</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Database Diagnostic</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={handleRefreshCounts}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh Counts</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh Counts</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-primary" 
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">New Project</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Project (Ctrl+N)</TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        <div className="space-y-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={selectedProjectId === null}
                onClick={() => handleSelectProject(null)}
                className="group relative pl-6"
              >
                <div className="absolute left-0 top-1/2 h-[60%] w-0.5 -translate-y-1/2 rounded-r-full bg-primary/70 opacity-0 transition-opacity data-[active=true]:opacity-100" 
                  data-active={selectedProjectId === null}
                />
                <Layers className="w-4 h-4" />
                <span>All Projects</span>
                <SidebarMenuBadge>{totalTaskCount}</SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={selectedProjectId === 'none'}
                onClick={() => handleSelectProject('none')}
                className="group relative pl-6"
              >
                <div className="absolute left-0 top-1/2 h-[60%] w-0.5 -translate-y-1/2 rounded-r-full bg-primary/70 opacity-0 transition-opacity data-[active=true]:opacity-100" 
                  data-active={selectedProjectId === 'none'}
                />
                <FileQuestion className="w-4 h-4" />
                <span>No Project</span>
                <SidebarMenuBadge>{noProjectTaskCount}</SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          
          {favoriteProjects.length > 0 && (
            <Collapsible 
              open={favoriteOpen} 
              onOpenChange={setFavoriteOpen}
              className="space-y-1"
            >
              <div className="flex items-center">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
                    {favoriteOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <span className="text-xs font-medium">Favorites</span>
                  </Button>
                </CollapsibleTrigger>
                <Badge variant="outline" className="ml-auto h-5 text-[10px]">
                  {favoriteProjects.length}
                </Badge>
              </div>
              
              <CollapsibleContent className="space-y-1">
                <SidebarMenu className="pl-2">
                  {favoriteProjects.map(id => {
                    const project = getProjectById(id);
                    return project ? renderProjectHierarchy(project, true) : null;
                  })}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {recentProjects.length > 0 && (
            <Collapsible 
              open={recentOpen} 
              onOpenChange={setRecentOpen}
              className="space-y-1"
            >
              <div className="flex items-center">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
                    {recentOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <span className="text-xs font-medium">Recent</span>
                  </Button>
                </CollapsibleTrigger>
                <Badge variant="outline" className="ml-auto h-5 text-[10px]">
                  {recentProjects.length}
                </Badge>
              </div>
              
              <CollapsibleContent className="space-y-1">
                <SidebarMenu className="pl-2">
                  {recentProjects.map(id => {
                    const project = getProjectById(id);
                    return project ? (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton 
                          isActive={selectedProjectId === project.id}
                          onClick={() => handleSelectProject(project.id)}
                          className="group relative pl-6 pr-20"
                        >
                          <div className="absolute left-0 top-1/2 h-[60%] w-0.5 -translate-y-1/2 rounded-r-full bg-primary/70 opacity-0 transition-opacity data-[active=true]:opacity-100" 
                            data-active={selectedProjectId === project.id}
                          />
                          <div className="relative">
                            <div 
                              className="absolute left-0 top-1/2 -ml-4 h-2 w-2 -translate-y-1/2 rounded-full" 
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="truncate max-w-[120px] inline-block">{project.name}</span>
                          </div>
                          <div className="flex gap-1 ml-auto absolute right-3 z-10">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="tabular-nums">
                              {taskCounts[project.id] || 0}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : null;
                  })}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          <Collapsible 
            open={allProjectsOpen} 
            onOpenChange={setAllProjectsOpen}
            className="space-y-1"
          >
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 gap-1">
                  {allProjectsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  <span className="text-xs font-medium">All Projects</span>
                </Button>
              </CollapsibleTrigger>
              <Badge variant="outline" className="ml-auto h-5 text-[10px]">
                {projects.length}
              </Badge>
            </div>
            
            <CollapsibleContent className="space-y-1">
              {projects.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <FolderPlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium">No projects</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first project to organize your tasks.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Project
                  </Button>
                </div>
              ) : (
                <SidebarMenu className="pl-2">
                  {projectHierarchy.topLevelProjects.map(project => 
                    renderProjectHierarchy(project, favoriteProjects.includes(project.id))
                  )}
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setCreateDialogOpen(true)}
                      className="text-primary hover:text-primary transition-all mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Project</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <ProjectDialog 
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
        
        {projectToEdit && (
          <ProjectDialog 
            open={Boolean(projectToEdit)}
            onOpenChange={(open) => {
              if (!open) setProjectToEdit(null);
            }}
            projectToEdit={projects.find(p => p.id === projectToEdit)}
          />
        )}
        
        <AlertDialog 
          open={Boolean(projectToDelete)} 
          onOpenChange={(open) => {
            if (!open) setProjectToDelete(null);
          }}
        >
          <AlertDialogContent className="max-w-[360px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete project?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the project and remove its association from all tasks.
                Tasks will not be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProject}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </TooltipProvider>
  );
}
