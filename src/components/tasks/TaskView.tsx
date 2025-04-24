import { useState, useEffect, useMemo } from 'react';
import { useTaskStore, useProjectStore } from '@/store';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  Clock, 
  Filter, 
  FilterX, 
  Loader2, 
  Search 
} from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskStatus, TaskPriority } from '@/types/task';
import { TaskGroup } from './TaskGroup';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { FilterBar } from './FilterBar';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MyFocusView } from './MyFocusView';
import { KanbanBoard } from './KanbanBoard';
import { ViewToggle, ViewMode } from './ViewToggle';
import { TaskGroups } from './TaskGroups';
import { FilterIndicator } from './FilterIndicator';
import { toast } from '@/hooks/use-toast';

export function TaskView() {
  const { 
    tasks, 
    filters, 
    setFilters, 
    getFilteredTasks, 
    isLoading, 
    error,
    getTasksDueToday,
    getOverdueTasks,
    fetchTasks,
    setupTaskSubscription,
    refreshTaskCounts
  } = useTaskStore();
  
  const { selectedProjectId, projects, fetchProjects } = useProjectStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('my-tasks');
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('list');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialFetchComplete, setInitialFetchComplete] = useState(false);
  
  useEffect(() => {
    if (isInitialized) return;
    
    console.log("TaskView: Initial setup - fetching tasks and setting up subscription");
    setIsInitialized(true);
    
    fetchProjects().catch(err => {
      console.error("Error fetching projects:", err);
    });
    
    fetchTasks()
      .then(() => {
        console.log("TaskView: Initial task fetch complete");
        refreshTaskCounts();
        setInitialFetchComplete(true);
        
        const allTasks = tasks.length;
        const visibleTasks = getFilteredTasks().length;
        
        if (allTasks > 0 && visibleTasks === 0 && Object.keys(filters).length > 0) {
          toast({
            title: "Tasks are being filtered",
            description: `You have ${allTasks} tasks, but none match your current filters.`,
            variant: "default"
          });
        }
      })
      .catch(err => {
        console.error("TaskView: Error fetching tasks:", err);
        setInitialFetchComplete(true);
      });
    
    const unsubscribe = setupTaskSubscription();
    
    return () => {
      console.log("TaskView: Unsubscribing from task updates");
      unsubscribe();
    };
  }, [fetchTasks, fetchProjects, setupTaskSubscription, refreshTaskCounts, isInitialized, tasks.length, getFilteredTasks, filters]);
  
  useEffect(() => {
    if (initialFetchComplete) {
      const allTasks = tasks.length;
      const filteredCount = getFilteredTasks().length;
      
      console.log(`TaskView: Have ${allTasks} total tasks, ${filteredCount} after filtering`);
      console.log("Current filters:", filters);
      
      if (allTasks > 0 && filteredCount === 0 && Object.keys(filters).length > 0) {
        console.log("TaskView: Warning - All tasks are being filtered out!");
      }
    }
  }, [tasks.length, getFilteredTasks, filters, initialFetchComplete]);
  
  useEffect(() => {
    if (activeTab === 'my-tasks' && Object.keys(filters).length === 0) {
      setFilters({ 
        status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] 
      });
    }
    
    if (filters.searchQuery) {
      setSearchQuery(filters.searchQuery);
    }
  }, [filters, setFilters, activeTab]);
  
  const filteredTasks = useMemo(() => {
    return getFilteredTasks();
  }, [getFilteredTasks, tasks.length, filters]);
  
  const overdueTasks = useMemo(() => {
    return getOverdueTasks();
  }, [getOverdueTasks, tasks.length]);
  
  const tasksDueToday = useMemo(() => {
    return getTasksDueToday();
  }, [getTasksDueToday, tasks.length]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    const newFilters = { ...filters };
    
    if (tab === 'my-tasks') {
      newFilters.status = [TaskStatus.TODO, TaskStatus.IN_PROGRESS];
      setFilters(newFilters);
    } 
    else if (tab === 'all-tasks') {
      delete newFilters.status;
      setFilters(newFilters);
    } 
    else if (tab === 'completed') {
      newFilters.status = [TaskStatus.DONE];
      setFilters(newFilters);
    } 
    else if (tab === 'focus') {
      // My focus view has its own filtering logic
    }
  };
  
  const handleViewModeChange = (mode: ViewMode) => {
    setActiveViewMode(mode);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFilters({ ...filters, searchQuery: query });
  };
  
  const clearAllFilters = () => {
    console.log("Clearing all filters");
    setFilters({});
    setSearchQuery('');
  };
  
  const clearStatusFilter = () => {
    const { status, ...restFilters } = filters;
    setFilters(restFilters);
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
  
  const clearProjectFilter = () => {
    const { projectId, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [tasks]);
  
  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'searchQuery' || (key === 'searchQuery' && filters.searchQuery && filters.searchQuery.trim() !== '')
  );
  
  const showEmptyStats = overdueTasks.length > 0 || tasksDueToday.length > 0 || filteredTasks.length > 0;

  let listHeader = '';
  if (activeTab === 'my-tasks') listHeader = `Tasks (${filteredTasks.length})`;
  else if (activeTab === 'all-tasks') listHeader = `All Tasks (${filteredTasks.length})`;
  else if (activeTab === 'completed') listHeader = `Completed (${filteredTasks.length})`;
  else if (activeTab === 'focus') listHeader = `My Focus`;

  if (isLoading && !initialFetchComplete && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your tasks...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-4">
        <h3 className="font-medium mb-1">Error loading tasks</h3>
        <p className="text-sm">{typeof error === 'string' ? error : 'There was an error loading your tasks'}</p>
        <div className="mt-3">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => fetchTasks()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  if (tasks.length > 0 && filteredTasks.length === 0 && hasActiveFilters) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{listHeader}</h1>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-auto">
              <ProjectSelector 
                buttonClassName="w-full sm:w-auto bg-background text-sm font-medium" 
              />
            </div>
            <div className="flex items-center gap-2">
              <FilterIndicator 
                filters={filters}
                onClearStatusFilter={clearStatusFilter}
                onClearPriorityFilter={clearPriorityFilter}
                onClearDateFilters={clearDateFilters}
                onClearSearchFilter={clearSearchFilter}
                onClearTagsFilter={clearTagsFilter}
                onClearAllFilters={clearAllFilters}
                allTags={allTags}
              />
              <ViewToggle
                activeView={activeViewMode}
                onViewChange={handleViewModeChange}
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-10 text-center bg-background border rounded-lg">
          <FilterX className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No tasks match your filters</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You have {tasks.length} tasks, but none match your current filters.
            Try changing your filters or clear them to see all tasks.
          </p>
          <Button onClick={clearAllFilters} variant="default">
            Clear All Filters
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{listHeader}</h1>
          {isLoading && tasks.length > 0 && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-auto">
            <ProjectSelector 
              buttonClassName="w-full sm:w-auto bg-background text-sm font-medium" 
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterIndicator 
              filters={filters}
              onClearStatusFilter={clearStatusFilter}
              onClearPriorityFilter={clearPriorityFilter}
              onClearDateFilters={clearDateFilters}
              onClearSearchFilter={clearSearchFilter}
              onClearTagsFilter={clearTagsFilter}
              onClearAllFilters={clearAllFilters}
              allTags={allTags}
            />
            <ViewToggle
              activeView={activeViewMode}
              onViewChange={handleViewModeChange}
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 bg-background/60 backdrop-blur-sm border border-muted rounded-lg"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearchFilter}
            >
              <FilterX className="h-3.5 w-3.5" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        
        {hasActiveFilters && (
          <div className="text-xs text-muted-foreground py-1 px-2 border border-dashed rounded-md">
            Showing filtered results
          </div>
        )}
      </div>
      
      <Tabs defaultValue="my-tasks" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full mb-4 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="my-tasks" className="flex-1">Active</TabsTrigger>
          <TabsTrigger value="all-tasks" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="focus" className="flex-1">My Focus</TabsTrigger>
        </TabsList>
        
        <TabsContent value="focus" className="mt-0">
          <MyFocusView />
        </TabsContent>
        
        <TabsContent value="my-tasks" className="mt-0">
          {showEmptyStats ? (
            <>
              {overdueTasks.length > 0 && (
                <TaskGroup 
                  title="Overdue" 
                  count={overdueTasks.length} 
                  className="mb-8"
                >
                  <div className="space-y-3">
                    {overdueTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </TaskGroup>
              )}
              
              {tasksDueToday.length > 0 && (
                <TaskGroup 
                  title="Due Today" 
                  count={tasksDueToday.length} 
                  className="mb-8"
                >
                  <div className="space-y-3">
                    {tasksDueToday.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </TaskGroup>
              )}
              
              <TaskGroup 
                title="Tasks" 
                count={filteredTasks.length}
                isEmpty={filteredTasks.length === 0}
                emptyState={
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium">No active tasks</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {hasActiveFilters ? 'Try different filters or clear them to see more tasks' : 'Create a new task to get started'}
                    </p>
                  </div>
                }
              >
                <div className="space-y-3">
                  {filteredTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </TaskGroup>
            </>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-background border rounded-lg">
              <CheckCircle className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-medium">No tasks found</h3>
              <p className="text-muted-foreground max-w-md mt-1 mb-6">
                You don't have any tasks yet. Create your first task to get started.
              </p>
              <Button>
                Create Task
              </Button>
            </div>
          ) : (
            <div className="flex justify-center items-center p-10">
              <CheckCircle className="h-10 w-10 text-green-400 mr-3" />
              <span className="text-lg text-green-600 font-medium">You're all caught up!</span>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all-tasks" className="mt-0">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-background border rounded-lg">
              <CheckCircle className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-medium">No tasks found</h3>
              <p className="text-muted-foreground max-w-md mt-1 mb-6">
                You don't have any tasks yet. Create your first task to get started.
              </p>
              <Button>
                Create Task
              </Button>
            </div>
          ) : activeViewMode === 'list' ? (
            <TaskGroup 
              title="All Tasks" 
              count={filteredTasks.length}
              isEmpty={filteredTasks.length === 0}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium">No tasks found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasActiveFilters ? 'Try different filters' : 'Create your first task to get started'}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              }
            >
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TaskGroup>
          ) : activeViewMode === 'kanban' ? (
            <KanbanBoard />
          ) : (
            <TaskGroups />
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {activeViewMode === 'list' ? (
            <TaskGroup 
              title="Completed Tasks" 
              count={filteredTasks.length}
              isEmpty={filteredTasks.length === 0}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium">No completed tasks</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasActiveFilters ? 'Try different filters' : 'Complete some tasks to see them here'}
                  </p>
                </div>
              }
            >
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TaskGroup>
          ) : activeViewMode === 'kanban' ? (
            <KanbanBoard />
          ) : (
            <TaskGroups />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
