
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, User } from 'lucide-react';
import { TaskForm } from '@/components/tasks';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/auth/AuthContext';
import { UserMenu } from './Header/UserMenu';
import { useTaskStore } from '@/store';

export function Header() {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const { user } = useAuth();
  const taskStore = useTaskStore();
  
  // Calculate task statistics for the welcome message
  const taskStats = taskStore.getTasksCountByStatus();
  const overdueTasks = taskStore.getOverdueTasks();
  const hasTasks = Object.values(taskStats).some(count => count > 0);
  
  // Get user's email and extract name
  const userEmail = user?.email || '';
  const userName = userEmail ? userEmail.split('@')[0] : 'there';
  
  // Format name - capitalize first letter of each word
  const formattedName = userName
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  
  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <a href="/" className="font-medium text-xl">
            TaskCraft
          </a>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={() => setIsTaskFormOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
          {user && <UserMenu />}
        </div>
      </div>
      
      {user && (
        <div className="container py-4 animate-fade-in border-t">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold">Hello, {formattedName}!</h2>
              <p className="text-muted-foreground">
                {!hasTasks 
                  ? "Welcome to TaskCraft! Get started by creating your first task."
                  : overdueTasks.length > 0
                    ? `You have ${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'} that need attention.`
                    : `You have ${taskStats.TODO + taskStats.IN_PROGRESS} active ${(taskStats.TODO + taskStats.IN_PROGRESS) === 1 ? 'task' : 'tasks'} and completed ${taskStats.DONE} ${taskStats.DONE === 1 ? 'task' : 'tasks'}.`
                }
              </p>
            </div>
            
            {hasTasks && (
              <div className="flex gap-3 text-sm">
                <div className="px-3 py-1 rounded-md bg-muted flex items-center gap-1.5">
                  <span className="font-medium">{taskStats.TODO}</span>
                  <span className="text-muted-foreground">To Do</span>
                </div>
                <div className="px-3 py-1 rounded-md bg-muted flex items-center gap-1.5">
                  <span className="font-medium">{taskStats.IN_PROGRESS}</span>
                  <span className="text-muted-foreground">In Progress</span>
                </div>
                <div className="px-3 py-1 rounded-md bg-muted flex items-center gap-1.5">
                  <span className="font-medium">{taskStats.DONE}</span>
                  <span className="text-muted-foreground">Done</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <TaskForm open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen} />
    </header>
  );
}
