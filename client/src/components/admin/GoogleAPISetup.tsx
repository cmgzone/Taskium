import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export function GoogleAPISetup() {
  const { toast } = useToast();
  const [status, setStatus] = useState<{
    configured: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [searchEngineId, setSearchEngineId] = useState('');
  const [testQuery, setTestQuery] = useState('TSK platform');
  const [testResults, setTestResults] = useState<any>(null);

  // Fetch current status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get('/api/setup/google-api/status');
        setStatus(response.data);
      } catch (error) {
        console.error('Error fetching Google API status:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch Google API status',
          variant: 'destructive',
        });
      }
    };

    fetchStatus();
  }, [toast]);

  const handleSetupSubmit = async () => {
    if (!apiKey || !searchEngineId) {
      toast({
        title: 'Missing Information',
        description: 'Both API Key and Search Engine ID are required.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/setup/google-api/keys', { 
        apiKey, 
        searchEngineId 
      });

      const responseData = response.data;
      
      if (responseData.success) {
        toast({
          title: 'Success',
          description: responseData.message,
        });
        
        // Refresh status
        const statusResponse = await axios.get('/api/setup/google-api/status');
        setStatus(statusResponse.data);
        
        // Clear inputs for security
        setApiKey('');
        setSearchEngineId('');
      } else {
        toast({
          title: 'Error',
          description: responseData.message || 'Failed to set up Google API keys',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error setting up Google API:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while setting up Google API',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!status?.configured) {
      toast({
        title: 'API Not Configured',
        description: 'Please set up the Google API keys first.',
        variant: 'destructive',
      });
      return;
    }

    setTesting(true);
    setTestResults(null);
    
    try {
      const response = await axios.post('/api/setup/google-api/test', {
        query: testQuery
      });

      const responseData = response.data;
      setTestResults(responseData);
      
      if (responseData.success) {
        toast({
          title: 'Test Successful',
          description: 'Google API connection is working properly!',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: responseData.message || 'Failed to get results from Google API',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing Google API:', error);
      toast({
        title: 'Test Error',
        description: 'An unexpected error occurred while testing the API',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Google API Integration</CardTitle>
        <CardDescription>
          Add Google APIs to enhance the AI assistant's knowledge capabilities.
          When internal knowledge is insufficient, the AI can search for information online.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {status && (
          <Alert className={status.configured ? "bg-green-50" : "bg-amber-50 mb-4"}>
            {status.configured ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <AlertTitle>
              {status.configured ? "API Configured" : "API Not Configured"}
            </AlertTitle>
            <AlertDescription>
              {status.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid w-full gap-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">Google API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Google API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Get your API key from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a>
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="searchEngineId">Search Engine ID</Label>
            <Input
              id="searchEngineId"
              placeholder="Enter your Search Engine ID"
              value={searchEngineId}
              onChange={(e) => setSearchEngineId(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Create a Programmable Search Engine at <a href="https://programmablesearchengine.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Programmable Search Console</a>
            </p>
          </div>
        </div>
        
        {status?.configured && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Test Connection</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="testQuery">Test Query</Label>
                <Input
                  id="testQuery"
                  placeholder="Enter a test query"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleTestConnection}
                disabled={testing}
                variant="outline"
              >
                {testing ? "Testing..." : "Test API Connection"}
              </Button>
              
              {testResults && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50">
                  <h4 className="font-medium mb-2">Test Results</h4>
                  <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSetupSubmit}
          disabled={loading}
        >
          {loading ? "Setting Up..." : "Save API Configuration"}
        </Button>
      </CardFooter>
    </Card>
  );
}