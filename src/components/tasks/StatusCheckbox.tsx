
import { Check } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@/types/task';

export interface StatusCheckboxProps {
  isDone: boolean;
  isExiting: boolean;
  isRemoved: boolean;
  isArchived: boolean;
  completeTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  onStatusClick: (e: React.MouseEvent) => void;
}

export function StatusCheckbox({
  isDone,
  isExiting,
  isRemoved,
  isArchived,
  completeTimeoutRef,
  onStatusClick
}: StatusCheckboxProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onStatusClick}
            className={cn(
              "flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1",
              "h-6 w-6 min-w-[1.5rem] min-h-[1.5rem] border-2 shadow-sm",
              isDone
                ? "bg-[#9b87f5] border-[#9b87f5] text-white hover:bg-[#8d70eb] hover:border-[#8d70eb]"
                : "bg-background border-gray-300 dark:border-gray-600 text-[#8E9196] hover:border-[#9b87f5] hover:bg-purple-50 dark:hover:bg-purple-900/20",
              isArchived && "opacity-40 cursor-not-allowed"
            )}
            aria-label={isDone ? (completeTimeoutRef.current ? "Double click to undo" : "Mark as not done") : "Mark as done"}
            disabled={isArchived}
            tabIndex={0}
            type="button"
          >
            {isDone ? (
              <Check className="h-4 w-4" strokeWidth={3} />
            ) : (
              <span className={cn(
                "block rounded-full w-3 h-3", 
                "border dark:border-gray-500",
                "bg-card dark:bg-transparent"
              )} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {isDone && completeTimeoutRef.current
            ? "Double click to undo completion"
            : isDone
              ? "Click to mark as not done"
              : "Click to mark as done"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
