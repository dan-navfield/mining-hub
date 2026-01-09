'use client';

import React, { useState } from 'react';
import { Search, Building2, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useABNLookup } from '@/hooks/useABNLookup';
import { ABNLookupResult } from '@/lib/services/abn-lookup';

interface ABNLookupProps {
  onSelect?: (result: ABNLookupResult) => void;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
}

export function ABNLookup({ 
  onSelect, 
  placeholder = "Search by business name or ABN...",
  className = "",
  showValidation = true 
}: ABNLookupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'abn'>('name');
  
  const {
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
  } = useABNLookup();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    // Auto-detect search type
    const cleanTerm = searchTerm.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const isABN = /^\d{11}$/.test(cleanTerm);

    if (isABN) {
      setSearchType('abn');
      await searchByABN(searchTerm);
    } else {
      setSearchType('name');
      await searchByName(searchTerm);
    }
  };

  const handleSelectResult = (result: ABNLookupResult) => {
    selectResult(result);
    onSelect?.(result);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatABN = (abn: string) => {
    return abn.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  };

  const isValidABN = (abn: string) => {
    return validateABN(abn);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              clearError();
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 pl-12 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-r-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

      {/* ABN Validation (if searching by ABN) */}
      {showValidation && searchTerm && /^\d/.test(searchTerm.replace(/\s+/g, '')) && (
        <div className="flex items-center space-x-2 text-sm">
          {isValidABN(searchTerm) ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-700">Valid ABN format</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700">Invalid ABN format</span>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            {results.length === 1 ? 'Business Details' : `Found ${results.length} businesses`}
          </h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={`${result.abn}-${index}`}
                onClick={() => handleSelectResult(result)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-emerald-300 hover:bg-emerald-50 ${
                  selectedResult?.abn === result.abn 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <h4 className="font-medium text-gray-900">{result.entityName}</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.isValid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.abnStatus}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>ABN:</strong> {formatABN(result.abn)}</p>
                      <p><strong>Entity Type:</strong> {result.entityType}</p>
                      
                      {result.gstStatus && (
                        <p><strong>GST Status:</strong> {result.gstStatus}</p>
                      )}
                      
                      {(result.state || result.postcode) && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {result.state && result.postcode 
                              ? `${result.state} ${result.postcode}`
                              : result.state || result.postcode
                            }
                          </span>
                        </div>
                      )}
                      
                      {result.lastUpdated && (
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date(result.lastUpdated).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {selectedResult?.abn === result.abn && (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Result Summary */}
      {selectedResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h4 className="font-medium text-emerald-900">Selected Business</h4>
          </div>
          <div className="text-sm text-emerald-800">
            <p><strong>{selectedResult.entityName}</strong></p>
            <p>ABN: {formatABN(selectedResult.abn)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
