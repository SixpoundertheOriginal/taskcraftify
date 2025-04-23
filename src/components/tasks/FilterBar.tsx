import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskFilters, TaskStatus, TaskPriority } from '@/types/task';
import { 
  Filter, 
  FilterX, 
  ListChecks, 
  Clock, 
  CheckCircle2, 
  Archive, 
  Calendar, 
  Tag
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  clearAllFilters: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allTags: string[];
}

export function FilterBar({
  filters,
  setFilters,
  clearAllFilters,
  searchQuery,
  setSearchQuery,
  allTags
}: FilterBarProps) {
  const hasActiveFilters = Object.keys(filters).length > 0;
  
  const getStatusLabel = (status: TaskStatus): string => {
    switch(status) {
      case TaskStatus.TODO: return "To Do";
      case TaskStatus.IN_PROGRESS: return "In Progress";
      case TaskStatus.DONE: return "Completed";
      case TaskStatus.ARCHIVED: return "Archived";
      case TaskStatus.BACKLOG: return "Backlog";
      default: return status;
    }
  };
  
  const getStatusIcon = (status: TaskStatus) => {
    switch(status) {
      case TaskStatus.TODO: return <Clock className="h-3.5 w-3.5" />;
      case TaskStatus.IN_PROGRESS: return <ListChecks className="h-3.5 w-3.5" />;
      case TaskStatus.DONE: return <CheckCircle2 className="h-3.5 w-3.5" />;
      case TaskStatus.ARCHIVED: return <Archive className="h-3.5 w-3.5" />;
      case TaskStatus.BACKLOG: return <Clock className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };
  
  const getStatusColor = (status: TaskStatus): string => {
    switch(status) {
      case TaskStatus.TODO: return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      case TaskStatus.IN_PROGRESS: return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
      case TaskStatus.DONE: return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
      case TaskStatus.ARCHIVED: return "bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
      case TaskStatus.BACKLOG: return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      default: return "";
    }
  };
  
  const getPriorityLabel = (priority: TaskPriority): string => {
    switch(priority) {
      case TaskPriority.LOW: return "Low";
      case TaskPriority.MEDIUM: return "Medium";
      case TaskPriority.HIGH: return "High";
      case TaskPriority.URGENT: return "Urgent";
      default: return priority;
    }
  };
  
  const getPriorityColor = (priority: TaskPriority): string => {
    switch(priority) {
      case TaskPriority.LOW: return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
      case TaskPriority.MEDIUM: return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
      case TaskPriority.HIGH: return "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
      case TaskPriority.URGENT: return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
      default: return "";
    }
  };
  
  const handleStatusSelect = (statuses: string[]) => {
    if (statuses.length === 0) {
      const { status, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters({
        ...filters,
        status: statuses.map(s => s as TaskStatus)
      });
    }
  };
  
  const handlePrioritySelect = (priorities: string[]) => {
    if (priorities.length === 0) {
      const { priority, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters({
        ...filters,
        priority: priorities.map(p => p as TaskPriority)
      });
    }
  };
  
  const handleTagSelect = (tag: string) => {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      setFilters({
        ...filters,
        tags: [...currentTags, tag]
      });
    }
  };
  
  const handleTagRemove = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.filter(t => t !== tag);
    
    if (newTags.length === 0) {
      const { tags, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters({
        ...filters,
        tags: newTags
      });
    }
  };
  
  const handleClearStatusFilter = () => {
    const { status, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const handleClearPriorityFilter = () => {
    const { priority, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const handleClearTagsFilter = () => {
    const { tags, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const handleClearDateFilters = () => {
    const { dueDateFrom, dueDateTo, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const handleClearSearchFilter = () => {
    setSearchQuery('');
    const { searchQuery, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    setFilters({
      ...filters,
      searchQuery: query
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              aria-label="Filter tasks"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 px-1.5 h-5">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white shadow-lg border rounded-md" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={clearAllFilters}
                  >
                    <FilterX className="h-3.5 w-3.5 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full"
              />
              
              <Tabs defaultValue="status" className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-2">
                  <TabsTrigger value="status">Status</TabsTrigger>
                  <TabsTrigger value="priority">Priority</TabsTrigger>
                  <TabsTrigger value="tags">Tags</TabsTrigger>
                </TabsList>
                
                <TabsContent value="status" className="mt-2 space-y-3 bg-white">
                  <h5 className="text-sm font-medium mb-2">Task Status</h5>
                  <ToggleGroup 
                    type="multiple" 
                    variant="outline"
                    className="flex flex-wrap gap-2"
                    value={filters.status?.map(s => s.toString()) || []}
                    onValueChange={handleStatusSelect}
                  >
                    <ToggleGroupItem value={TaskStatus.TODO} className="flex items-center gap-1 text-xs rounded-md h-8 px-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>To Do</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value={TaskStatus.IN_PROGRESS} className="flex items-center gap-1 text-xs rounded-md h-8 px-2">
                      <ListChecks className="h-3.5 w-3.5" />
                      <span>In Progress</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value={TaskStatus.DONE} className="flex items-center gap-1 text-xs rounded-md h-8 px-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Completed</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value={TaskStatus.ARCHIVED} className="flex items-center gap-1 text-xs rounded-md h-8 px-2">
                      <Archive className="h-3.5 w-3.5" />
                      <span>Archived</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Smart Filters</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-xs h-8"
                        onClick={() => handleStatusSelect([TaskStatus.TODO, TaskStatus.IN_PROGRESS])}
                      >
                        <ListChecks className="h-3.5 w-3.5 mr-1" />
                        Active Tasks
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-xs h-8"
                        onClick={() => handleStatusSelect([TaskStatus.DONE, TaskStatus.ARCHIVED])}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Completed Tasks
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="priority" className="mt-2 space-y-3 bg-white">
                  <h5 className="text-sm font-medium mb-2">Priority Level</h5>
                  <ToggleGroup 
                    type="multiple" 
                    variant="outline"
                    className="flex flex-wrap gap-2"
                    value={filters.priority?.map(p => p.toString()) || []}
                    onValueChange={handlePrioritySelect}
                  >
                    <ToggleGroupItem value={TaskPriority.LOW} className="flex items-center gap-1 text-xs rounded-md h-8 px-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Low</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value={TaskPriority.MEDIUM} className="flex items-center gap-1 text-xs rounded-md h-8 px-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Medium</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value={TaskPriority.HIGH} className="flex items-center gap-1 text-xs rounded-md h-8 px-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>High</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value={TaskPriority.URGENT} className="flex items-center gap-1 text-xs rounded-md h-8 px-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Urgent</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Smart Filters</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-xs h-8"
                        onClick={() => handlePrioritySelect([TaskPriority.HIGH, TaskPriority.URGENT])}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                        High Priority
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-xs h-8"
                        onClick={() => handlePrioritySelect([TaskPriority.LOW, TaskPriority.MEDIUM])}
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                        Low Priority
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="tags" className="mt-2 space-y-3 bg-white">
                  <h5 className="text-sm font-medium mb-2">Tags</h5>
                  
                  {filters.tags && filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {filters.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="flex items-center gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {tag}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent ml-1"
                            onClick={() => handleTagRemove(tag)}
                          >
                            <FilterX className="h-3 w-3" />
                            <span className="sr-only">Remove tag</span>
                          </Button>
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={handleClearTagsFilter}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                  
                  <div className="h-40 overflow-y-auto bg-white">
                    <div className="grid grid-cols-2 gap-2">
                      {allTags.map(tag => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "justify-start text-xs h-8",
                            (filters.tags || []).includes(tag) ? "border-primary" : ""
                          )}
                          onClick={() => handleTagSelect(tag)}
                          disabled={(filters.tags || []).includes(tag)}
                        >
                          <Tag className="h-3.5 w-3.5 mr-1" />
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </PopoverContent>
        </Popover>
        
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 items-center">
            {filters.status && (
              <div className="flex items-center">
                {filters.status.map(status => (
                  <Badge 
                    key={status} 
                    variant="outline" 
                    className={cn("flex items-center gap-1 mr-1", getStatusColor(status))}
                  >
                    {getStatusIcon(status)}
                    {getStatusLabel(status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => {
                        const newStatus = filters.status?.filter(s => s !== status);
                        if (!newStatus?.length) {
                          handleClearStatusFilter();
                        } else {
                          setFilters({...filters, status: newStatus});
                        }
                      }}
                    >
                      <FilterX className="h-3 w-3" />
                      <span className="sr-only">Remove status filter</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            {filters.priority && (
              <div className="flex items-center">
                {filters.priority.map(priority => (
                  <Badge 
                    key={priority} 
                    variant="outline" 
                    className={cn("flex items-center gap-1 mr-1", getPriorityColor(priority))}
                  >
                    <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                    {getPriorityLabel(priority)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => {
                        const newPriority = filters.priority?.filter(p => p !== priority);
                        if (!newPriority?.length) {
                          handleClearPriorityFilter();
                        } else {
                          setFilters({...filters, priority: newPriority});
                        }
                      }}
                    >
                      <FilterX className="h-3 w-3" />
                      <span className="sr-only">Remove priority filter</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            
            {filters.tags && filters.tags.length > 0 && (
              <Badge 
                variant="outline" 
                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mr-1"
              >
                <Tag className="h-3.5 w-3.5" />
                {filters.tags.length > 1 ? `${filters.tags.length} tags` : filters.tags[0]}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={handleClearTagsFilter}
                >
                  <FilterX className="h-3 w-3" />
                  <span className="sr-only">Remove tags filter</span>
                </Button>
              </Badge>
            )}
            
            {(filters.dueDateFrom || filters.dueDateTo) && (
              <Badge 
                variant="outline" 
                className="flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 mr-1"
              >
                <Calendar className="h-3.5 w-3.5" />
                Due date
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={handleClearDateFilters}
                >
                  <FilterX className="h-3 w-3" />
                  <span className="sr-only">Remove date filter</span>
                </Button>
              </Badge>
            )}
            
            {filters.searchQuery && (
              <Badge 
                variant="outline" 
                className="flex items-center gap-1 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 mr-1"
              >
                Search: "{filters.searchQuery}"
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={handleClearSearchFilter}
                >
                  <FilterX className="h-3 w-3" />
                  <span className="sr-only">Clear search</span>
                </Button>
              </Badge>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-xs ml-auto" 
              onClick={clearAllFilters}
            >
              <FilterX className="h-3.5 w-3.5 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
