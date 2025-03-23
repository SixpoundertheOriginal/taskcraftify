
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import { useTaskStore } from '@/store/useTaskStore';

function App() {
  const { fetchTasks, setupTaskSubscription } = useTaskStore();
  
  useEffect(() => {
    // Initial fetch
    fetchTasks().catch(console.error);
    
    // Setup real-time subscription
    const unsubscribe = setupTaskSubscription();
    
    return () => {
      unsubscribe();
    };
  }, [fetchTasks, setupTaskSubscription]);
  
  return (
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
  );
}

export default App;
