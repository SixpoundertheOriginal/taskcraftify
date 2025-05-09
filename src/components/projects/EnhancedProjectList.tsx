import { useState, useEffect, useMemo } from 'react';
import { useProjectStore, useTaskStore } from '@/store';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { Project } from '@/types/project';
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarGroupAction,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { 
  Layers, 
  FolderPlus, 
  Pencil, 
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  Star,
  Clock,
  Info,
  Filter,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
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

export function EnhancedProjectList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [allProjectsOpen, setAllProjectsOpen] = useState(true);
  const [projectInfoId, setProjectInfoId] = useState<string | null>(null);
  
  const { projects, selectedProjectId, selectProject, deleteProject } = useProjectStore();
  const { filters, setFilters, tasks, refreshTaskCounts, fetchTasks } = useTaskStore();
  
  const [recentProjects, setRecentProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentProjects');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [pinnedProjects, setPinnedProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteProjects');
    return saved ? JSON.parse(saved) : [];
  });
  
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
    localStorage.setItem('favoriteProjects', JSON.stringify(pinnedProjects));
  }, [pinnedProjects]);
  
  const { items: sortedProjects, onDragEnd } = useDndSortable(projects);
  
  const projectStats = useMemo(() => {
    const stats: Record<string, {
      total: number,
      urgent: number,
      high: number,
      done: number,
      inProgress: number,
      completion: number
    }> = {};
    
    projects.forEach(project => {
      stats[project.id] = {
        total: 0,
        urgent: 0,
        high: 0,
        done: 0,
        inProgress: 0,
        completion: 0
      };
    });
    
    stats['all'] = { total: 0, urgent: 0, high: 0, done: 0, inProgress: 0, completion: 0 };
    
    tasks.forEach((task: Task) => {
      const projectId = task.projectId ?? 'none';
      
      stats['all'].total++;
      if (projectId !== 'none' && stats[projectId]) stats[projectId].total++;
      
      if (task.priority === TaskPriority.URGENT) {
        stats['all'].urgent++;
        if (projectId !== 'none' && stats[projectId]) stats[projectId].urgent++;
      }
      
      if (task.priority === TaskPriority.HIGH) {
        stats['all'].high++;
        if (projectId !== 'none' && stats[projectId]) stats[projectId].high++;
      }
      
      if (task.status === TaskStatus.DONE) {
        stats['all'].done++;
        if (projectId !== 'none' && stats[projectId]) stats[projectId].done++;
      }
      
      if (task.status === TaskStatus.IN_PROGRESS) {
        stats['all'].inProgress++;
        if (projectId !== 'none' && stats[projectId]) stats[projectId].inProgress++;
      }
    });
    
    Object.keys(stats).forEach(id => {
      if (stats[id].total > 0) {
        stats[id].completion = Math.round((stats[id].done / stats[id].total) * 100);
      }
    });
    
    return stats;
  }, [tasks, projects]);
  
  const totalTaskCount = useMemo(() => {
    return projectStats['all']?.total || 0;
  }, [projectStats]);
  
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
      
      if (pinnedProjects.includes(projectToDelete)) {
        setPinnedProjects(prev => prev.filter(id => id !== projectToDelete));
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
      await fetchTasks();
      setTimeout(() => refreshTaskCounts(), 300);
      
      toast({
        title: "Task counts refreshed",
        description: "Project statistics have been updated.",
      });
    } catch (error) {
      console.error("Error during refresh:", error);
      toast({
        title: "Refresh failed",
        description: "There was a problem refreshing the task counts.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };
  
  const togglePinned = (projectId: string) => {
    setPinnedProjects(prev => {
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
  
  const renderTaskStats = (id: string) => {
    const stats = id === 'all' ? projectStats['all'] : projectStats[id];
    
    if (!stats) return null;
    
    return (
      <div className="flex items-center gap-0.5 ml-auto">
        {stats.urgent > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <AlertCircle className="h-3 w-3 text-priority-urgent" />
                <span className="text-[10px] font-medium ml-0.5 text-priority-urgent">
                  {stats.urgent}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stats.urgent} urgent {stats.urgent === 1 ? 'task' : 'tasks'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {stats.high > 0 && stats.urgent === 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <AlertTriangle className="h-3 w-3 text-priority-high" />
                <span className="text-[10px] font-medium ml-0.5 text-priority-high">
                  {stats.high}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stats.high} high priority {stats.high === 1 ? 'task' : 'tasks'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {stats.inProgress > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center ml-1">
                <Clock className="h-3 w-3 text-status-in-progress" />
                <span className="text-[10px] font-medium ml-0.5 text-status-in-progress">
                  {stats.inProgress}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stats.inProgress} in progress {stats.inProgress === 1 ? 'task' : 'tasks'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        <span className="ml-1.5 tabular-nums text-xs font-medium text-muted-foreground">
          {stats.total}
        </span>
      </div>
    );
  };
  
  const renderProgressBar = (id: string) => {
    const stats = projectStats[id];
    if (!stats || stats.total === 0) return null;
    
    return (
      <div className="mt-1 h-1 bg-muted/40 rounded-full overflow-hidden">
        <div 
          className="h-full bg-sidebar-primary/70" 
          style={{ width: `${stats.completion}%` }}
        />
      </div>
    );
  };
  
  const renderProjectItem = (project: Project, isPinned = false) => (
    <SidebarMenuItem 
      key={project.id} 
      className="group relative transition-all duration-200"
    >
      <div 
        className="sidebar-item-indicator" 
        data-active={selectedProjectId === project.id}
      />
      <SidebarMenuButton 
        isActive={selectedProjectId === project.id}
        onClick={() => handleSelectProject(project.id)}
        className={cn(
          "group relative pl-6 pr-2 transition-all hover:pl-7",
          selectedProjectId === project.id && "sidebar-item-active"
        )}
      >
        <div className="relative">
          <div 
            className="absolute left-0 top-1/2 -ml-4 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all group-hover:scale-110" 
            style={{ backgroundColor: project.color }}
          />
          <span className="truncate max-w-[120px] inline-block font-medium">
            {project.name}
          </span>
        </div>
        
        {renderTaskStats(project.id)}
        
        <div className="absolute right-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 z-20 bg-sidebar/80 backdrop-blur-sm rounded-full p-0.5">
          {isPinned ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 rounded-full p-0 text-yellow-400 hover:text-yellow-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinned(project.id);
                  }}
                >
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="sr-only">Unpin</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove from pinned</p>
              </TooltipContent>
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
                    togglePinned(project.id);
                  }}
                >
                  <Star className="h-3.5 w-3.5" />
                  <span className="sr-only">Pin</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to pinned</p>
              </TooltipContent>
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
                  handleEditProject(project.id);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit project</p>
            </TooltipContent>
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
            <TooltipContent>
              <p>Delete project</p>
            </TooltipContent>
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
            <TooltipContent>
              <p>Project details</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarMenuButton>
      
      {renderProgressBar(project.id)}
      
      {projectInfoId === project.id && project.description && (
        <div className="mx-4 my-1 rounded-md bg-card/50 p-2 text-xs text-card-foreground border border-border/50">
          {project.description}
        </div>
      )}
    </SidebarMenuItem>
  );
  
  const pinnedProjectItems = useMemo(() => 
    pinnedProjects
      .map(id => projects.find(p => p.id === id))
      .filter(Boolean) as Project[],
    [pinnedProjects, projects]
  );
  
  const recentProjectItems = useMemo(() => 
    recentProjects
      .filter(id => !pinnedProjects.includes(id))
      .map(id => projects.find(p => p.id === id))
      .filter(Boolean) as Project[],
    [recentProjects, pinnedProjects, projects]
  );
  
  const otherProjects = useMemo(() => 
    projects.filter(p => 
      !pinnedProjects.includes(p.id) && 
      !recentProjects.includes(p.id)
    ),
    [projects, pinnedProjects, recentProjects]
  );
  
  return (
    <TooltipProvider delayDuration={300}>
      <>
        <div className="sidebar-section-header flex items-center mt-2 mb-1 px-2 select-none">
          <span className="uppercase tracking-widest text-xs font-semibold text-muted-foreground">
            Projects
          </span>
          <kbd className="ml-2 rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            Alt+↑↓
          </kbd>
        </div>
        
        <div className="flex gap-1 px-2 mb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 border-dashed border-sidebar-border text-sidebar-foreground/70 hover:text-sidebar-primary rounded-md shadow-sm"
                onClick={handleRefreshCounts}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh Counts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Refresh Counts</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 border-sidebar-border text-sidebar-primary border-sidebar-primary/30 hover:border-sidebar-primary/70 hover:bg-sidebar-primary/10 rounded-md"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only">New Project</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Project (Ctrl+N)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 ml-auto border-sidebar-border text-sidebar-foreground/70 hover:text-sidebar-foreground rounded-md"
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="sr-only">Filter Projects</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Filter Projects</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="mb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="sidebar-item-indicator" data-active={selectedProjectId === null} />
              <SidebarMenuButton 
                isActive={selectedProjectId === null}
                onClick={() => handleSelectProject(null)}
                className={cn(
                  "group relative pl-6 transition-all sidebar-item-active:bg-muted/60 rounded-md font-semibold",
                  selectedProjectId === null && "sidebar-item-active"
                )}
              >
                <Layers className="w-4 h-4 mr-2" />
                <span className="font-semibold">All Projects</span>
                {renderTaskStats('all')}
              </SidebarMenuButton>
              {renderProgressBar('all')}
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        
        <SidebarSeparator className="my-2 bg-muted/60" />
        
        {pinnedProjectItems.length > 0 && (
          <Collapsible 
            open={pinnedOpen} 
            onOpenChange={setPinnedOpen}
            className="space-y-1 mb-2"
          >
            <div className="flex items-center px-2">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-1 py-1 gap-1 -ml-1 bg-soft-yellow/70 border border-yellow-100 rounded text-sidebar-foreground hover:bg-yellow-50 hover:text-sidebar-foreground"
                >
                  {pinnedOpen ? 
                    <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/70" /> : 
                    <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/70" />
                  }
                  <span className="text-xs font-semibold uppercase tracking-widest">Pinned</span>
                </Button>
              </CollapsibleTrigger>
              <Badge 
                variant="outline" 
                className="ml-auto h-5 text-[10px] font-normal py-0 px-1.5 border-sidebar-border bg-soft-yellow/50"
              >
                {pinnedProjectItems.length}
              </Badge>
            </div>
            
            <CollapsibleContent className="space-y-1">
              <SidebarMenu className="pl-3">
                {pinnedProjectItems.map(project => 
                  renderProjectItem(project, true)
                )}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {recentProjectItems.length > 0 && (
          <Collapsible 
            open={recentOpen} 
            onOpenChange={setRecentOpen}
            className="space-y-1 mb-2"
          >
            <div className="flex items-center px-2">
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-1 py-1 gap-1 -ml-1 bg-soft-blue/60 border border-blue-100 rounded text-sidebar-foreground hover:bg-blue-50 hover:text-sidebar-foreground"
                >
                  {recentOpen ? 
                    <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/70" /> : 
                    <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/70" />
                  }
                  <span className="text-xs font-semibold uppercase tracking-widest">Recent</span>
                </Button>
              </CollapsibleTrigger>
              <Badge 
                variant="outline" 
                className="ml-auto h-5 text-[10px] font-normal py-0 px-1.5 border-sidebar-border bg-soft-blue/40"
              >
                {recentProjectItems.length}
              </Badge>
            </div>
            
            <CollapsibleContent className="space-y-1">
              <SidebarMenu className="pl-3">
                {recentProjectItems.map(project => (
                  <SidebarMenuItem key={project.id}>
                    <div 
                      className="sidebar-item-indicator" 
                      data-active={selectedProjectId === project.id}
                    />
                    <SidebarMenuButton 
                      isActive={selectedProjectId === project.id}
                      onClick={() => handleSelectProject(project.id)}
                      className={cn(
                        "group relative pl-6 transition-all sidebar-item-active:bg-muted/40 rounded-md",
                        selectedProjectId === project.id && "sidebar-item-active"
                      )}
                    >
                      <div className="relative flex items-center">
                        <div 
                          className="absolute left-0 top-1/2 -ml-4 h-2 w-2 -translate-y-1/2 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        <Clock className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                        <span className="truncate max-w-[100px] inline-block">
                          {project.name}
                        </span>
                      </div>
                      {renderTaskStats(project.id)}
                    </SidebarMenuButton>
                    {renderProgressBar(project.id)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        <Collapsible 
          open={allProjectsOpen} 
          onOpenChange={setAllProjectsOpen}
          className="space-y-1"
        >
          <div className="flex items-center px-2">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-1 py-1 gap-1 -ml-1 dark:bg-soft-gray/30 bg-soft-gray/60 border border-gray-100 rounded text-sidebar-foreground hover:bg-gray-50 hover:text-sidebar-foreground"
              >
                {allProjectsOpen ? 
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/70" /> : 
                  <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/70" />
                }
                <span className="text-xs font-semibold uppercase tracking-widest">All Projects</span>
              </Button>
            </CollapsibleTrigger>
            <Badge 
              variant="outline" 
              className="ml-auto h-5 text-[10px] font-normal py-0 px-1.5 border-sidebar-border bg-soft-gray/40"
            >
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
              <SidebarMenu className="pl-3">
                {otherProjects.length > 0 ? (
                  otherProjects.map(project => renderProjectItem(project))
                ) : (
                  <div className="text-xs text-muted-foreground py-2 px-4">
                    All your projects are in the Pinned or Recent sections above.
                  </div>
                )}
                
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setCreateDialogOpen(true)}
                    className="text-sidebar-primary hover:text-sidebar-primary transition-all mt-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="font-medium">New Project</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </CollapsibleContent>
        </Collapsible>
        
        <SidebarSeparator className="my-3 bg-muted/60 rounded" />
        
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
