import { useProjectStore, useTaskStore } from '@/store';
import { Task } from '@/types/task';
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarGroupAction
} from '@/components/ui/sidebar';
import { 
  Layers, 
  FolderPlus, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  FileQuestion,
  RefreshCw,
  Database
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { ProjectDialog } from './ProjectDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export function ProjectList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { projects, selectedProjectId, selectProject, deleteProject } = useProjectStore();
  const { filters, setFilters, tasks, refreshTaskCounts, fetchTasks, diagnosticDatabaseQuery } = useTaskStore();
  
  useEffect(() => {
    console.log(`ProjectList: Rendering with ${tasks.length} tasks`);
  }, [tasks.length]);
  
  const taskCounts = useMemo(() => {
    console.log(`Computing task counts for ${tasks.length} tasks`);
    const counts: Record<string, number> = {};
    
    tasks.forEach((task: Task) => {
      const projectId = task.projectId || 'none';
      counts[projectId] = (counts[projectId] || 0) + 1;
    });
    
    console.log('Task counts by project (from useMemo):', counts);
    return counts;
  }, [tasks]);
  
  const totalTaskCount = useMemo(() => {
    const count = tasks.length;
    console.log(`Total task count: ${count}`);
    return count;
  }, [tasks]);
  
  const noProjectTaskCount = useMemo(() => {
    const count = tasks.filter(task => !task.projectId).length;
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
  
  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium">Projects</h4>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={handleDiagnosticQuery}
            disabled={isRefreshing}
            title="Run Database Diagnostic"
          >
            <Database className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Database Diagnostic</span>
          </Button>
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
        </div>
      </div>
      
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={selectedProjectId === null}
            onClick={() => handleSelectProject(null)}
          >
            <Layers className="w-4 h-4" />
            <span>All Projects</span>
            <SidebarMenuBadge>{totalTaskCount}</SidebarMenuBadge>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={selectedProjectId === 'none'}
            onClick={() => handleSelectProject('none')}
          >
            <FileQuestion className="w-4 h-4" />
            <span>No Project</span>
            <SidebarMenuBadge>{noProjectTaskCount}</SidebarMenuBadge>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        {projects.map((project) => (
          <SidebarMenuItem key={project.id}>
            <SidebarMenuButton 
              isActive={selectedProjectId === project.id}
              onClick={() => handleSelectProject(project.id)}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
              <span>{project.name}</span>
              <SidebarMenuBadge>{taskCounts[project.id] || 0}</SidebarMenuBadge>
              
              <SidebarMenuAction asChild showOnHover>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:bg-destructive/10" 
                      onClick={() => setProjectToDelete(project.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuAction>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        
        <SidebarMenuItem>
          <SidebarMenuButton 
            onClick={() => setCreateDialogOpen(true)}
            className="text-primary hover:text-primary"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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
  );
}
