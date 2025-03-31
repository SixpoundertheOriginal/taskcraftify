
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useRef } from 'react';
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
  const { 
    fetchTasks, 
    setupTaskSubscription, 
    refreshTaskCounts,
    isInitialLoadComplete,
  } = useTaskStore();
  
  const { fetchProjects, setupProjectSubscription } = useProjectStore();
  const { fetchIntegrations, fetchCalendarEvents, fetchEmailSettings } = useIntegrationStore();
  
  // Use refs to track subscription cleanup functions
  const taskSubscriptionRef = useRef<() => void | null>(null);
  const projectSubscriptionRef = useRef<() => void | null>(null);
  
  useEffect(() => {
    console.log("App mounted - setting up data fetching and subscriptions");
    
    // Initial fetch with priority order
    const loadData = async () => {
      try {
        // First fetch tasks and projects as they're most critical
        console.log("Fetching initial tasks data");
        const tasksResult = await fetchTasks();
        // Handle the case when tasksResult might be an array or undefined
        const tasksCount = Array.isArray(tasksResult) ? tasksResult.length : 0;
        console.log(`Loaded ${tasksCount} tasks initially`);
        
        console.log("Fetching initial projects data");
        const projects = await fetchProjects();
        // Handle the case when projects might be an array or undefined
        const projectsCount = Array.isArray(projects) ? projects.length : 0;
        console.log(`Loaded ${projectsCount} projects initially`);
        
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
    
    // Store cleanup functions in refs
    taskSubscriptionRef.current = setupTaskSubscription();
    projectSubscriptionRef.current = setupProjectSubscription();
    
    // Set up network status event listeners
    const handleOnline = () => {
      console.log("Network connection restored - refreshing data and subscriptions");
      
      // Clean up existing subscriptions
      if (taskSubscriptionRef.current) {
        taskSubscriptionRef.current();
      }
      if (projectSubscriptionRef.current) {
        projectSubscriptionRef.current();
      }
      
      // Fetch fresh data
      fetchTasks();
      fetchProjects();
      
      // Set up new subscriptions
      taskSubscriptionRef.current = setupTaskSubscription();
      projectSubscriptionRef.current = setupProjectSubscription();
    };
    
    // Add network status event listeners
    window.addEventListener('online', handleOnline);
    
    return () => {
      console.log("App unmounting - cleaning up subscriptions");
      
      // Remove event listeners
      window.removeEventListener('online', handleOnline);
      
      // Clean up subscriptions using refs
      if (taskSubscriptionRef.current) {
        taskSubscriptionRef.current();
        taskSubscriptionRef.current = null;
      }
      
      if (projectSubscriptionRef.current) {
        projectSubscriptionRef.current();
        projectSubscriptionRef.current = null;
      }
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
