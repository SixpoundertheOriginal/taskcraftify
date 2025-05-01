
import { Filter as FilterIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { TaskFilters } from '@/types/task';
import { cn } from '@/lib/utils';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterIndicatorProps {
  filters: TaskFilters;
  onClearStatusFilter: () => void;
  onClearPriorityFilter: () => void;
  onClearDateFilters: () => void;
  onClearSearchFilter: () => void;
  onClearTagsFilter: () => void;
  onClearAllFilters: () => void;
  allTags: string[];
}

export function FilterIndicator({
  filters,
  onClearStatusFilter,
  onClearPriorityFilter,
  onClearDateFilters,
  onClearSearchFilter,
  onClearTagsFilter,
  onClearAllFilters,
  allTags
}: FilterIndicatorProps) {
  // Count active filters with better handling
  const activeFiltersCount = Object.keys(filters).reduce((count, key) => {
    // Only count search query if it's not empty
    if (key === 'searchQuery') {
      return filters.searchQuery && filters.searchQuery.trim() !== '' ? count + 1 : count;
    }
    // Count tags as a single filter
    if (key === 'tags') {
      return filters.tags && filters.tags.length > 0 ? count + 1 : count;
    }
    // Count date range as a single filter
    if (key === 'dueDateFrom' || key === 'dueDateTo') {
      // Already counted this filter if we've seen the other date field
      if ((key === 'dueDateFrom' && filters.dueDateTo) || 
          (key === 'dueDateTo' && filters.dueDateFrom)) {
        return count;
      }
      return (filters.dueDateFrom || filters.dueDateTo) ? count + 1 : count;
    }
    // For arrays, only count if they have items
    if (Array.isArray(filters[key as keyof TaskFilters])) {
      const arr = filters[key as keyof TaskFilters] as any[];
      return arr.length > 0 ? count + 1 : count;
    }
    // Default handling for other filter types
    return filters[key as keyof TaskFilters] ? count + 1 : count;
  }, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  // Helper function to truncate and display filter values
  const getFilterDisplay = (key: string): string => {
    const value = filters[key as keyof TaskFilters];
    
    if (key === 'projectId') {
      return value === 'none' ? 'No Project' : 'Specific Project';
    }
    
    if (key === 'status' && Array.isArray(value)) {
      return value.length === 1 ? `Status: ${value[0]}` : `Status: ${value.length} selected`;
    }
    
    if (key === 'priority' && Array.isArray(value)) {
      return value.length === 1 ? `Priority: ${value[0]}` : `Priority: ${value.length} selected`;
    }
    
    if (key === 'tags' && Array.isArray(value)) {
      return value.length === 1 ? `Tag: ${value[0]}` : `Tags: ${value.length} selected`;
    }
    
    if (key === 'dueDateFrom' || key === 'dueDateTo') {
      return 'Date Range';
    }
    
    if (key === 'searchQuery') {
      return `Search: "${value}"`;
    }
    
    return key;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={cn(
            "flex items-center gap-1 h-8 px-2 font-normal",
            hasActiveFilters && "border-primary/50 bg-primary/5 hover:bg-primary/10"
          )}
        >
          <FilterIcon className="h-3.5 w-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <Badge 
              variant="secondary" 
              className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary/15 text-primary"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Active Filters</h3>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-xs"
                onClick={onClearAllFilters}
              >
                Clear all
              </Button>
            )}
          </div>
          
          {hasActiveFilters ? (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {Object.keys(filters).map(key => {
                  // Skip empty search queries
                  if (key === 'searchQuery' && (!filters.searchQuery || filters.searchQuery.trim() === '')) {
                    return null;
                  }
                  
                  // Skip empty tag arrays
                  if (key === 'tags' && (!filters.tags || filters.tags.length === 0)) {
                    return null;
                  }
                  
                  // Handle date filters as one entry - fixing the type comparison issue correctly
                  if (key === 'dueDateFrom' && filters.dueDateTo) {
                    // This is the first date field and we also have the second one
                    // Show just one entry for the date range
                    return (
                      <div 
                        key="dateRange" 
                        className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm truncate max-w-[200px]">
                          Date Range
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={onClearDateFilters}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only">Clear date filters</span>
                        </Button>
                      </div>
                    );
                  }
                  
                  if (key === 'dueDateTo' && filters.dueDateFrom) {
                    // Skip the second date field if we already have the first one
                    return null;
                  }
                  
                  // Helper to determine which clear function to use
                  const getClearFn = () => {
                    switch(key) {
                      case 'status': return onClearStatusFilter;
                      case 'priority': return onClearPriorityFilter;
                      case 'dueDateFrom':
                      case 'dueDateTo': return onClearDateFilters;
                      case 'searchQuery': return onClearSearchFilter;
                      case 'tags': return onClearTagsFilter;
                      default: return onClearAllFilters;
                    }
                  };
                  
                  return (
                    <div 
                      key={key} 
                      className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm truncate max-w-[200px]">
                        {getFilterDisplay(key)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={getClearFn()}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Clear filter</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-2 text-sm text-center text-muted-foreground">
              No active filters
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
