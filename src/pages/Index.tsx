
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { TaskList, KanbanBoard, ViewToggle, FloatingActionButton } from '@/components/tasks';
import { CalendarView } from '@/components/calendar';
import { IntegrationsSettings } from '@/components/settings';
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
  SidebarFooter
} from '@/components/ui/sidebar';
import { ProjectSelector, ProjectList } from '@/components/projects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, List, KanbanSquare, Settings } from 'lucide-react';

export default function Index() {
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<string>('tasks');
  
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
              </SidebarGroupLabel>
              <SidebarGroupContent className="space-y-1">
                <ProjectList />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset className="p-6">
          <div className="w-full max-w-5xl mx-auto">
            <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">
                  {activeTab === 'tasks' && 'My Tasks'}
                  {activeTab === 'calendar' && 'Calendar'}
                  {activeTab === 'integrations' && 'Integrations'}
                </h1>
                <div className="flex items-center gap-2">
                  <TabsList>
                    <TabsTrigger value="tasks" className="flex items-center gap-1">
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">Tasks</span>
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      <span className="hidden sm:inline">Calendar</span>
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex items-center gap-1">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Integrations</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {activeTab === 'tasks' && (
                    <ViewToggle activeView={activeView} onViewChange={setActiveView} />
                  )}
                </div>
              </div>
              
              <TabsContent value="tasks" className="mt-0">
                {activeView === 'list' ? (
                  <TaskList />
                ) : (
                  <KanbanBoard />
                )}
              </TabsContent>
              
              <TabsContent value="calendar" className="mt-0">
                <CalendarView />
              </TabsContent>
              
              <TabsContent value="integrations" className="mt-0">
                <IntegrationsSettings />
              </TabsContent>
            </Tabs>
            
            {activeTab === 'tasks' && <FloatingActionButton />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
