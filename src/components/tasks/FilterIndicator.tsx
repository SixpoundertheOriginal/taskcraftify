
import { Filter as FilterIcon } from 'lucide-react';
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
  // Count active filters
  const activeFiltersCount = Object.keys(filters).reduce((count, key) => {
    if (key === 'searchQuery') {
      return filters.searchQuery && filters.searchQuery.trim() !== '' ? count + 1 : count;
    }
    if (key === 'tags') {
      return filters.tags && filters.tags.length > 0 ? count + 1 : count;
    }
    if (key === 'dueDateFrom' || key === 'dueDateTo') {
      // Count date range as a single filter
      return (filters.dueDateFrom || filters.dueDateTo) ? count + 1 : count;
    }
    return filters[key as keyof TaskFilters] ? count + 1 : count;
  }, 0);

  const hasActiveFilters = activeFiltersCount > 0;

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
            <ActiveFiltersDisplay 
              filters={filters}
              onClearStatusFilter={onClearStatusFilter}
              onClearPriorityFilter={onClearPriorityFilter}
              onClearDateFilters={onClearDateFilters}
              onClearSearchFilter={onClearSearchFilter}
              onClearTagsFilter={onClearTagsFilter}
              onClearAllFilters={onClearAllFilters}
            />
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
