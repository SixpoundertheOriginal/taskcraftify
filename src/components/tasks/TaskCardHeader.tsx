
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskCardHeaderProps {
  title: string;
  isDone: boolean;
  isExpanded: boolean;
  onToggleExpanded: (e: React.MouseEvent) => void;
  onClickTitle?: () => void;
}

export function TaskCardHeader({ title, isDone, isExpanded, onToggleExpanded }: TaskCardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-1">
      <h3 className={cn(
        "font-medium text-base leading-tight truncate",
        isDone && "line-through opacity-70"
      )}>
        {title}
      </h3>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleExpanded}
        className="h-6 w-6 shrink-0 text-muted-foreground hidden group-hover:flex"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle details</span>
      </Button>
    </div>
  );
}
