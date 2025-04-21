'use client';

import { useState, useEffect } from 'react';
import clientLogger from '@/lib/clientLogger';

type ApiKeys = {
  openai: boolean;
  openrouter: boolean;
  groq: boolean;
};

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: false,
    openrouter: false,
    groq: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/check-api-keys');
        
        if (!response.ok) {
          throw new Error(`Failed to check API keys: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setApiKeys(data.apiKeys);
        clientLogger.info('API keys loaded', { apiKeys: data.apiKeys });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error checking API keys';
        setError(errorMessage);
        clientLogger.error('Error checking API keys', { error: errorMessage });
      } finally {
        setLoading(false);
      }
    };
    
    checkApiKeys();
  }, []);
  
  return { apiKeys, loading, error };
}
