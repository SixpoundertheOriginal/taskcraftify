
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { TaskList, KanbanBoard, ViewToggle, FloatingActionButton } from '@/components/tasks';
import { ViewMode } from '@/components/tasks/ViewToggle';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent,
  SidebarInset,
  SidebarFooter,
  SidebarGroupAction
} from '@/components/ui/sidebar';
import { Settings } from 'lucide-react';
import { ProjectSelector, ProjectList } from '@/components/projects';
import { Button } from '@/components/ui/button';

export default function Index() {
  const [activeView, setActiveView] = useState<ViewMode>('list');
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar variant="inset">
          <SidebarHeader className="flex flex-col gap-2 pt-6">
            <div className="flex items-center px-2">
              <h1 className="text-xl font-semibold">TaskCraft</h1>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="pt-6">
            <div className="px-2 mb-4">
              <ProjectSelector />
            </div>
            
            <SidebarGroup>
              <SidebarGroupLabel>
                Projects
                <SidebarGroupAction asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Project Settings</span>
                  </Button>
                </SidebarGroupAction>
              </SidebarGroupLabel>
              <SidebarGroupContent className="space-y-1">
                <ProjectList />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset className="p-6">
          <div className="w-full max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">My Tasks</h1>
              <div className="flex items-center gap-2">
                <ViewToggle activeView={activeView} onViewChange={setActiveView} />
              </div>
            </div>
            
            {activeView === 'list' ? (
              <TaskList />
            ) : (
              <KanbanBoard />
            )}
            
            <FloatingActionButton />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
