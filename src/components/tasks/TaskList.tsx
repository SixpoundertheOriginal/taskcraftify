import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTaskStore } from '@/store';
import { TaskCard } from './TaskCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Filter, FilterX } from 'lucide-react';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { FilterSidebar } from './FilterSidebar';
import { TaskStatus } from '@/types/task';
// Remove MyFocusView import
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
  const { 
    tasks, 
    filters, 
    setFilters, 
    getFilteredTasks, 
    fetchTasks, 
    isLoading, 
    error, 
    setupTaskSubscription,
    refreshTaskCounts,
    isInitialLoadComplete
  } = useTaskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  // Change default tab from 'focus' to 'all'
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const allTags = useMemo(() => {
    return Array.from(new Set(tasks.flatMap(task => task.tags || []))).sort();
  }, [tasks]);
  
  console.log("TaskList render - Total tasks:", tasks.length, "isLoading:", isLoading, "isInitialLoadComplete:", isInitialLoadComplete);
  
  const filteredTasks = useMemo(() => {
    console.log("Computing filtered tasks with filters:", filters);
    return getFilteredTasks();
  }, [getFilteredTasks, filters, tasks.length]);
  
  console.log("TaskList render - Filtered tasks:", filteredTasks.length);
  
  useEffect(() => {
    if (isInitialized) {
      console.log("TaskList: Already initialized, skipping setup");
      return;
    }
    
    console.log("TaskList: Initial setup - fetching tasks and setting up subscription");
    setIsInitialized(true);
    
    fetchTasks().then((fetchedTasks) => {
      console.log("TaskList: Initial task fetch complete, tasks:", fetchedTasks.length);
      refreshTaskCounts();
    }).catch(err => {
      console.error("TaskList: Error fetching tasks:", err);
    });
    
    const unsubscribe = setupTaskSubscription();
    
    return () => {
      console.log("TaskList: Unsubscribing from task updates");
      unsubscribe();
    };
  }, [fetchTasks, setupTaskSubscription, refreshTaskCounts, isInitialized]);
  
  useEffect(() => {
    if (filters.searchQuery) {
      setSearchQuery(filters.searchQuery);
    }
  }, [filters.searchQuery]);
  
  const handleTabChange = useCallback((tab: string) => {
    console.log("TaskList: Tab changed to", tab);
    setActiveTab(tab);
    
    // Important: Create a new filters object to ensure the change is detected
    const newFilters = { ...filters };
    
    if (tab === 'all') {
      delete newFilters.status;
      setFilters(newFilters);
    } else if (tab === 'active') {
      newFilters.status = [TaskStatus.TODO, TaskStatus.IN_PROGRESS];
      setFilters(newFilters);
    } else if (tab === 'completed') {
      newFilters.status = [TaskStatus.DONE];
      setFilters(newFilters);
    } else if (tab === 'archived') {
      newFilters.status = [TaskStatus.ARCHIVED];
    }
    // Remove the 'focus' case
  }, [filters, setFilters]);
  
  const clearStatusFilter = useCallback(() => {
    const { status, ...restFilters } = filters;
    setFilters(restFilters);
    setActiveTab('all');
  }, [filters, setFilters]);
  
  const clearPriorityFilter = useCallback(() => {
    const { priority, ...restFilters } = filters;
    setFilters(restFilters);
  }, [filters, setFilters]);
  
  const clearDateFilters = useCallback(() => {
    const { dueDateFrom, dueDateTo, ...restFilters } = filters;
    setFilters(restFilters);
  }, [filters, setFilters]);
  
  const clearSearchFilter = useCallback(() => {
    setSearchQuery('');
    const { searchQuery, ...restFilters } = filters;
    setFilters(restFilters);
  }, [filters, setFilters]);
  
  const clearTagsFilter = useCallback(() => {
    const { tags, ...restFilters } = filters;
    setFilters(restFilters);
  }, [filters, setFilters]);
  
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    // Change from 'focus' to 'all'
    setActiveTab('all');
  }, [setFilters]);
  
  // Determine if we should show the loading indicator or error state
  // Remove 'focus' check
  const showLoading = isLoading && tasks.length === 0;
  const showError = error;
  
  if (showError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error loading tasks</AlertTitle>
        <AlertDescription>
          {typeof error === 'string' ? error : 'There was an error loading your tasks. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
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
              
              <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full mb-6 bg-muted/50 backdrop-blur-sm">
                  {/* Remove the Focus tab */}
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                  <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
                  <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
                </TabsList>
                
                {isLoading && tasks.length > 0 && (
                  <div className="flex justify-center mb-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                
                {/* Remove Focus tab content */}
                
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
