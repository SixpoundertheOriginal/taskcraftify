
import { useState, useEffect } from 'react';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjectStore } from '@/store';
import { cn } from '@/lib/utils';

interface ProjectSelectorProps {
  projectId: string | undefined;
  onProjectSelect: (id: string | undefined) => void;
  className?: string;
}

export function ProjectSelector({ projectId, onProjectSelect, className }: ProjectSelectorProps) {
  const { projects = [] } = useProjectStore();
  const [open, setOpen] = useState(false);
  
  const handleSelect = (value: string) => {
    console.log("ProjectSelector - Selected value:", value);
    
    // Handle special values
    if (value === "none") {
      console.log("ProjectSelector - Setting project to undefined (none)");
      onProjectSelect(undefined);
    } else {
      console.log("ProjectSelector - Setting project to:", value);
      onProjectSelect(value);
    }
    
    setOpen(false);
  };
  
  // Ensure projectId is a string when checking for existence
  const projectExists = projectId && projects && projects.some(project => project.id === projectId);
  const projectName = projectExists 
    ? projects.find(project => project.id === projectId)?.name || "Select project"
    : "No Project";
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          onClick={() => setOpen(!open)}
        >
          {projectName}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandEmpty>No project found.</CommandEmpty>
          <CommandGroup>
            <CommandItem 
              value="none"
              onSelect={() => handleSelect("none")}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                No Project
              </div>
              {!projectId && <CheckIcon className="ml-auto h-4 w-4" />}
            </CommandItem>
            
            {projects && projects.length > 0 && projects.map((project) => (
              <CommandItem
                key={project.id}
                value={project.id}
                onSelect={() => handleSelect(project.id)}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
                {projectId === project.id && <CheckIcon className="ml-auto h-4 w-4" />}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
