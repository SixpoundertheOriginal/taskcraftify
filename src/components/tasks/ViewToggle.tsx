
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { KanbanSquare, List } from 'lucide-react';

export type ViewMode = 'list' | 'kanban';

interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup type="single" value={activeView} onValueChange={(value: string) => {
      if (value) onViewChange(value as ViewMode);
    }} className="border rounded-md p-0.5 bg-muted/30">
      <ToggleGroupItem value="list" aria-label="List view" className={cn(
        "rounded-md h-8 w-8 p-0 transition-all duration-150", 
        activeView === "list" ? "bg-background text-primary shadow-sm" : "hover:bg-muted/70"
      )}>
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="kanban" aria-label="Kanban view" className={cn(
        "rounded-md h-8 w-8 p-0 transition-all duration-150",
        activeView === "kanban" ? "bg-background text-primary shadow-sm" : "hover:bg-muted/70"
      )}>
        <KanbanSquare className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
