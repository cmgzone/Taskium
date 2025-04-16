import React, { useState, useEffect } from 'react';
import { API_BASE_URL, buildApiUrl } from '@/lib/api-config';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function BackendStatusAlert() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        setBackendStatus('checking');
        // Try to connect to the API health endpoint
        const response = await fetch(buildApiUrl('/api/health'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Short timeout for quick feedback
          signal: AbortSignal.timeout(5000),
        });
        
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setBackendStatus('offline');
      }
    };
    
    checkBackendStatus();
  }, [retry]);

  if (backendStatus === 'online') {
    return null; // Don't show anything if backend is connected
  }

  return (
    <Alert 
      variant={backendStatus === 'checking' ? 'default' : 'destructive'}
      className="fixed bottom-4 right-4 max-w-md z-50 shadow-lg"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {backendStatus === 'checking' ? 'Checking Connection...' : 'Backend Connection Issue'}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {backendStatus === 'checking' ? (
          <div className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Verifying connection to TSK Platform backend...
          </div>
        ) : (
          <>
            <p className="mb-2">
              This is a frontend-only deployment. The TSK Platform backend server is not available.
              {API_BASE_URL ? ` Trying to connect to: ${API_BASE_URL}` : ''}
            </p>
            <p className="text-sm mb-3">
              Many features like user accounts, wallet management, and data storage require
              a running backend server.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={() => setRetry(prev => prev + 1)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}