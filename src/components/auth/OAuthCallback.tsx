
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
        // Get parameters from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        // More robust provider detection
        const provider = determineProvider();
        
        console.log('OAuth callback parameters:', {
          code: code ? `${code.substring(0, 5)}...` : null,
          provider,
          error,
          errorDescription,
          sessionState: searchParams.has('session_state') ? 'present' : 'absent',
          state: searchParams.get('state'),
          allParams: Object.fromEntries([...searchParams])
        });
        
        if (error) {
          console.error(`OAuth error from provider: ${error} - ${errorDescription}`);
          setError(errorDescription || error);
          setProcessing(false);
          return;
        }
        
        if (!code) {
          setError('No authorization code received');
          setProcessing(false);
          return;
        }
        
        console.log(`Processing OAuth callback for provider: ${provider} with code: ${code.substring(0, 5)}...`);
        
        // Get the redirect URI that was used for the auth flow
        const redirectUri = window.location.origin + '/auth/callback';
        console.log(`Using redirect URI: ${redirectUri}`);
        
        try {
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
        } catch (callbackError) {
          console.error('Error in handleOAuthCallback:', callbackError);
          setError(callbackError instanceof Error ? callbackError.message : 'Failed to complete OAuth process');
          setProcessing(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete authentication');
        setProcessing(false);
      }
    };
    
    // Helper function to determine the provider from URL parameters
    function determineProvider(): string {
      // Log all search params for debugging
      console.log('All search params:', Object.fromEntries([...searchParams]));
      
      const state = searchParams.get('state');
      
      // Microsoft adds 'session_state' parameter
      if (searchParams.has('session_state')) {
        console.log('Detected Microsoft provider from session_state parameter');
        return 'microsoft';
      }
      
      // Check if state parameter contains provider info
      if (state) {
        if (state.includes('microsoft') || state.includes('outlook')) {
          console.log('Detected Microsoft provider from state parameter');
          return 'microsoft';
        }
        
        if (state.includes('google')) {
          console.log('Detected Google provider from state parameter');
          return 'google';
        }
      }
      
      // Check the URL path for provider hints
      const currentUrl = window.location.href.toLowerCase();
      if (currentUrl.includes('microsoft') || currentUrl.includes('outlook')) {
        console.log('Detected Microsoft provider from URL path');
        return 'microsoft';
      }
      
      if (currentUrl.includes('google')) {
        console.log('Detected Google provider from URL path');
        return 'google';
      }
      
      // Default to inferring from 'session_state' parameter
      const hasSessionState = searchParams.has('session_state');
      if (hasSessionState) {
        console.log('Defaulting to Microsoft provider based on session_state presence');
        return 'microsoft';
      }
      
      // Final fallback to Google
      console.log('Defaulting to Google provider');
      return 'google';
    }
    
    processCallback();
  }, [searchParams, handleOAuthCallback, navigate]);
  
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      {error ? (
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-red-500">Authentication Error</h2>
          <p className="max-w-md">{error}</p>
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-left max-w-md overflow-auto text-sm">
            <h3 className="font-medium mb-2">Debug Information:</h3>
            <p>URL Parameters:</p>
            <pre className="bg-gray-200 p-2 rounded text-xs">
              {JSON.stringify(Object.fromEntries([...searchParams]), null, 2)}
            </pre>
          </div>
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
