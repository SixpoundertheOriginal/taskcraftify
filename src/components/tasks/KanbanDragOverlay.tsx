
import { DragOverlay } from '@dnd-kit/core';
import { Task } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getPriorityLabel, getStatusLabel } from '@/lib/utils';

interface KanbanDragOverlayProps {
  activeTask: Task | null;
  isDragging: boolean;
}

export function KanbanDragOverlay({ activeTask, isDragging }: KanbanDragOverlayProps) {
  if (!isDragging || !activeTask) return null;
  
  return (
    <DragOverlay adjustScale={true} zIndex={1000}>
      <Card className="w-[250px] border-l-4 shadow-lg">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-sm truncate">{activeTask.title}</h3>
            <div className="flex gap-1 flex-wrap">
              <Badge variant="outline" size="sm" className="text-xs">
                {getStatusLabel(activeTask.status)}
              </Badge>
              <Badge variant="outline" size="sm" className="text-xs">
                {getPriorityLabel(activeTask.priority)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </DragOverlay>
  );
}
