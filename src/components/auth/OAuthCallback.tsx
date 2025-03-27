
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIntegrationStore } from '@/store';
import { Loader2 } from 'lucide-react';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { handleOAuthCallback } = useIntegrationStore();
  
  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const provider = searchParams.get('provider') || 'google'; // Default to Google if not specified
      const error = searchParams.get('error');
      
      if (error) {
        setError(error);
        return;
      }
      
      if (!code) {
        setError('No authorization code received');
        return;
      }
      
      try {
        await handleOAuthCallback(provider, code);
        navigate('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete authentication');
      }
    };
    
    processCallback();
  }, [searchParams, handleOAuthCallback, navigate]);
  
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      {error ? (
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-red-500">Authentication Error</h2>
          <p>{error}</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md mt-4"
            onClick={() => navigate('/')}
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p>Completing authentication, please wait...</p>
        </div>
      )}
    </div>
  );
}
