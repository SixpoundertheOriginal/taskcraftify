
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  Session, 
  User, 
  AuthError,
  AuthResponse
} from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
};

type AuthContextType = AuthState & {
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isInitialized: false,
    error: null,
  });
  const { toast } = useToast();

  // Handle auth state changes
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setAuthState(prevState => ({
          ...prevState,
          session,
          user: session?.user ?? null,
          isLoading: false,
          isInitialized: true
        }));

        if (event === 'SIGNED_IN') {
          toast({
            title: "Signed in successfully",
            description: "Welcome back!",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out successfully",
            description: "You have been signed out.",
          });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth token refreshed');
        }
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthState(prevState => ({
          ...prevState,
          session,
          user: session?.user ?? null,
          isLoading: false,
          isInitialized: true
        }));
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState(prevState => ({
          ...prevState,
          isLoading: false,
          isInitialized: true,
          error: error as AuthError
        }));
      }
    };

    initializeAuth();

    // Clean up subscription on unmount
    return () => subscription.unsubscribe();
  }, [toast]);

  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prevState => ({ ...prevState, isLoading: true, error: null }));
      const response = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (response.error) {
        setAuthState(prevState => ({ 
          ...prevState, 
          error: response.error, 
          isLoading: false 
        }));
        toast({
          title: "Sign up failed",
          description: response.error.message,
          variant: "destructive",
        });
      } else if (response.data.user) {
        toast({
          title: "Sign up successful",
          description: "Please check your email to confirm your account.",
        });
      }
      
      setAuthState(prevState => ({ ...prevState, isLoading: false }));
      return response;
    } catch (error) {
      console.error('Sign up error:', error);
      const authError = error as AuthError;
      setAuthState(prevState => ({ 
        ...prevState, 
        error: authError, 
        isLoading: false 
      }));
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prevState => ({ ...prevState, isLoading: true, error: null }));
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (response.error) {
        setAuthState(prevState => ({ 
          ...prevState, 
          error: response.error, 
          isLoading: false 
        }));
        toast({
          title: "Sign in failed",
          description: response.error.message,
          variant: "destructive",
        });
      }
      
      setAuthState(prevState => ({ ...prevState, isLoading: false }));
      return response;
    } catch (error) {
      console.error('Sign in error:', error);
      const authError = error as AuthError;
      setAuthState(prevState => ({ 
        ...prevState, 
        error: authError, 
        isLoading: false 
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prevState => ({ ...prevState, isLoading: true }));
      await supabase.auth.signOut();
      setAuthState(prevState => ({ 
        ...prevState, 
        isLoading: false 
      }));
      toast({
        title: "Signed out",
        description: "You have successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      const authError = error as AuthError;
      setAuthState(prevState => ({ 
        ...prevState, 
        error: authError, 
        isLoading: false 
      }));
      toast({
        title: "Sign out failed",
        variant: "destructive",
      });
    }
  };

  const refreshSession = async () => {
    try {
      setAuthState(prevState => ({ ...prevState, isLoading: true }));
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setAuthState(prevState => ({ 
          ...prevState, 
          error,
          isLoading: false 
        }));
        console.error('Session refresh error:', error);
        return null;
      }
      
      setAuthState(prevState => ({ 
        ...prevState, 
        session,
        user: session?.user ?? prevState.user,
        isLoading: false 
      }));
      
      return session;
    } catch (error) {
      console.error('Session refresh error:', error);
      setAuthState(prevState => ({ 
        ...prevState, 
        error: error as AuthError, 
        isLoading: false 
      }));
      return null;
    }
  };

  // Create a memoized value of the context
  const contextValue = useMemo(() => ({
    ...authState,
    signUp,
    signIn,
    signOut,
    refreshSession
  }), [authState]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
