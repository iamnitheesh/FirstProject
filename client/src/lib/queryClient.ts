import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The amount of time in milliseconds that stale data will be shown
      staleTime: 1000 * 60, // 1 minute
      // The amount of time in milliseconds that unused data will be cached
      gcTime: 1000 * 60 * 5, // 5 minutes
      // If set to true, the query will refetch on window focus
      refetchOnWindowFocus: false,
      // If set to true, the query will refetch when the component or any of its dependencies is mounted
      refetchOnMount: true,
      // Default query function that will be used for all queries
      queryFn: async ({ queryKey }) => {
        const [url, ...params] = queryKey as [string, ...any[]];
        
        // Add query parameters if they exist
        const queryParams = params.length > 0 && typeof params[0] === 'object' 
          ? new URLSearchParams(params[0]).toString() 
          : '';
        
        const urlWithParams = queryParams 
          ? `${url}?${queryParams}` 
          : url;
          
        const response = await fetch(urlWithParams);
        
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        
        return response.json();
      },
    },
  },
});

/**
 * Helper function to make API requests
 * @param url The URL to request
 * @param options The fetch options
 * @returns The response data
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}