
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Tag, X, Filter, FilterX } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { TaskFilters } from '@/types/task';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';

interface FilterSidebarProps {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  allTags: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
}

export function FilterSidebar({
  filters,
  setFilters,
  allTags,
  searchQuery,
  setSearchQuery,
  clearAllFilters
}: FilterSidebarProps) {
  const [tagInput, setTagInput] = useState('');
  
  const debouncedSearch = debounce((query: string) => {
    setFilters({ ...filters, searchQuery: query });
  }, 300);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };
  
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  
  const handleTagSelect = (tag: string) => {
    const currentTags = filters.tags || [];
    
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      setFilters({ ...filters, tags: newTags });
    }
    
    setTagInput('');
  };
  
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
  
  const clearSearchFilter = () => {
    setSearchQuery('');
    const { searchQuery, ...restFilters } = filters;
    setFilters(restFilters);
  };
  
  const clearTagsFilter = () => {
    const { tags, ...restFilters } = filters;
    setFilters(restFilters);
    setTagInput('');
  };
  
  const filteredTags = allTags
    .filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()))
    .filter(tag => !(filters.tags || []).includes(tag));
  
  const hasActiveFilters = Object.keys(filters).length > 0;
  
  return (
    <Sidebar variant="inset" className="bg-background border-r">
      <SidebarHeader className="flex flex-col gap-2 pt-4 pb-2">
        <div className="flex items-center px-3 pb-2">
          <h2 className="text-lg font-medium">Filters</h2>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-xs"
              onClick={clearAllFilters}
            >
              <FilterX className="h-3.5 w-3.5 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel>Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-9 bg-background/50 backdrop-blur-sm border-muted"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                  onClick={clearSearchFilter}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        <SidebarGroup>
          <SidebarGroupLabel>Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-between gap-2">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      <span>Select tags</span>
                    </div>
                    {filters.tags && filters.tags.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {filters.tags.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2">
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
                      <div 
                        className="px-2 py-1.5 text-sm hover:bg-muted rounded-sm cursor-pointer" 
                        onClick={() => handleTagSelect(tagInput.trim())}
                      >
                        Add tag: {tagInput}
                      </div>
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No matching tags</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-1">
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
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full mt-1"
                    onClick={clearTagsFilter}
                  >
                    Clear all tags
                  </Button>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
