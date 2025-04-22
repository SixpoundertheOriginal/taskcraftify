import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
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
import { UIProvider } from '@/providers/UIProvider';
import { toast } from '@/hooks/use-toast';

function App() {
  const { 
    fetchTasks, 
    setupTaskSubscription, 
    refreshTaskCounts,
    isInitialLoadComplete,
    error: taskError,
  } = useTaskStore();
  
  const { fetchProjects, setupProjectSubscription } = useProjectStore();
  const { fetchIntegrations, fetchCalendarEvents, fetchEmailSettings } = useIntegrationStore();
  
  const taskSubscriptionRef = useRef<(() => void) | null>(null);
  const projectSubscriptionRef = useRef<(() => void) | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const handleConnectionRecovery = async () => {
    setConnectionError(null);
    
    try {
      console.log("Attempting to recover connection...");
      if (taskSubscriptionRef.current) {
        taskSubscriptionRef.current();
        taskSubscriptionRef.current = null;
      }
      if (projectSubscriptionRef.current) {
        projectSubscriptionRef.current();
        projectSubscriptionRef.current = null;
      }
      
      await fetchTasks();
      await fetchProjects();
      
      taskSubscriptionRef.current = setupTaskSubscription();
      projectSubscriptionRef.current = setupProjectSubscription();
      
      toast({
        title: "Connection restored",
        description: "Successfully reconnected to the database",
      });
    } catch (error) {
      console.error("Error recovering connection:", error);
      setConnectionError("Connection issues persisted. Please refresh the page or try again later.");
      
      if (retryCount < 5) {
        const backoffTime = Math.pow(2, retryCount) * 1000;
        console.log(`Will retry connection in ${backoffTime}ms`);
        
        setTimeout(() => {
          setRetryCount(count => count + 1);
          handleConnectionRecovery();
        }, backoffTime);
      } else {
        toast({
          title: "Connection failed",
          description: "Unable to reconnect to the database after multiple attempts",
          variant: "destructive",
        });
      }
    }
  };
  
  useEffect(() => {
    console.log("App mounted - setting up data fetching and subscriptions");
    
    const loadData = async () => {
      try {
        console.log("Fetching initial tasks data");
        const tasksResult = await fetchTasks();
        const tasksCount = Array.isArray(tasksResult) ? tasksResult.length : 0;
        console.log(`Loaded ${tasksCount} tasks initially`);
        
        console.log("Fetching initial projects data");
        const projects = await fetchProjects();
        const projectsCount = Array.isArray(projects) ? projects.length : 0;
        console.log(`Loaded ${projectsCount} projects initially`);
        
        console.log("Refreshing task counts after initial data load");
        refreshTaskCounts();
        
        console.log("Fetching integrations data");
        await fetchIntegrations();
        console.log("Fetching calendar events");
        await fetchCalendarEvents();
        console.log("Fetching email settings");
        await fetchEmailSettings();
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setConnectionError("Failed to load initial data. Check your internet connection.");
      }
    };
    
    loadData();
    
    console.log("Setting up real-time subscriptions");
    
    taskSubscriptionRef.current = setupTaskSubscription();
    projectSubscriptionRef.current = setupProjectSubscription();
    
    const handleOnline = () => {
      console.log("Network connection restored - refreshing data and subscriptions");
      handleConnectionRecovery();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      console.log("App unmounting - cleaning up subscriptions");
      
      window.removeEventListener('online', handleOnline);
      
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
  
  useEffect(() => {
    if (taskError) {
      toast({
        title: "Error loading tasks",
        description: taskError,
        variant: "destructive",
      });
    }
  }, [taskError]);
  
  useEffect(() => {
    if (connectionError && navigator.onLine) {
      handleConnectionRecovery();
    }
  }, [navigator.onLine, connectionError]);
  
  return (
    <ThemeProvider defaultTheme="light" storageKey="taskcraft-theme">
      <UIProvider>
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
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;
