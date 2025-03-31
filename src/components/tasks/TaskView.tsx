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
import { cn } from '@/lib/utils';
import { MyFocusView } from './MyFocusView';
import { KanbanBoard } from './KanbanBoard';
import { ViewToggle, ViewMode } from './ViewToggle';
import { TaskGroups } from './TaskGroups';

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
  
  const { selectedProjectId, projects } = useProjectStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('my-tasks');
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('list');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (isInitialized) return;
    
    console.log("TaskView: Initial setup - fetching tasks and setting up subscription");
    setIsInitialized(true);
    
    fetchTasks().then(() => {
      console.log("TaskView: Initial task fetch complete");
      refreshTaskCounts();
    }).catch(err => {
      console.error("TaskView: Error fetching tasks:", err);
    });
    
    const unsubscribe = setupTaskSubscription();
    
    return () => {
      console.log("TaskView: Unsubscribing from task updates");
      unsubscribe();
    };
  }, [fetchTasks, setupTaskSubscription, refreshTaskCounts, isInitialized]);
  
  useEffect(() => {
    if (activeTab === 'my-tasks' && Object.keys(filters).length === 0) {
      setFilters({ 
        status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] 
      });
    }
    
    if (filters.searchQuery) {
      setSearchQuery(filters.searchQuery);
    }
  }, [filters, setFilters]);
  
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
    setFilters({});
    setSearchQuery('');
  };
  
  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'searchQuery' || (key === 'searchQuery' && filters.searchQuery && filters.searchQuery.trim() !== '')
  );
  
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-4">
        <h3 className="font-medium mb-1">Error loading tasks</h3>
        <p className="text-sm">{typeof error === 'string' ? error : 'There was an error loading your tasks'}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Tasks</h1>
          {isLoading && tasks.length > 0 && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-auto">
            <ProjectSelector 
              buttonClassName="w-full sm:w-auto bg-background text-sm font-medium" 
            />
          </div>
          
          <ViewToggle 
            activeView={activeViewMode} 
            onViewChange={handleViewModeChange} 
          />
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9 bg-background/50 backdrop-blur-sm"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          
          {filters.projectId && (
            <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700">
              Project: {filters.projectId === 'none' 
                ? 'No Project' 
                : projects.find(p => p.id === filters.projectId)?.name || 'Unknown'}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 ml-1 hover:bg-purple-100" 
                onClick={() => {
                  const { projectId, ...rest } = filters;
                  setFilters(rest);
                }}
              >
                <FilterX className="h-2.5 w-2.5" />
                <span className="sr-only">Clear project filter</span>
              </Button>
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700">
              Status: {filters.status.map(s => TaskStatus[s]).join(', ')}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 ml-1 hover:bg-blue-100" 
                onClick={() => {
                  const { status, ...rest } = filters;
                  setFilters(rest);
                }}
              >
                <FilterX className="h-2.5 w-2.5" />
                <span className="sr-only">Clear status filter</span>
              </Button>
            </Badge>
          )}
          
          {filters.priority && (
            <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-700">
              Priority: {filters.priority.map(p => TaskPriority[p]).join(', ')}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 ml-1 hover:bg-orange-100" 
                onClick={() => {
                  const { priority, ...rest } = filters;
                  setFilters(rest);
                }}
              >
                <FilterX className="h-2.5 w-2.5" />
                <span className="sr-only">Clear priority filter</span>
              </Button>
            </Badge>
          )}
          
          {filters.searchQuery && (
            <Badge variant="outline" className="flex items-center gap-1 bg-slate-50 text-slate-700">
              Search: {filters.searchQuery}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 ml-1 hover:bg-slate-100" 
                onClick={() => {
                  setSearchQuery('');
                  const { searchQuery, ...rest } = filters;
                  setFilters(rest);
                }}
              >
                <FilterX className="h-2.5 w-2.5" />
                <span className="sr-only">Clear search filter</span>
              </Button>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs ml-auto" 
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="my-tasks" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full mb-6 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="my-tasks" className="flex-1">Active</TabsTrigger>
          <TabsTrigger value="all-tasks" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="focus" className="flex-1">My Focus</TabsTrigger>
        </TabsList>
        
        <TabsContent value="focus" className="mt-0">
          <MyFocusView />
        </TabsContent>
        
        <TabsContent value="my-tasks" className="mt-0">
          {activeViewMode === 'list' ? (
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
          ) : activeViewMode === 'kanban' ? (
            <KanbanBoard />
          ) : (
            <TaskGroups />
          )}
        </TabsContent>
        
        <TabsContent value="all-tasks" className="mt-0">
          {activeViewMode === 'list' ? (
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
