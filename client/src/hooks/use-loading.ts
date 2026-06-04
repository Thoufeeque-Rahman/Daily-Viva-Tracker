import { useState } from "react";

export interface LoadingState {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export function useLoading(initialState: boolean = false): LoadingState {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  const withLoading = async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setIsLoading(true);
      return await asyncFn();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}

export function useMultipleLoading(keys: string[]) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const withLoading = async <T,>(key: string, asyncFn: () => Promise<T>): Promise<T> => {
    try {
      setLoading(key, true);
      return await asyncFn();
    } finally {
      setLoading(key, false);
    }
  };

  return {
    loadingStates,
    setLoading,
    withLoading,
    isLoading: (key: string) => loadingStates[key] || false,
  };
}