
import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { TaskList, KanbanBoard, ViewToggle, FloatingActionButton } from '@/components/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useTaskStore } from '@/store/taskStore/taskStore';
import { TaskStatus } from '@/types/task';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { ViewMode } from '@/components/tasks/ViewToggle';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const { 
    getTasksByStatus, 
    fetchTasks, 
    isLoading, 
    error,
    tasks, // Add tasks to the dependencies to update counters
  } = useTaskStore();
  
  // Calculate task counts
  const todoTasks = getTasksByStatus(TaskStatus.TODO);
  const inProgressTasks = getTasksByStatus(TaskStatus.IN_PROGRESS);
  const doneTasks = getTasksByStatus(TaskStatus.DONE);
  const totalTasks = todoTasks.length + inProgressTasks.length + doneTasks.length;
  
  // Handle view change
  const handleViewChange = (view: ViewMode) => {
    setActiveView(view);
    // Save view preference to localStorage
    localStorage.setItem('taskcraft-view', view);
  };
  
  // Load saved view preference on mount
  useEffect(() => {
    const savedView = localStorage.getItem('taskcraft-view') as ViewMode | null;
    if (savedView) {
      setActiveView(savedView);
    }
  }, []);
  
  // Display error if there is one
  if (error) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message || 'There was an error loading your tasks. Please try again.'}
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <section className="mb-8 animate-slide-up">
        <h1 className="text-4xl font-medium mb-2">Welcome to TaskCraft</h1>
        <p className="text-lg text-muted-foreground">Elegantly simple task management</p>
      </section>
      
      <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Tasks Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && tasks.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To Do</span>
                  <span className="font-medium">{todoTasks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">In Progress</span>
                  <span className="font-medium">{inProgressTasks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{doneTasks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{totalTasks}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && tasks.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {[...todoTasks, ...inProgressTasks]
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 3)
                  .map(task => (
                    <div key={task.id} className="border-b pb-2 last:border-0 last:pb-0">
                      <div className="font-medium text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>{task.status === TaskStatus.TODO ? 'Todo' : 'In Progress'}</span>
                        <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  
                {todoTasks.length === 0 && inProgressTasks.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No active tasks. Add some tasks to get started!
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      
      <section className="mb-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium">Your Tasks</h2>
          <ViewToggle activeView={activeView} onViewChange={handleViewChange} />
        </div>
        
        {activeView === 'list' ? (
          <TaskList />
        ) : (
          <KanbanBoard />
        )}
      </section>
      
      {/* Floating Action Button */}
      <FloatingActionButton />
    </Layout>
  );
};

export default Index;
