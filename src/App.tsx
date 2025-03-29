
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
    
    // Initial fetch
    const loadData = async () => {
      try {
        console.log("Fetching initial tasks data");
        await fetchTasks();
        console.log("Fetching initial projects data");
        await fetchProjects();
        console.log("Fetching integrations data");
        await fetchIntegrations();
        console.log("Fetching calendar events");
        await fetchCalendarEvents();
        console.log("Fetching email settings");
        await fetchEmailSettings();
        
        // Ensure counts are updated after initial data load
        refreshTaskCounts();
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    
    loadData();
    
    // Setup real-time subscriptions
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
