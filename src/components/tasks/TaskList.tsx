
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore/taskStore';
import { TaskCard } from './TaskCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskFilters, TaskStatus, TaskPriority } from '@/types/task';
import { debounce } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Search, Loader2, Tag, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function TaskList() {
  const { tasks, filters, setFilters, getFilteredTasks, fetchTasks, isLoading, error, setupTaskSubscription } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [tagInput, setTagInput] = useState('');
  
  // Get all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap(task => task.tags || []))).sort();
  
  useEffect(() => {
    // Fetch tasks on component mount
    fetchTasks();
    
    // Setup real-time subscription
    const unsubscribe = setupTaskSubscription();
    
    return () => {
      // Cleanup subscription on unmount
      unsubscribe();
    };
  }, [fetchTasks, setupTaskSubscription]);
  
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
  
  // Handle tag input change
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  
  // Handle tag selection
  const handleTagSelect = (tag: string) => {
    const currentTags = filters.tags || [];
    
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      setFilters({ ...filters, tags: newTags });
    }
    
    setTagInput('');
  };
  
  // Handle tag removal
  const handleTagRemove = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.filter(t => t !== tag);
    
    if (newTags.length === 0) {
      const { tags, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters({ ...filters, tags: newTags });
    }
  };
  
  // Handle tag input key down
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim();
      
      if (tag && !filters.tags?.includes(tag)) {
        const newTags = [...(filters.tags || []), tag];
        setFilters({ ...filters, tags: newTags });
        setTagInput('');
      }
    }
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
  
  // Get filtered tags based on input
  const filteredTags = allTags
    .filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()))
    .filter(tag => !(filters.tags || []).includes(tag));
  
  // Get filtered tasks based on current filters
  const filteredTasks = getFilteredTasks();
  
  // Show error state if there's an error
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error loading tasks</AlertTitle>
        <AlertDescription>
          {typeof error === 'string' ? error : 'There was an error loading your tasks. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Show loading state when initially loading data
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 bg-background/50 backdrop-blur-sm border-muted"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2">
              <div className="space-y-2">
                <Input
                  placeholder="Search or add tags"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                />
                {filteredTags.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto py-1">
                    {filteredTags.map(tag => (
                      <div 
                        key={tag} 
                        className="px-2 py-1.5 text-sm hover:bg-muted rounded-sm cursor-pointer"
                        onClick={() => handleTagSelect(tag)}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                ) : tagInput.trim() ? (
                  <div className="px-2 py-1.5 text-sm hover:bg-muted rounded-sm cursor-pointer" onClick={() => handleTagSelect(tagInput.trim())}>
                    Add tag: {tagInput}
                  </div>
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No matching tags</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {filters.tags && filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.tags.map(tag => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleTagRemove(tag)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove tag</span>
                  </Button>
                </Badge>
              ))}
              
              {filters.tags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    const { tags, ...restFilters } = filters;
                    setFilters(restFilters);
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full mb-6 bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
        </TabsList>
        
        {/* Loading indicator while refreshing with existing data */}
        {isLoading && tasks.length > 0 && (
          <div className="flex justify-center mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        
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
                {searchQuery || (filters.tags && filters.tags.length > 0) ? 'Try different filters' : 'Create your first task to get started'}
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
                {filters.tags && filters.tags.length > 0 ? 'Try different filters' : 'All your tasks are completed or archived'}
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
                {filters.tags && filters.tags.length > 0 ? 'Try different filters' : 'Complete some tasks to see them here'}
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
                {filters.tags && filters.tags.length > 0 ? 'Try different filters' : 'Archive completed tasks to keep things organized'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
