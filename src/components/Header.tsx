
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskForm } from '@/components/TaskForm';

export function Header() {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  
  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <a href="/" className="font-medium text-xl">
            TaskCraft
          </a>
        </div>
        <div className="ml-auto flex items-center">
          <Button onClick={() => setIsTaskFormOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>
      <TaskForm open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen} />
    </header>
  );
}
