
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useAuth } from '@/auth/AuthContext';

const Auth = () => {
  const [showSignIn, setShowSignIn] = useState(true);
  const { user } = useAuth();
  
  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md">
        {showSignIn ? (
          <SignInForm
            onToggleForm={() => setShowSignIn(false)}
          />
        ) : (
          <SignUpForm
            onToggleForm={() => setShowSignIn(true)}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
