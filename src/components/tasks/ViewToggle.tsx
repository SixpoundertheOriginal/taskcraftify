
import { Button } from "@/components/ui/button";
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
    </div>
  );
}
