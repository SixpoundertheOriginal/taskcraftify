import { useState } from 'react';
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
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { ProjectSelector, EnhancedProjectList } from '@/components/projects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, List, KanbanSquare, Settings, User } from 'lucide-react';
import { QuickAddButton } from '@/components/quick-add';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PersonalizedGreeting } from '@/components/insights/PersonalizedGreeting';
import { useAuth } from '@/auth/AuthContext';
import { Link } from 'react-router-dom';

export default function Index() {
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<string>('tasks');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const { user } = useAuth();
  
  // Don't show insights panel on integrations tab
  const showInsightsPanel = activeTab !== 'integrations';
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar variant="inset" className="shadow-sidebar dark:shadow-sidebar-dark border-r border-sidebar-border/40">
          <SidebarHeader className="flex flex-col gap-2 pt-4 pb-2">
            <div className="flex items-center px-3 pb-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-sidebar-primary to-sidebar-primary/70 bg-clip-text text-transparent">
                TaskCraft
              </h1>
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>
            
            <div className="px-2">
              <QuickAddButton />
            </div>
          </SidebarHeader>
          
          <SidebarSeparator />
          
          <SidebarContent className="pt-3">
            <div className="px-2 mb-4">
              <ProjectSelector />
            </div>
            
            <SidebarGroup>
              <div className="sidebar-section-header">
                Navigation
              </div>
              <SidebarGroupContent className="space-y-1">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <div 
                      className="sidebar-item-indicator" 
                      data-active={activeTab === 'tasks'}
                    />
                    <SidebarMenuButton 
                      className={`flex items-center gap-2 ${activeTab === 'tasks' ? 'sidebar-item-active' : ''}`}
                      isActive={activeTab === 'tasks'}
                      onClick={() => setActiveTab('tasks')}
                    >
                      <List className="h-4 w-4" />
                      <span className="font-medium">Tasks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <div 
                      className="sidebar-item-indicator" 
                      data-active={activeTab === 'calendar'}
                    />
                    <SidebarMenuButton 
                      className={`flex items-center gap-2 ${activeTab === 'calendar' ? 'sidebar-item-active' : ''}`}
                      isActive={activeTab === 'calendar'}
                      onClick={() => setActiveTab('calendar')}
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span className="font-medium">Calendar</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <div 
                      className="sidebar-item-indicator" 
                      data-active={activeTab === 'integrations'}
                    />
                    <SidebarMenuButton 
                      className={`flex items-center gap-2 ${activeTab === 'integrations' ? 'sidebar-item-active' : ''}`}
                      isActive={activeTab === 'integrations'}
                      onClick={() => setActiveTab('integrations')}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Integrations</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <div className="sidebar-item-indicator" />
                    <SidebarMenuButton 
                      className="flex items-center gap-2"
                      asChild
                    >
                      <Link to="/settings">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarSeparator />
            
            <SidebarGroup>
              <EnhancedProjectList />
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset className="p-6 bg-background">
          <div className="w-full max-w-5xl mx-auto">
            <Tabs defaultValue="tasks" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
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
              
              {showInsightsPanel && (
                <PersonalizedGreeting />
              )}
              
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
            
            {(activeTab === 'tasks' || activeTab === 'calendar') && (
              <FloatingActionButton 
                open={isTaskFormOpen}
                onOpenChange={setIsTaskFormOpen}
                initialDueDate={activeTab === 'calendar' ? new Date() : undefined}
              />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
