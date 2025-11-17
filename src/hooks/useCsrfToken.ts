import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Custom hook to manage CSRF token
 * Automatically fetches and refreshes CSRF token for authenticated users
 */
export function useCsrfToken() {
  const { data: session, status } = useSession();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch CSRF token
  const fetchCsrfToken = async () => {
    if (status !== 'authenticated') {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/csrf-token');

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      setCsrfToken(data.csrfToken);
    } catch (err) {
      console.error('CSRF token fetch error:', err);
      setError('Failed to load security token');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch token when user logs in
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCsrfToken();

      // Refresh token every 30 minutes
      const interval = setInterval(fetchCsrfToken, 30 * 60 * 1000);

      return () => clearInterval(interval);
    } else {
      setCsrfToken(null);
    }
  }, [status]);

  return {
    csrfToken,
    isLoading,
    error,
    refetch: fetchCsrfToken,
  };
}

/**
 * Helper function to add CSRF token to fetch requests
 * Usage:
 *   const { csrfToken } = useCsrfToken();
 *   const response = await fetchWithCsrf('/api/endpoint', {
 *     method: 'POST',
 *     body: JSON.stringify(data),
 *   }, csrfToken);
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {},
  csrfToken: string | null
): Promise<Response> {
  const headers = new Headers(options.headers);

  // Add CSRF token to headers
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  // Add Content-Type if not set and body is present
  if (options.body && !headers.has('Content-Type')) {
    if (typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
