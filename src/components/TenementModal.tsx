'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  application_date?: string;
  grant_date?: string;
  anniversary_date?: string;
}

interface TenementModalProps {
  tenementId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const JURISDICTIONS = [
  { code: 'WA', name: 'Western Australia', color: 'bg-red-500' },
  { code: 'NSW', name: 'New South Wales', color: 'bg-blue-500' },
  { code: 'VIC', name: 'Victoria', color: 'bg-purple-500' },
  { code: 'NT', name: 'Northern Territory', color: 'bg-orange-500' },
  { code: 'QLD', name: 'Queensland', color: 'bg-green-500' },
  { code: 'TAS', name: 'Tasmania', color: 'bg-teal-500' },
];

export default function TenementModal({ tenementId, isOpen, onClose }: TenementModalProps) {
  const router = useRouter();
  const [tenement, setTenement] = useState<Tenement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tenementId) {
      loadTenement();
    }
  }, [isOpen, tenementId]);

  const loadTenement = async () => {
    if (!tenementId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:4000/api/tenements/${tenementId}`);
      if (!response.ok) {
        throw new Error('Failed to load tenement details');
      }
      
      const data = await response.json();
      setTenement(data);
    } catch (err) {
      setError('Failed to load tenement details');
      console.error('Error loading tenement:', err);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const handleViewFullPage = () => {
    if (tenementId) {
      router.push(`/tenements/details/${tenementId}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  const jurisdiction = JURISDICTIONS.find(j => j.code === tenement?.jurisdiction);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">
                Tenement Details
              </h3>
              {tenement && (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${
                  jurisdiction?.color || 'bg-gray-500'
                }`}>
                  {tenement.jurisdiction}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleViewFullPage}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Full Page
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-gray-600">Loading tenement details...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 font-medium">Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          ) : tenement ? (
            <div className="space-y-4">
              {/* Tenement Header */}
              <div className="text-center border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{tenement.number}</h2>
                <div className="flex items-center justify-center space-x-3">
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                    {tenement.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(tenement.status)
                  }`}>
                    {tenement.status}
                  </span>
                </div>
              </div>

              {/* Holder Information - Full Width */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Holder</label>
                <p className="text-sm font-semibold text-gray-900" title={tenement.holder_name || 'Unknown'}>
                  {tenement.holder_name || 'Unknown'}
                </p>
              </div>

              {/* Area Information */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Area</label>
                <p className="text-sm font-semibold text-gray-900">
                  {tenement.area_ha ? `${tenement.area_ha.toLocaleString()} ha` : 'N/A'}
                </p>
              </div>

              {/* Dates Grid - Better Alignment */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {tenement.application_date && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Application Date</label>
                    <p className="text-sm text-gray-900">{formatDate(tenement.application_date)}</p>
                  </div>
                )}
                {tenement.expiry_date && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                    <p className="text-sm text-gray-900">{formatDate(tenement.expiry_date)}</p>
                  </div>
                )}
                {tenement.grant_date && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Grant Date</label>
                    <p className="text-sm text-gray-900">{formatDate(tenement.grant_date)}</p>
                  </div>
                )}
                {tenement.anniversary_date && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Anniversary Date</label>
                    <p className="text-sm text-gray-900">{formatDate(tenement.anniversary_date)}</p>
                  </div>
                )}
              </div>

              {/* Last Updated */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {formatDate(tenement.last_sync_at)}
                </p>
              </div>
            </div>
          ) : null}

          {/* Footer */}
          <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
