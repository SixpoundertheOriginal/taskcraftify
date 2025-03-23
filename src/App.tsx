
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import { useTaskStore, useProjectStore } from '@/store';
import { ThemeProvider } from '@/providers/ThemeProvider';

function App() {
  const { fetchTasks, setupTaskSubscription } = useTaskStore();
  const { fetchProjects, setupProjectSubscription } = useProjectStore();
  
  useEffect(() => {
    // Initial fetch
    fetchTasks().catch(console.error);
    fetchProjects().catch(console.error);
    
    // Setup real-time subscriptions
    const unsubscribeTasks = setupTaskSubscription();
    const unsubscribeProjects = setupProjectSubscription();
    
    return () => {
      unsubscribeTasks();
      unsubscribeProjects();
    };
  }, [fetchTasks, setupTaskSubscription, fetchProjects, setupProjectSubscription]);
  
  return (
    <ThemeProvider defaultTheme="system" storageKey="taskcraft-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
