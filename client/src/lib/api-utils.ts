// API utility for consistent URL handling across dev and production
const baseUrl = import.meta.env.VITE_BASE_URL;

/**
 * Creates the correct API URL for fetch calls
 * - In production (Vercel): Uses relative URLs to work with proxy
 * - In development: Uses baseUrl for direct API calls
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If baseUrl is set (development), use it. Otherwise use relative URL (production proxy)
  return baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;
};

/**
 * Fetch wrapper that automatically handles URL construction and credentials
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = getApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return fetch(url, { ...defaultOptions, ...options });
};