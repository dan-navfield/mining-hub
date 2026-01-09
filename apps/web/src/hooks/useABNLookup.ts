import { useState, useCallback } from 'react';
import { abnLookupService, ABNLookupResult, ABNLookupError } from '@/lib/services/abn-lookup';

interface UseABNLookupReturn {
  // State
  loading: boolean;
  error: string | null;
  results: ABNLookupResult[];
  selectedResult: ABNLookupResult | null;

  // Actions
  searchByName: (businessName: string) => Promise<void>;
  searchByABN: (abn: string) => Promise<void>;
  validateABN: (abn: string) => boolean;
  selectResult: (result: ABNLookupResult) => void;
  clearResults: () => void;
  clearError: () => void;
}

export function useABNLookup(): UseABNLookupReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ABNLookupResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ABNLookupResult | null>(null);

  const searchByName = useCallback(async (businessName: string) => {
    if (!businessName.trim()) {
      setError('Please enter a business name');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedResult(null);

    try {
      const result = await abnLookupService.searchByName(businessName);
      
      if ('error' in result) {
        setError(result.message);
        setResults([]);
      } else {
        setResults(result);
        if (result.length === 0) {
          setError('No businesses found with that name');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('ABN search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByABN = useCallback(async (abn: string) => {
    if (!abn.trim()) {
      setError('Please enter an ABN');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedResult(null);

    try {
      const result = await abnLookupService.searchByABN(abn);
      
      if ('error' in result) {
        setError(result.message);
        setResults([]);
      } else {
        setResults([result]);
        setSelectedResult(result);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('ABN search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateABN = useCallback((abn: string): boolean => {
    return abnLookupService.validateABN(abn);
  }, []);

  const selectResult = useCallback((result: ABNLookupResult) => {
    setSelectedResult(result);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setSelectedResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    results,
    selectedResult,
    searchByName,
    searchByABN,
    validateABN,
    selectResult,
    clearResults,
    clearError
  };
}
