
import { ReactNode } from 'react';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskGroupProps {
  title: string;
  count?: number;
  className?: string;
  children: ReactNode;
  isEmpty?: boolean;
  emptyState?: ReactNode;
}

export function TaskGroup({
  title,
  count,
  className,
  children,
  isEmpty = false,
  emptyState
}: TaskGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md">
              {count}
            </span>
          )}
        </h3>
      </div>
      
      {isEmpty && emptyState ? (
        emptyState
      ) : (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}
