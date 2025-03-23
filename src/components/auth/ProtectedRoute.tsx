
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

export function ProtectedRoute({ 
  children, 
  redirectPath = '/auth' 
}: ProtectedRouteProps) {
  const { user, isLoading, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Only redirect after auth is initialized and not loading
    if (isInitialized && !isLoading && !user) {
      // Save the current path for redirecting back after login
      navigate(redirectPath, { 
        replace: true, 
        state: { from: location.pathname } 
      });
    }
  }, [user, isLoading, isInitialized, navigate, location.pathname, redirectPath]);
  
  // Show loading spinner while auth is initializing or loading
  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background/50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }
  
  return user ? <>{children}</> : null;
}
