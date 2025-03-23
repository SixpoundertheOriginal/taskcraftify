
import { useProjectStore, useTaskStore } from '@/store';
import { Task } from '@/types/task';
import { 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge
} from '@/components/ui/sidebar';
import { 
  Layers, 
  FolderPlus, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  FileQuestion
} from 'lucide-react';
import { useState } from 'react';
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

export function ProjectList() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const { projects, selectedProjectId, selectProject, deleteProject } = useProjectStore();
  const { filters, setFilters, tasks } = useTaskStore();
  
  // Count tasks by project
  const taskCounts = tasks.reduce((acc: Record<string, number>, task: Task) => {
    const projectId = task.projectId || 'none';
    acc[projectId] = (acc[projectId] || 0) + 1;
    return acc;
  }, {});
  
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
      
      // If the deleted project was selected, reset to all projects
      if (selectedProjectId === projectToDelete) {
        handleSelectProject(null);
      }
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
  
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={selectedProjectId === null}
            onClick={() => handleSelectProject(null)}
          >
            <Layers className="w-4 h-4" />
            <span>All Projects</span>
            <SidebarMenuBadge>{tasks.length}</SidebarMenuBadge>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <SidebarMenuItem>
          <SidebarMenuButton 
            isActive={selectedProjectId === 'none'}
            onClick={() => handleSelectProject('none')}
          >
            <FileQuestion className="w-4 h-4" />
            <span>No Project</span>
            <SidebarMenuBadge>{taskCounts['none'] || 0}</SidebarMenuBadge>
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
      
      {/* Project Creation Dialog */}
      <ProjectDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      
      {/* Project Edit Dialog */}
      {projectToEdit && (
        <ProjectDialog 
          open={Boolean(projectToEdit)}
          onOpenChange={(open) => {
            if (!open) setProjectToEdit(null);
          }}
          projectToEdit={projects.find(p => p.id === projectToEdit)}
        />
      )}
      
      {/* Project Delete Confirmation */}
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
