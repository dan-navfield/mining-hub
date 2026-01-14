'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TenementModal from '@/components/TenementModal';
import { tenementActionsService } from '@/lib/services/tenement-actions.service';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  MapPin
} from 'lucide-react';

interface Tenement {
  id: string;
  jurisdiction: 'WA' | 'NSW' | 'VIC' | 'NT' | 'QLD' | 'TAS';
  number: string;
  type: string;
  status: string;
  holder_name?: string;
  expiry_date?: string;
  area_ha?: number;
  last_sync_at?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const JURISDICTIONS = [
  { code: 'WA', name: 'Western Australia', color: 'bg-red-500' },
  { code: 'NSW', name: 'New South Wales', color: 'bg-blue-500' },
  { code: 'VIC', name: 'Victoria', color: 'bg-purple-500' },
  { code: 'NT', name: 'Northern Territory', color: 'bg-orange-500' },
  { code: 'QLD', name: 'Queensland', color: 'bg-green-500' },
  { code: 'TAS', name: 'Tasmania', color: 'bg-teal-500' },
];

const SORT_OPTIONS = [
  { value: 'number', label: 'Tenement Number' },
  { value: 'type', label: 'Type' },
  { value: 'status', label: 'Status' },
  { value: 'holder_name', label: 'Holder Name' },
  { value: 'area_ha', label: 'Area (Ha)' },
  { value: 'last_sync_at', label: 'Last Updated' },
];

export default function AllTenementsPage() {
  const router = useRouter();
  const [tenements, setTenements] = useState<Tenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(['WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS']);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Sorting
  const [sortBy, setSortBy] = useState('last_sync_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination - Default to 10 results
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // Stats by jurisdiction
  const [jurisdictionStats, setJurisdictionStats] = useState<Record<string, number>>({});
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  
  // Modal state - keeping for potential future use
  const [selectedTenementId, setSelectedTenementId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Actions state
  const [bookmarkedTenements, setBookmarkedTenements] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset pagination only when search actually changes
      if (searchTerm !== debouncedSearchTerm) {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 800); // Increased to 800ms delay for better UX

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    loadTenements();
  }, [pagination.page, pagination.limit, selectedJurisdictions, debouncedSearchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadJurisdictionStats();
    loadFilterOptions();
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    const bookmarks = tenementActionsService.getBookmarks();
    const bookmarkedIds = new Set(bookmarks.map(b => b.tenementId));
    setBookmarkedTenements(bookmarkedIds);
  };

  const loadJurisdictionStats = async () => {
    try {
      const response = await fetch('/api/tenements/stats');
      if (response.ok) {
        const stats = await response.json();
        setJurisdictionStats(stats);
      }
    } catch (error) {
      console.error('Failed to load jurisdiction stats:', error);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/tenements/filters');
      if (response.ok) {
        const { statuses, types } = await response.json();
        setAvailableStatuses(statuses);
        setAvailableTypes(types);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadTenements = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for API
      const apiParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });

      if (selectedJurisdictions.length > 0 && selectedJurisdictions.length < 6) {
        apiParams.append('jurisdiction', selectedJurisdictions.join(','));
      }

      if (debouncedSearchTerm) {
        apiParams.append('search', debouncedSearchTerm);
      }

      if (statusFilter && statusFilter !== 'All') {
        apiParams.append('status', statusFilter);
      }

      if (typeFilter && typeFilter !== 'All') {
        apiParams.append('type', typeFilter);
      }

      // Use Next.js API route
      const response = await fetch(`/api/tenements?${apiParams}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      setTenements(result.data);
      setPagination(result.pagination);

    } catch (err) {
      setError('Failed to load tenements');
      console.error('Error loading tenements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const resetFilters = () => {
    setSelectedJurisdictions(['WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS']);
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setSortBy('last_sync_at');
    setSortOrder('desc');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleJurisdiction = (code: string) => {
    setSelectedJurisdictions(prev => 
      prev.includes(code) 
        ? prev.filter(j => j !== code)
        : [...prev, code]
    );
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const selectAllJurisdictions = () => {
    setSelectedJurisdictions(['WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS']);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearAllJurisdictions = () => {
    setSelectedJurisdictions([]);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'current': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTenementClick = (tenement: Tenement) => {
    // Navigate using jurisdiction and number for clean URLs
    // Clean the tenement number and encode properly
    const cleanNumber = tenement.number.trim().replace(/\s+/g, '-');
    const encodedNumber = encodeURIComponent(cleanNumber);
    router.push(`/tenements/${tenement.jurisdiction}/${encodedNumber}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTenementId(null);
  };

  const handleDirectLink = (tenement: Tenement, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent modal from opening
    // Clean the tenement number and encode properly
    const cleanNumber = tenement.number.trim().replace(/\s+/g, '-');
    const encodedNumber = encodeURIComponent(cleanNumber);
    router.push(`/tenements/${tenement.jurisdiction}/${encodedNumber}`);
  };

  const handleBookmark = async (tenement: Tenement, event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(`bookmark-${tenement.id}`);
    
    try {
      const isCurrentlyBookmarked = bookmarkedTenements.has(tenement.id);
      
      if (isCurrentlyBookmarked) {
        const success = await tenementActionsService.removeBookmark(tenement.id);
        if (success) {
          setBookmarkedTenements(prev => {
            const newSet = new Set(prev);
            newSet.delete(tenement.id);
            return newSet;
          });
        }
      } else {
        const success = await tenementActionsService.bookmarkTenement(
          tenement.id,
          tenement.number,
          tenement.jurisdiction
        );
        if (success) {
          setBookmarkedTenements(prev => new Set(prev).add(tenement.id));
        }
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMapView = async (tenement: Tenement, event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(`map-${tenement.id}`);
    
    try {
      // Create URL parameters for the map view
      const mapParams = new URLSearchParams({
        tenement: tenement.id,
        jurisdictions: tenement.jurisdiction,
        lng: '133.7751', // Will be updated with real coordinates
        lat: '-25.2744',
        zoom: '8'
      });

      // Navigate to map page with tenement highlighted
      router.push(`/map?${mapParams.toString()}`);
      
    } catch (error) {
      console.error('Failed to open map view:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (tenement: Tenement, event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(`download-${tenement.id}`);
    
    try {
      const success = await tenementActionsService.downloadTenementData(
        tenement.id,
        tenement.number,
        tenement.jurisdiction,
        'json'
      );
      if (success) {
        // Show success message
        console.log(`Downloaded data for ${tenement.number}`);
      }
    } catch (error) {
      console.error('Failed to download tenement data:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleShare = async (tenement: Tenement, event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(`share-${tenement.id}`);
    
    try {
      const success = await tenementActionsService.shareTenement(
        tenement.id,
        tenement.number,
        tenement.jurisdiction,
        { type: 'link', includeDetails: true }
      );
      if (success) {
        alert(`Link copied to clipboard for ${tenement.number}!`);
      }
    } catch (error) {
      console.error('Failed to share tenement:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-lg">Loading tenements from all jurisdictions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Australian Mining Tenements 🇦🇺
          </h1>
          <p className="text-gray-600">
            Comprehensive mining tenement data from all Australian jurisdictions
          </p>
        </div>

        {/* Enhanced Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Jurisdiction Filters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Filter by Jurisdiction:</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllJurisdictions}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={clearAllJurisdictions}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {JURISDICTIONS.map(jurisdiction => (
                <button
                  key={jurisdiction.code}
                  onClick={() => toggleJurisdiction(jurisdiction.code)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedJurisdictions.includes(jurisdiction.code)
                      ? `${jurisdiction.color} text-white shadow-md`
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {jurisdiction.code}
                  {jurisdictionStats[jurisdiction.code] > 0 && (
                    <span className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                      {jurisdictionStats[jurisdiction.code].toLocaleString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search
                {searchTerm !== debouncedSearchTerm && searchTerm.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">⏳ Typing...</span>
                )}
                {loading && debouncedSearchTerm && (
                  <span className="ml-2 text-xs text-emerald-600">🔍 Searching...</span>
                )}
              </label>
              <input
                type="text"
                placeholder="Tenement number or holder..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Reset Filters
            </button>
            <div className="text-sm text-gray-500">
              Showing {pagination.total.toLocaleString()} results
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">Error loading tenements</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Tenements Table */}
        {tenements.length > 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Tenement Results
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({pagination.total.toLocaleString()} total)
                    </span>
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">Show:</label>
                      <select
                        value={pagination.limit}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-700">per page</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        onClick={() => handleSort('jurisdiction')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          Jurisdiction
                          {sortBy === 'jurisdiction' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('number')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          Number
                          {sortBy === 'number' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('type')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          Type
                          {sortBy === 'type' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('status')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          Status
                          {sortBy === 'status' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('holder_name')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          Holder
                          {sortBy === 'holder_name' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('area_ha')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          Area (Ha)
                          {sortBy === 'area_ha' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenements.map((tenement) => {
                      const jurisdiction = JURISDICTIONS.find(j => j.code === tenement.jurisdiction);
                      return (
                        <tr 
                          key={tenement.id} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleTenementClick(tenement)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${
                              jurisdiction?.color || 'bg-gray-500'
                            }`}>
                              {tenement.jurisdiction}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {tenement.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tenement.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              getStatusColor(tenement.status)
                            }`}>
                              {tenement.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                            {tenement.holder_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tenement.area_ha ? tenement.area_ha.toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {/* Bookmark */}
                              <button
                                onClick={(e) => handleBookmark(tenement, e)}
                                disabled={actionLoading === `bookmark-${tenement.id}`}
                                className={`transition-colors ${
                                  bookmarkedTenements.has(tenement.id)
                                    ? 'text-yellow-500 hover:text-yellow-600'
                                    : 'text-gray-400 hover:text-yellow-500'
                                } ${actionLoading === `bookmark-${tenement.id}` ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={bookmarkedTenements.has(tenement.id) ? 'Remove bookmark' : 'Bookmark tenement'}
                              >
                                {actionLoading === `bookmark-${tenement.id}` ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill={bookmarkedTenements.has(tenement.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                )}
                              </button>

                              {/* Map View */}
                              <button
                                onClick={(e) => handleMapView(tenement, e)}
                                disabled={actionLoading === `map-${tenement.id}`}
                                className={`text-gray-400 hover:text-blue-500 transition-colors ${
                                  actionLoading === `map-${tenement.id}` ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="View on map"
                              >
                                {actionLoading === `map-${tenement.id}` ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                )}
                              </button>

                              {/* Download/Export */}
                              <button
                                onClick={(e) => handleDownload(tenement, e)}
                                disabled={actionLoading === `download-${tenement.id}`}
                                className={`text-gray-400 hover:text-green-500 transition-colors ${
                                  actionLoading === `download-${tenement.id}` ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Download tenement data"
                              >
                                {actionLoading === `download-${tenement.id}` ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                              </button>

                              {/* Share */}
                              <button
                                onClick={(e) => handleShare(tenement, e)}
                                disabled={actionLoading === `share-${tenement.id}`}
                                className={`text-gray-400 hover:text-purple-500 transition-colors ${
                                  actionLoading === `share-${tenement.id}` ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Share tenement"
                              >
                                {actionLoading === `share-${tenement.id}` ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                  </svg>
                                )}
                              </button>

                              {/* View Full Page */}
                              <button
                                onClick={(e) => handleDirectLink(tenement, e)}
                                className="text-emerald-600 hover:text-emerald-900 transition-colors"
                                title="View full page"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      pagination.totalPages - 4,
                      pagination.page - 2
                    )) + i;
                    
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === pagination.page
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenements found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Tenement Details Modal */}
        <TenementModal
          tenementId={selectedTenementId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}
