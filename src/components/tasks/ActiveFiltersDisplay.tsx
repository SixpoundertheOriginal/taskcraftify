
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterX } from 'lucide-react';
import { TaskFilters, TaskStatus, TaskPriority } from '@/types/task';

interface ActiveFiltersDisplayProps {
  filters: TaskFilters;
  onClearStatusFilter: () => void;
  onClearPriorityFilter: () => void;
  onClearDateFilters: () => void;
  onClearSearchFilter?: () => void;
  onClearTagsFilter?: () => void;
  onClearAllFilters: () => void;
}

export function ActiveFiltersDisplay({
  filters,
  onClearStatusFilter,
  onClearPriorityFilter,
  onClearDateFilters,
  onClearSearchFilter,
  onClearTagsFilter,
  onClearAllFilters
}: ActiveFiltersDisplayProps) {
  // Determine if there are active filters
  const hasActiveFilters = Object.keys(filters).some(key => {
    if (key === 'searchQuery') {
      return filters.searchQuery && filters.searchQuery.trim() !== '';
    }
    if (key === 'tags') {
      return filters.tags && filters.tags.length > 0;
    }
    return !!filters[key as keyof TaskFilters];
  });
  
  if (!hasActiveFilters) return null;
  
  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <span className="text-xs text-muted-foreground">Active filters:</span>
      
      {filters.status && (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Status: {filters.status.map(s => TaskStatus[s]).join(', ')}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0 ml-1 hover:bg-blue-100 dark:hover:bg-blue-900" 
            onClick={onClearStatusFilter}
          >
            <FilterX className="h-2.5 w-2.5" />
            <span className="sr-only">Clear status filter</span>
          </Button>
        </Badge>
      )}
      
      {filters.priority && (
        <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          Priority: {filters.priority.map(p => TaskPriority[p]).join(', ')}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0 ml-1 hover:bg-orange-100 dark:hover:bg-orange-900" 
            onClick={onClearPriorityFilter}
          >
            <FilterX className="h-2.5 w-2.5" />
            <span className="sr-only">Clear priority filter</span>
          </Button>
        </Badge>
      )}
      
      {(filters.dueDateFrom || filters.dueDateTo) && (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
          Due date: {filters.dueDateFrom?.toLocaleDateString() || '*'} - {filters.dueDateTo?.toLocaleDateString() || '*'}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0 ml-1 hover:bg-green-100 dark:hover:bg-green-900" 
            onClick={onClearDateFilters}
          >
            <FilterX className="h-2.5 w-2.5" />
            <span className="sr-only">Clear date filters</span>
          </Button>
        </Badge>
      )}
      
      {filters.searchQuery && onClearSearchFilter && (
        <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          Search: "{filters.searchQuery}"
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0 ml-1 hover:bg-purple-100 dark:hover:bg-purple-900" 
            onClick={onClearSearchFilter}
          >
            <FilterX className="h-2.5 w-2.5" />
            <span className="sr-only">Clear search filter</span>
          </Button>
        </Badge>
      )}
      
      {filters.tags && filters.tags.length > 0 && onClearTagsFilter && (
        <Badge variant="outline" className="flex items-center gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Tags: {filters.tags.join(', ')}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0 ml-1 hover:bg-indigo-100 dark:hover:bg-indigo-900" 
            onClick={onClearTagsFilter}
          >
            <FilterX className="h-2.5 w-2.5" />
            <span className="sr-only">Clear tags filter</span>
          </Button>
        </Badge>
      )}
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 px-2 text-xs ml-auto" 
        onClick={onClearAllFilters}
      >
        Clear all filters
      </Button>
    </div>
  );
}
