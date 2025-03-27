
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIntegrationStore } from '@/store';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const { handleOAuthCallback } = useIntegrationStore();
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const provider = searchParams.get('provider') || determineProvider();
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error(`OAuth error: ${error} - ${errorDescription}`);
          setError(errorDescription || error);
          setProcessing(false);
          return;
        }
        
        if (!code) {
          setError('No authorization code received');
          setProcessing(false);
          return;
        }
        
        console.log(`Processing OAuth callback for provider: ${provider}`);
        
        // Get the redirect URI that was used for the auth flow
        const redirectUri = window.location.origin + '/auth/callback';
        
        const result = await handleOAuthCallback(provider, code, redirectUri);
        
        if (result) {
          toast({
            title: "Integration connected successfully",
            description: `Your ${provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'} account has been connected.`
          });
          navigate('/settings');
        } else {
          throw new Error('Failed to complete authentication');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete authentication');
        setProcessing(false);
      }
    };
    
    // Try to determine the provider from the URL or other parameters
    const determineProvider = (): string => {
      // Microsoft adds 'session_state' parameter
      if (searchParams.has('session_state')) {
        return 'microsoft';
      }
      // Default to Google if we can't determine
      return 'google';
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
            onClick={() => navigate('/settings')}
          >
            Return to Settings
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
