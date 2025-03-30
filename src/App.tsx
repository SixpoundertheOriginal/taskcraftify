
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { OAuthCallback } from '@/components/auth/OAuthCallback';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import Settings from '@/pages/Settings';
import { useTaskStore, useProjectStore, useIntegrationStore } from '@/store';
import { ThemeProvider } from '@/providers/ThemeProvider';

function App() {
  const { fetchTasks, setupTaskSubscription, refreshTaskCounts } = useTaskStore();
  const { fetchProjects, setupProjectSubscription } = useProjectStore();
  const { fetchIntegrations, fetchCalendarEvents, fetchEmailSettings } = useIntegrationStore();
  
  useEffect(() => {
    console.log("App mounted - setting up data fetching and subscriptions");
    
    // Initial fetch with priority order
    const loadData = async () => {
      try {
        // First fetch tasks and projects as they're most critical
        console.log("Fetching initial tasks data");
        const tasksResult = await fetchTasks();
        console.log(`Loaded ${tasksResult ? tasksResult.length : 0} tasks initially`);
        
        console.log("Fetching initial projects data");
        const projects = await fetchProjects();
        console.log(`Loaded ${projects ? projects.length : 0} projects initially`);
        
        // Then refresh task counts based on the loaded data
        console.log("Refreshing task counts after initial data load");
        refreshTaskCounts();
        
        // Then fetch other data in the background
        console.log("Fetching integrations data");
        await fetchIntegrations();
        console.log("Fetching calendar events");
        await fetchCalendarEvents();
        console.log("Fetching email settings");
        await fetchEmailSettings();
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    
    loadData();
    
    // Setup real-time subscriptions after initial data load
    console.log("Setting up real-time subscriptions");
    const unsubscribeTasks = setupTaskSubscription();
    const unsubscribeProjects = setupProjectSubscription();
    
    return () => {
      console.log("App unmounting - cleaning up subscriptions");
      unsubscribeTasks();
      unsubscribeProjects();
    };
  }, [
    fetchTasks, 
    setupTaskSubscription, 
    fetchProjects, 
    setupProjectSubscription, 
    refreshTaskCounts, 
    fetchIntegrations, 
    fetchCalendarEvents, 
    fetchEmailSettings
  ]);
  
  return (
    <ThemeProvider defaultTheme="system" storageKey="taskcraft-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
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
