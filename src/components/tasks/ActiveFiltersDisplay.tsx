
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
  onClearAllFilters: () => void;
}

export function ActiveFiltersDisplay({
  filters,
  onClearStatusFilter,
  onClearPriorityFilter,
  onClearDateFilters,
  onClearAllFilters
}: ActiveFiltersDisplayProps) {
  // Determine if there are active filters
  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'searchQuery' || (key === 'searchQuery' && filters.searchQuery && filters.searchQuery.trim() !== '')
  );
  
  if (!hasActiveFilters) return null;
  
  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <span className="text-xs text-muted-foreground">Active filters:</span>
      
      {filters.status && (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700">
          Status: {filters.status.map(s => TaskStatus[s]).join(', ')}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0 ml-1 hover:bg-blue-100" 
            onClick={onClearStatusFilter}
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
            onClick={onClearPriorityFilter}
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
            onClick={onClearDateFilters}
          >
            <FilterX className="h-2.5 w-2.5" />
            <span className="sr-only">Clear date filters</span>
          </Button>
        </Badge>
      )}
      
      {filters.searchQuery && (
        <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700">
          Search: "{filters.searchQuery}"
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-4 w-4 p-0 ml-1 hover:bg-purple-100" 
            onClick={() => {
              const { searchQuery, ...rest } = filters;
              onClearAllFilters();
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
        onClick={onClearAllFilters}
      >
        Clear all filters
      </Button>
    </div>
  );
}

// Update the exports in tasks/index.ts to include the new component
