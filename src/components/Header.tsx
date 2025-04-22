
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, User, AlertCircle, Bug } from 'lucide-react';
import { TaskForm } from '@/components/tasks';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/auth/AuthContext';
import { UserMenu } from './Header/UserMenu';
import { useTaskStore } from '@/store';
import { Alert } from '@/components/ui/alert';
import { DebugTaskList } from './debug/DebugTaskList';

export function Header() {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const { user } = useAuth();
  const { 
    tasks, 
    getTasksCountByStatus, 
    getOverdueTasks, 
    refreshTaskCounts, 
    setupTaskSubscription, 
    fetchTasks,
    isLoading,
    error
  } = useTaskStore();
  
  useEffect(() => {
    if (user) {
      console.log("[Header] Component mounted, setting up tasks");
      
      const unsubscribe = setupTaskSubscription();
      
      // Refresh task counts when component mounts
      refreshTaskCounts();
      
      return () => {
        console.log("[Header] Component unmounting, cleaning up subscription");
        unsubscribe();
      };
    }
  }, [setupTaskSubscription, refreshTaskCounts, user]);
  
  // Refresh task counts when tasks array changes
  useEffect(() => {
    if (tasks.length > 0) {
      console.log("[Header] Tasks updated, refreshing counts");
      refreshTaskCounts();
    }
  }, [tasks, refreshTaskCounts]);
  
  useEffect(() => {
    if (error) {
      setLoadError(typeof error === 'string' ? error : 'Failed to load tasks');
    } else {
      setLoadError(null);
    }
  }, [error]);
  
  const taskStats = getTasksCountByStatus();
  const overdueTasks = getOverdueTasks();
  const hasTasks = tasks.length > 0;
  
  const userEmail = user?.email || '';
  const userName = userEmail ? userEmail.split('@')[0] : 'there';
  
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowDebug(!showDebug)}
            className={showDebug ? "bg-yellow-100 text-yellow-800" : ""}
          >
            <Bug className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button onClick={() => setIsTaskFormOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
          {user && <UserMenu />}
        </div>
      </div>
      
      {loadError && (
        <div className="container py-2">
          <Alert variant="destructive" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Error loading tasks: {loadError}</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto" 
              onClick={() => fetchTasks()}
            >
              Retry
            </Button>
          </Alert>
        </div>
      )}
      
      {user && !loadError && (
        <div className="container py-4 animate-fade-in border-t">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold">Hello, {formattedName}!</h2>
              <p className="text-muted-foreground">
                {isLoading ? "Loading your tasks..." : 
                  !hasTasks 
                    ? "Welcome to TaskCraft! Get started by creating your first task."
                    : overdueTasks.length > 0
                      ? `You have ${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'} that need attention.`
                      : `You have ${(taskStats.TODO || 0) + (taskStats.IN_PROGRESS || 0)} active ${((taskStats.TODO || 0) + (taskStats.IN_PROGRESS || 0)) === 1 ? 'task' : 'tasks'} and completed ${taskStats.DONE || 0} ${taskStats.DONE === 1 ? 'task' : 'tasks'}.`
                }
              </p>
            </div>
            
            {hasTasks && !isLoading && (
              <div className="flex gap-3 text-sm">
                <div className="px-3 py-1 rounded-md bg-muted flex items-center gap-1.5">
                  <span className="font-medium">{taskStats.TODO || 0}</span>
                  <span className="text-muted-foreground">To Do</span>
                </div>
                <div className="px-3 py-1 rounded-md bg-muted flex items-center gap-1.5">
                  <span className="font-medium">{taskStats.IN_PROGRESS || 0}</span>
                  <span className="text-muted-foreground">In Progress</span>
                </div>
                <div className="px-3 py-1 rounded-md bg-muted flex items-center gap-1.5">
                  <span className="font-medium">{taskStats.DONE || 0}</span>
                  <span className="text-muted-foreground">Done</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {showDebug && <DebugTaskList />}
      
      <TaskForm open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen} />
    </header>
  );
}
