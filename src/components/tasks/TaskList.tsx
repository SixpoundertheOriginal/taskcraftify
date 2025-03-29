import { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore/taskStore';
import { TaskCard } from './TaskCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Filter, FilterX } from 'lucide-react';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { FilterSidebar } from './FilterSidebar';
import { TaskStatus } from '@/types/task';
import { MyFocusView } from './MyFocusView';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

export function TaskList() {
  const { tasks, filters, setFilters, getFilteredTasks, fetchTasks, isLoading, error, setupTaskSubscription } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('focus');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Get all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap(task => task.tags || []))).sort();
  
  useEffect(() => {
    fetchTasks();
    const unsubscribe = setupTaskSubscription();
    return () => {
      unsubscribe();
    };
  }, [fetchTasks, setupTaskSubscription]);
  
  // Initialize searchQuery from filters
  useEffect(() => {
    if (filters.searchQuery) {
      setSearchQuery(filters.searchQuery);
    }
  }, [filters.searchQuery]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === 'all') {
      setFilters({ ...filters, status: undefined });
    } else if (tab === 'active') {
      setFilters({ 
        ...filters, 
        status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] 
      });
    } else if (tab === 'completed') {
      setFilters({ ...filters, status: [TaskStatus.DONE] });
    } else if (tab === 'archived') {
      setFilters({ ...filters, status: [TaskStatus.ARCHIVED] });
    } else if (tab === 'focus') {
      setFilters({});
    }
  };
  
  const clearStatusFilter = () => {
    const { status, ...restFilters } = filters;
    setFilters(restFilters);
    setActiveTab('all');
  };
  
  const clearPriorityFilter = () => {
    const { priority, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const clearDateFilters = () => {
    const { dueDateFrom, dueDateTo, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const clearSearchFilter = () => {
    setSearchQuery('');
    const { searchQuery, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const clearTagsFilter = () => {
    const { tags, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setActiveTab('focus');
  };
  
  const filteredTasks = getFilteredTasks();
  
  if (error && activeTab !== 'focus') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error loading tasks</AlertTitle>
        <AlertDescription>
          {typeof error === 'string' ? error : 'There was an error loading your tasks. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isLoading && tasks.length === 0 && activeTab !== 'focus') {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      {/* Mobile sheet for filters */}
      <div className="md:hidden mb-4">
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {Object.keys(filters).length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {Object.keys(filters).length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[80%] max-w-sm">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              allTags={allTags}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              clearAllFilters={clearAllFilters}
            />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Desktop view with sidebar */}
      <SidebarProvider defaultOpen={false}>
        <div className="flex w-full">
          <div className="hidden md:block">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              allTags={allTags}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              clearAllFilters={clearAllFilters}
            />
          </div>
          
          <SidebarInset className="flex-1 p-0">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden md:flex" />
                <h1 className="text-2xl font-bold">Tasks</h1>
                {Object.keys(filters).length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-xs"
                    onClick={clearAllFilters}
                  >
                    <FilterX className="h-3.5 w-3.5 mr-1" />
                    Clear all filters
                  </Button>
                )}
              </div>
              
              <ActiveFiltersDisplay 
                filters={filters}
                onClearStatusFilter={clearStatusFilter}
                onClearPriorityFilter={clearPriorityFilter}
                onClearDateFilters={clearDateFilters}
                onClearSearchFilter={clearSearchFilter}
                onClearTagsFilter={clearTagsFilter}
                onClearAllFilters={clearAllFilters}
              />
              
              <Tabs defaultValue="focus" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full mb-6 bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger value="focus" className="flex-1">My Focus</TabsTrigger>
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
                  <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
                </TabsList>
                
                {isLoading && tasks.length > 0 && activeTab !== 'focus' && (
                  <div className="flex justify-center mb-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                
                {/* My Focus Tab */}
                <TabsContent value="focus" className="mt-0">
                  <MyFocusView />
                </TabsContent>
                
                {/* All Tab */}
                <TabsContent value="all" className="mt-0">
                  {filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium">No tasks found</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {Object.keys(filters).length > 0 ? 'Try different filters' : 'Create your first task to get started'}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Keep existing code for active, completed, and archived tabs */}
                <TabsContent value="active" className="mt-0">
                  {filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium">No active tasks</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {Object.keys(filters).length > 0 ? 'Try different filters' : 'All your tasks are completed or archived'}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="mt-0">
                  {filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium">No completed tasks</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {Object.keys(filters).length > 0 ? 'Try different filters' : 'Complete some tasks to see them here'}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="archived" className="mt-0">
                  {filteredTasks.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium">No archived tasks</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {Object.keys(filters).length > 0 ? 'Try different filters' : 'Archive completed tasks to keep things organized'}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
