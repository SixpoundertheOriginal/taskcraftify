
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/store';
import { TaskCard } from '@/components/TaskCard';
import { Input } from '@/components/ui/input';
import { TaskFilters, TaskStatus, TaskPriority } from '@/types/task';
import { debounce } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Search, FilterX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function TaskList() {
  const { tasks, filters, setFilters, getFilteredTasks } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Initialize searchQuery from filters
  useEffect(() => {
    if (filters.searchQuery) {
      setSearchQuery(filters.searchQuery);
    }
  }, []);
  
  // Apply debounced search
  const debouncedSearch = debounce((query: string) => {
    setFilters({ ...filters, searchQuery: query });
  }, 300);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };
  
  // Handle tab change
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
    }
  };
  
  // Clear specific filters
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
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setActiveTab('all');
  };
  
  // Get filtered tasks based on current filters
  const filteredTasks = getFilteredTasks();
  
  // Determine if there are active filters
  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'searchQuery' || (key === 'searchQuery' && filters.searchQuery && filters.searchQuery.trim() !== '')
  );
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9 bg-background/50 backdrop-blur-sm border-muted"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          
          {filters.status && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700">
              Status: {filters.status.map(s => TaskStatus[s]).join(', ')}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 ml-1 hover:bg-blue-100" 
                onClick={clearStatusFilter}
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
                onClick={clearPriorityFilter}
              >
                <FilterX className="h-2.5 w-2.5" />
                <span className="sr-only">Clear priority filter</span>
              </Button>
            </Badge>
          )}
          
          {(filters.dueDateFrom || filters.dueDateTo) && (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700">
              Due date: {filters.dueDateFrom?.toLocaleDateString() || '*'} - {filters.dueDateTo?.toLocaleDateString() || '*'}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 ml-1 hover:bg-green-100" 
                onClick={clearDateFilters}
              >
                <FilterX className="h-2.5 w-2.5" />
                <span className="sr-only">Clear date filters</span>
              </Button>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs ml-auto" 
            onClick={clearAllFilters}
          >
            Clear all filters
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full mb-6 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No tasks found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search term' : 'Create your first task to get started'}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="mt-0">
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No active tasks</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All your tasks are completed or archived
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No completed tasks</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Complete some tasks to see them here
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="archived" className="mt-0">
          {filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No archived tasks</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Archive completed tasks to keep things organized
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
