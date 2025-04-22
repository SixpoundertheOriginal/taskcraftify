
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { List, Kanban, LayoutGrid } from "lucide-react";

export type ViewMode = 'list' | 'kanban' | 'groups';

interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex bg-muted rounded-md overflow-hidden">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange('list')}
              className={cn(
                "h-8 px-2 rounded-none",
                activeView === 'list' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Linear View: Perfect for quick task scanning</p>
            <small className="text-muted-foreground">Best for step-by-step task management</small>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange('kanban')}
              className={cn(
                "h-8 px-2 rounded-none",
                activeView === 'kanban' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Kanban className="h-4 w-4 mr-1" />
              Kanban
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Workflow Visualization: Track task progress</p>
            <small className="text-muted-foreground">Ideal for understanding task flow</small>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange('groups')}
              className={cn(
                "h-8 px-2 rounded-none",
                activeView === 'groups' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Groups
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Organized Clusters: Group tasks by context</p>
            <small className="text-muted-foreground">Great for project or category sorting</small>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
