'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Search, MapPin, Phone, Mail, TrendingUp, AlertTriangle, Calendar, DollarSign, Filter, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Holder {
  name: string;
  slug: string;
  abn?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  totalTenements: number;
  totalActions: number;
  totalShireRates: number;
  totalValue: number;
  overdueActions: number;
  upcomingActions: number;
  jurisdiction: string[];
  primaryCommodity: string;
}

export default function HoldersPage() {
  const router = useRouter();
  const [holders, setHolders] = useState<Holder[]>([]);
  const [filteredHolders, setFilteredHolders] = useState<Holder[]>([]);
  const [paginatedHolders, setPaginatedHolders] = useState<Holder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'actions' | 'value' | 'tenements'>('name');
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'big-card'>('list');
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filter state
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [tenementRange, setTenementRange] = useState<[number, number]>([0, 1000]);
  const [valueRange, setValueRange] = useState<[number, number]>([0, 1000000]);
  const [hasOverdueActions, setHasOverdueActions] = useState<boolean | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showOurClientsOnly, setShowOurClientsOnly] = useState(false);
  
  // API pagination state
  const [totalHolders, setTotalHolders] = useState(0);
  const [apiPagination, setApiPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    loadHolders();
  }, [currentPage, itemsPerPage, searchTerm, sortBy, selectedJurisdictions, tenementRange]);

  // Simplified filtering for client-side filters not handled by API
  useEffect(() => {
    filterAndSortHolders();
  }, [holders, valueRange, hasOverdueActions, showOurClientsOnly]);

  useEffect(() => {
    paginateHolders();
  }, [filteredHolders]);

  const loadHolders = async () => {
    try {
      // Build query parameters for the new holders API
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy === 'name' ? 'name' : 'totalTenements',
        sortOrder: sortBy === 'name' ? 'asc' : 'desc',
      });

      // Add search filter
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Add jurisdiction filter
      if (selectedJurisdictions.length === 1) {
        params.append('jurisdiction', selectedJurisdictions[0]);
      }

      // Add tenement range filters
      if (tenementRange[0] > 0) {
        params.append('minTenements', tenementRange[0].toString());
      }
      if (tenementRange[1] < 1000) {
        params.append('maxTenements', tenementRange[1].toString());
      }

      // Fetch from the new holders API
      const response = await fetch(`http://localhost:4000/api/holders?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform API data to match our interface
      const transformedHolders: Holder[] = result.data.map((holder: any) => ({
        name: holder.name,
        slug: holder.slug,
        abn: '', // Will be populated from contact info API
        address: '',
        contactEmail: '',
        contactPhone: '',
        totalTenements: holder.totalTenements,
        totalActions: holder.totalActions,
        totalShireRates: 0,
        totalValue: holder.totalValue,
        overdueActions: holder.overdueActions,
        upcomingActions: holder.upcomingActions,
        jurisdiction: holder.jurisdictions,
        primaryCommodity: holder.primaryCommodity,
      }));

      setHolders(transformedHolders);
      setPaginatedHolders(transformedHolders); // API handles pagination
      setFilteredHolders(transformedHolders); // Set filtered holders for stats display
      
      // Update pagination state with API response
      if (result.pagination) {
        setTotalHolders(result.pagination.total);
        setApiPagination({
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
          hasNext: result.pagination.hasNext,
          hasPrev: result.pagination.hasPrev
        });
        console.log(`Loaded page ${result.pagination.page} of ${result.pagination.totalPages} (${result.pagination.total} total holders)`);
      }
      
    } catch (error) {
      console.error('Error loading holders:', error);
      setHolders([]);
      setPaginatedHolders([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortHolders = () => {
    // Only apply client-side filters that aren't handled by the API
    let filtered = holders.filter(holder => {
      // Value filter (not handled by API yet)
      const matchesValueRange = holder.totalValue >= valueRange[0] && 
        holder.totalValue <= valueRange[1];

      // Overdue actions filter (not handled by API yet)
      const matchesOverdueFilter = hasOverdueActions === null || 
        (hasOverdueActions === true && holder.overdueActions > 0) ||
        (hasOverdueActions === false && holder.overdueActions === 0);

      // Our Clients filter (placeholder logic - can be enhanced later)
      const matchesOurClients = !showOurClientsOnly || 
        holder.name.toLowerCase().includes('radiant') || 
        holder.name.toLowerCase().includes('central pilbara') ||
        holder.name.toLowerCase().includes('cameco') ||
        holder.name.toLowerCase().includes('quaternary');

      return matchesValueRange && matchesOverdueFilter && matchesOurClients;
    });

    setFilteredHolders(filtered);
  };

  const paginateHolders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedHolders(filteredHolders.slice(startIndex, endIndex));
  };

  const totalPages = Math.ceil(filteredHolders.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedJurisdictions([]);
    setTenementRange([0, 1000]);
    setValueRange([0, 1000000]);
    setHasOverdueActions(null);
    setShowOurClientsOnly(false);
    setCurrentPage(1);
  };

  const getCommodityColor = (commodity: string) => {
    switch (commodity.toLowerCase()) {
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'iron ore': return 'bg-red-100 text-red-800';
      case 'copper': return 'bg-orange-100 text-orange-800';
      case 'lithium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenement Holders</h1>
          <p className="text-gray-600">Manage mining companies and their compliance portfolios</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search holders, ABN, commodity, or jurisdiction..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Our Clients Filter */}
              <button
                onClick={() => setShowOurClientsOnly(!showOurClientsOnly)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                  showOurClientsOnly 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">Our Clients</span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">View:</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'card'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => setViewMode('big-card')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'big-card'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Big Card
                  </button>
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="name">Company Name</option>
                  <option value="actions">Most Actions</option>
                  <option value="value">Highest Value</option>
                  <option value="tenements">Most Tenements</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Jurisdiction Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdictions</label>
                <div className="space-y-2">
                  {['WA', 'NSW', 'VIC', 'NT', 'QLD', 'TAS'].map((jurisdiction) => (
                    <label key={jurisdiction} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedJurisdictions.includes(jurisdiction)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJurisdictions([...selectedJurisdictions, jurisdiction]);
                          } else {
                            setSelectedJurisdictions(selectedJurisdictions.filter(j => j !== jurisdiction));
                          }
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{jurisdiction}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tenement Count Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenement Count: {tenementRange[0]} - {tenementRange[1]}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={tenementRange[0]}
                    onChange={(e) => setTenementRange([parseInt(e.target.value), tenementRange[1]])}
                    className="w-full"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={tenementRange[1]}
                    onChange={(e) => setTenementRange([tenementRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>1000+</span>
                  </div>
                </div>
              </div>

              {/* Value Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Value: ${valueRange[0].toLocaleString()} - ${valueRange[1].toLocaleString()}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={valueRange[0]}
                    onChange={(e) => setValueRange([parseInt(e.target.value), valueRange[1]])}
                    className="w-full"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={valueRange[1]}
                    onChange={(e) => setValueRange([valueRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>$0</span>
                    <span>$1M+</span>
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Status</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="overdueFilter"
                      checked={hasOverdueActions === null}
                      onChange={() => setHasOverdueActions(null)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">All Companies</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="overdueFilter"
                      checked={hasOverdueActions === true}
                      onChange={() => setHasOverdueActions(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has Overdue Actions</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="overdueFilter"
                      checked={hasOverdueActions === false}
                      onChange={() => setHasOverdueActions(false)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">No Overdue Actions</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {filteredHolders.length} of {holders.length} companies
                </span>
                <div className="flex items-center space-x-4">
                  <span>Items per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Holders</p>
                <p className="text-2xl font-bold text-gray-900">{totalHolders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredHolders.reduce((sum, h) => sum + h.totalActions, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredHolders.reduce((sum, h) => sum + h.overdueActions, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-emerald-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${filteredHolders.reduce((sum, h) => sum + h.totalValue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Holders Display - Conditional based on viewMode */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Company</div>
                <div className="col-span-2 text-center">Tenements</div>
                <div className="col-span-2 text-center">Actions</div>
                <div className="col-span-2 text-center">Value</div>
                <div className="col-span-2 text-center">Jurisdictions</div>
              </div>
            </div>
            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {paginatedHolders.map((holder) => (
                <div
                  key={holder.slug}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/holders/${holder.slug}`)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{holder.name}</p>
                        <p className="text-xs text-gray-500">Mining Company</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-sm font-semibold text-gray-900">{holder.totalTenements}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-sm font-semibold text-gray-900">{holder.totalActions}</p>
                      {holder.overdueActions > 0 && (
                        <p className="text-xs text-red-600">{holder.overdueActions} overdue</p>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-sm font-semibold text-gray-900">${holder.totalValue.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {holder.jurisdiction.slice(0, 2).map((j) => (
                          <span key={j} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {j}
                          </span>
                        ))}
                        {holder.jurisdiction.length > 2 && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                            +{holder.jurisdiction.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedHolders.map((holder) => (
              <div
                key={holder.slug}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-emerald-300"
                onClick={() => router.push(`/holders/${holder.slug}`)}
              >
                {/* Header */}
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate" title={holder.name}>
                      {holder.name}
                    </h3>
                    <p className="text-xs text-gray-500">Mining</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-900">{holder.totalTenements}</p>
                    <p className="text-xs text-gray-500">Tenements</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-900">{holder.totalActions}</p>
                    <p className="text-xs text-gray-500">Actions</p>
                  </div>
                </div>

                {/* Value */}
                <div className="text-center mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    ${holder.totalValue.toLocaleString()}
                  </p>
                </div>

                {/* Jurisdiction Tags */}
                <div className="flex flex-wrap gap-1">
                  {holder.jurisdiction.slice(0, 3).map((j) => (
                    <span key={j} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {j}
                    </span>
                  ))}
                  {holder.jurisdiction.length > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      +{holder.jurisdiction.length - 3}
                    </span>
                  )}
                </div>

                {/* Status Indicators */}
                {(holder.overdueActions > 0 || holder.upcomingActions > 0) && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-xs">
                      {holder.overdueActions > 0 && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{holder.overdueActions}</span>
                        </div>
                      )}
                      {holder.upcomingActions > 0 && (
                        <div className="flex items-center space-x-1 text-orange-600">
                          <Calendar className="w-3 h-3" />
                          <span>{holder.upcomingActions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {viewMode === 'big-card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedHolders.map((holder) => (
              <div
                key={holder.slug}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-emerald-300"
                onClick={() => router.push(`/holders/${holder.slug}`)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base" title={holder.name}>
                        {holder.name.length > 25 ? holder.name.substring(0, 25) + '...' : holder.name}
                      </h3>
                      <p className="text-sm text-gray-500">Mining Company</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-900">{holder.totalTenements}</p>
                    <p className="text-sm text-blue-700">Tenements</p>
                  </div>
                  <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-900">{holder.totalActions}</p>
                    <p className="text-sm text-green-700">Actions</p>
                  </div>
                </div>

                {/* Value */}
                <div className="text-center mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                  <p className="text-lg font-bold text-emerald-900">
                    ${holder.totalValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-emerald-700">Total Value</p>
                </div>

                {/* Jurisdiction Tags */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Jurisdictions:</p>
                  <div className="flex flex-wrap gap-2">
                    {holder.jurisdiction.map((j) => (
                      <span key={j} className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                        {j}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Indicators */}
                {(holder.overdueActions > 0 || holder.upcomingActions > 0) && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      {holder.overdueActions > 0 && (
                        <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">{holder.overdueActions} Overdue</span>
                        </div>
                      )}
                      {holder.upcomingActions > 0 && (
                        <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">{holder.upcomingActions} Upcoming</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalHolders > 0 && apiPagination.totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalHolders)} of {totalHolders} results
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!apiPagination.hasPrev}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    !apiPagination.hasPrev
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, apiPagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (apiPagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= apiPagination.totalPages - 2) {
                      pageNum = apiPagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(Math.min(apiPagination.totalPages, currentPage + 1))}
                  disabled={!apiPagination.hasNext}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    !apiPagination.hasNext
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredHolders.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No holders found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No holders have been added yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
