
import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Calendar,
  ListTodo
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UnifiedTaskForm } from '@/components/unified/TaskForm';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

export const QuickAddButton = () => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [taskFormType, setTaskFormType] = useState<'task' | 'event'>('task');
  const [isHovered, setIsHovered] = useState(false);
  
  const handleOpenTaskForm = (type: 'task' | 'event') => {
    setTaskFormType(type);
    setIsTaskFormOpen(true);
    setIsDropdownOpen(false);
  };
  
  useKeyboardShortcut({
    key: 'k',
    ctrl: true,
    callback: () => {
      setTaskFormType('task');
      setIsTaskFormOpen(true);
    }
  });
  
  useKeyboardShortcut({
    key: 't',
    ctrl: true,
    callback: () => {
      setTaskFormType('task');
      setIsTaskFormOpen(true);
    }
  });
  
  useKeyboardShortcut({
    key: 'e',
    ctrl: true,
    callback: () => {
      setTaskFormType('event');
      setIsTaskFormOpen(true);
    }
  });
  
  const handleTaskFormOpenChange = (open: boolean) => {
    setIsTaskFormOpen(open);
  };
  
  return (
    <>
      <TooltipProvider>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "w-full h-10 justify-between bg-sidebar-primary text-sidebar-primary-foreground",
                    "border-none hover:bg-sidebar-primary/90 transition-all px-3 shadow-sm",
                    "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isHovered ? "rotate-90" : ""
                    )} />
                    <span className="font-medium">Quick Add</span>
                  </span>
                  <kbd className="bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground/70 text-[10px] font-mono rounded px-1.5 py-0.5">
                    Ctrl+K
                  </kbd>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Create new task or event (Ctrl+K)</p>
            </TooltipContent>
          </Tooltip>
          
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuLabel>Create New</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 cursor-pointer hover:bg-primary/5"
              onClick={() => handleOpenTaskForm('task')}
            >
              <ListTodo className="h-4 w-4" />
              <span>Task</span>
              <kbd className="ml-auto text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">Ctrl+T</kbd>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="gap-2 cursor-pointer hover:bg-primary/5"
              onClick={() => handleOpenTaskForm('event')}
            >
              <Calendar className="h-4 w-4" />
              <span>Calendar Event</span>
              <kbd className="ml-auto text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">Ctrl+E</kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
      
      <UnifiedTaskForm 
        open={isTaskFormOpen}
        onOpenChange={handleTaskFormOpenChange}
        initialDueDate={taskFormType === 'event' ? new Date() : undefined}
      />
    </>
  );
};
