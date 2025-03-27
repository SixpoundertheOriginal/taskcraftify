
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragCancelEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useIsMobile } from './use-mobile';

export function useDndSortable<T extends { id: string }>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Update items when initialItems change (from external source)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 12 : 8,
        delay: isMobile ? 200 : 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Announce to screen readers
    const item = items.find(item => item.id === active.id);
    const announcement = `Started dragging ${item ? 'item' : 'element'}`;
    if (typeof window !== 'undefined') {
      const announcementElement = document.getElementById('drag-announcement');
      if (announcementElement) {
        announcementElement.textContent = announcement;
      }
    }
  }
  
  function handleDragOver(event: DragOverEvent) {
    // Handle drag over logic if needed
  }
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Announce to screen readers
        const announcement = `Item moved to position ${newIndex + 1} of ${items.length}`;
        if (typeof window !== 'undefined') {
          const announcementElement = document.getElementById('drag-announcement');
          if (announcementElement) {
            announcementElement.textContent = announcement;
          }
        }
        
        return newItems;
      });
    }
  }
  
  function handleDragCancel(event: DragCancelEvent) {
    setActiveId(null);
    
    // Announce to screen readers
    const announcement = 'Drag operation cancelled';
    if (typeof window !== 'undefined') {
      const announcementElement = document.getElementById('drag-announcement');
      if (announcementElement) {
        announcementElement.textContent = announcement;
      }
    }
  }
  
  return {
    items,
    setItems,
    activeId,
    sensors,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  };
}

export interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  dragHandleClassName?: string;
}

export function SortableItem({ id, children, className, dragHandleClassName }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    data: {
      id,
    },
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative' as const,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      {...attributes}
      {...listeners}
      aria-roledescription="sortable item"
      aria-describedby={`dnd-description-${id}`}
    >
      {children}
      <span id={`dnd-description-${id}`} className="sr-only">
        Press space bar to lift the item, arrow keys to move, and space bar again to drop
      </span>
    </div>
  );
}

export function DndSortableContext({ 
  children, 
  items, 
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragCancel,
  sensors,
  announceText = "Sortable list. Press space on an item to lift it, arrow keys to move, and space again to drop.",
}: { 
  children: React.ReactNode;
  items: { id: string }[];
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel?: (event: DragCancelEvent) => void;
  sensors?: ReturnType<typeof useSensors>;
  announceText?: string;
}) {
  const isMobile = useIsMobile();
  
  const defaultSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 12 : 8,
        delay: isMobile ? 200 : 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  return (
    <>
      <div className="sr-only" aria-live="polite" id="drag-announcement"></div>
      <div 
        role="region" 
        aria-roledescription="sortable" 
        aria-describedby="drag-instructions"
      >
        <div id="drag-instructions" className="sr-only">
          {announceText}
        </div>
        
        <DndContext
          sensors={sensors || defaultSensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <SortableContext
            items={items}
            strategy={verticalListSortingStrategy}
          >
            {children}
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
}
