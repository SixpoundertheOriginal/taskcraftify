
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProjectQuickAddProps {
  onClick: () => void;
}

export function ProjectQuickAdd({ onClick }: ProjectQuickAddProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7 border-sidebar-border text-sidebar-primary border-sidebar-primary/30 hover:border-sidebar-primary/70 hover:bg-sidebar-primary/10" 
            onClick={onClick}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only">New Project</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">New Project (Ctrl+N)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
