// API utility for consistent URL handling across dev and production
const baseUrl = import.meta.env.VITE_BASE_URL;
const productionApiUrl = 'https://daily-viva-tracker-3p9w.vercel.app';

/**
 * Creates the correct API URL for fetch calls
 * - In development: Uses baseUrl (localhost)
 * - In production: Uses direct backend URL for cross-site requests
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If baseUrl is set (development), use it. Otherwise use production backend URL
  return baseUrl ? `${baseUrl}${cleanEndpoint}` : `${productionApiUrl}${cleanEndpoint}`;
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