'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, RefreshCw, ChevronDown, ChevronRight, Building2, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { DocumentUpload } from '@/components/shire-rates/DocumentUpload';
import { ShireRates, FileUploadProgress, ShireRatesStats } from '@mining-hub/types';

interface HolderGroup {
  holder_name: string;
  rates: ShireRates[];
  totalDocuments: number;
  totalAmount: number;
  unpaidCount: number;
  overdueCount: number;
}

export default function ShireRatesPage() {
  const [shireRates, setShireRates] = useState<ShireRates[]>([]);
  const [holderGroups, setHolderGroups] = useState<HolderGroup[]>([]);
  const [expandedHolders, setExpandedHolders] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<ShireRatesStats | null>(null);
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterHolder, setFilterHolder] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Mock data for development
  useEffect(() => {
    const mockData: ShireRates[] = [
      {
        id: '1',
        documentName: 'City_of_Perth_Rates_2024.pdf',
        documentType: 'pdf',
        documentUrl: '/mock/document1.pdf',
        ocrStatus: 'completed',
        ocrConfidence: 95.2,
        shireName: 'City of Perth',
        propertyAddress: '123 Mining Street, Perth WA 6000',
        assessmentNumber: '12345678',
        propertyOwner: 'GOLDFIELDS MINING PTY LTD',
        landValue: 250000,
        capitalImprovedValue: 450000,
        totalRates: 3360,
        generalRates: 2250,
        waterRates: 450,
        sewerageRates: 380,
        garbageRates: 280,
        dueDate: '2024-11-30',
        paymentStatus: 'unpaid',
        financialYear: '2024-2025',
        clientName: 'Goldfields Mining Pty Ltd',
        tenementId: 'M70/1234',
        propertyReference: 'Camp Site - M70/1234',
        createdAt: '2024-10-15T10:30:00Z',
        updatedAt: '2024-10-15T10:30:00Z',
        notes: 'Annual rates for mining camp accommodation facility',
        tags: ['goldfields', 'perth', 'accommodation'],
        actionId: 'action-1',
      },
      {
        id: '2',
        documentName: 'Shire_of_Coolgardie_Rates_2024.pdf',
        documentType: 'pdf',
        documentUrl: '/mock/document2.pdf',
        ocrStatus: 'completed',
        ocrConfidence: 88.7,
        shireName: 'Shire of Coolgardie',
        propertyAddress: '456 Gold Rush Road, Coolgardie WA 6429',
        assessmentNumber: '87654321',
        propertyOwner: 'GOLDFIELDS MINING PTY LTD',
        landValue: 180000,
        capitalImprovedValue: 320000,
        totalRates: 2840,
        generalRates: 1920,
        waterRates: 380,
        sewerageRates: 340,
        garbageRates: 200,
        dueDate: '2024-12-15',
        paymentStatus: 'paid',
        paymentDate: '2024-11-20',
        financialYear: '2024-2025',
        clientName: 'Goldfields Mining Pty Ltd',
        tenementId: 'E70/5678',
        propertyReference: 'Office Building - E70/5678',
        createdAt: '2024-10-10T14:20:00Z',
        updatedAt: '2024-11-20T09:15:00Z',
        notes: 'Office building rates - paid early for discount',
        tags: ['goldfields', 'coolgardie', 'office'],
        actionId: 'action-2',
      },
      {
        id: '3',
        documentName: 'City_of_Kalgoorlie_Rates_2024.pdf',
        documentType: 'pdf',
        documentUrl: '/mock/document3.pdf',
        ocrStatus: 'completed',
        ocrConfidence: 92.1,
        shireName: 'City of Kalgoorlie-Boulder',
        propertyAddress: '789 Hannan Street, Kalgoorlie WA 6430',
        assessmentNumber: '11223344',
        propertyOwner: 'NORTHERN STAR RESOURCES LTD',
        landValue: 450000,
        capitalImprovedValue: 850000,
        totalRates: 5680,
        generalRates: 4200,
        waterRates: 680,
        sewerageRates: 520,
        garbageRates: 280,
        dueDate: '2024-12-01',
        paymentStatus: 'unpaid',
        financialYear: '2024-2025',
        clientName: 'Northern Star Resources Ltd',
        tenementId: 'M15/1789',
        propertyReference: 'Processing Plant - M15/1789',
        createdAt: '2024-10-12T16:45:00Z',
        updatedAt: '2024-10-12T16:45:00Z',
        notes: 'Processing plant facility rates - due soon',
        tags: ['northern-star', 'kalgoorlie', 'processing'],
        actionId: 'action-3',
      },
    ];

    const mockStats: ShireRatesStats = {
      total: 3,
      byPaymentStatus: { unpaid: 2, paid: 1 },
      byShire: { 'City of Perth': 1, 'Shire of Coolgardie': 1, 'City of Kalgoorlie-Boulder': 1 },
      byFinancialYear: { '2024-2025': 3 },
      totalValue: 11880,
      averageValue: 3960,
      upcomingDue: 2,
      overdue: 0,
    };

    setTimeout(() => {
      setShireRates(mockData);
      setStats(mockStats);
      groupRatesByHolder(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const groupRatesByHolder = (ratesData: ShireRates[]) => {
    const groups = ratesData.reduce((acc, rate) => {
      const holderName = rate.clientName || 'Unknown Holder';
      
      if (!acc[holderName]) {
        acc[holderName] = [];
      }
      acc[holderName].push(rate);
      return acc;
    }, {} as Record<string, ShireRates[]>);

    const holderGroupsData: HolderGroup[] = Object.entries(groups).map(([holder_name, rates]) => {
      const totalAmount = rates.reduce((sum, rate) => sum + (rate.totalRates || 0), 0);
      const unpaidCount = rates.filter(rate => rate.paymentStatus === 'unpaid').length;
      const overdueCount = rates.filter(rate => {
        if (rate.paymentStatus !== 'unpaid' || !rate.dueDate) return false;
        const dueDate = new Date(rate.dueDate);
        return dueDate < new Date();
      }).length;

      return {
        holder_name,
        rates,
        totalDocuments: rates.length,
        totalAmount,
        unpaidCount,
        overdueCount,
      };
    }).sort((a, b) => b.totalDocuments - a.totalDocuments); // Sort by most documents first

    setHolderGroups(holderGroupsData);
    
    // Auto-expand holders with overdue rates
    const holdersWithOverdue = holderGroupsData
      .filter(group => group.overdueCount > 0)
      .map(group => group.holder_name);
    setExpandedHolders(new Set(holdersWithOverdue));
  };

  const handleUpload = async (files: File[]) => {
    const newUploads: FileUploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Simulate upload process
    for (let i = 0; i < newUploads.length; i++) {
      const uploadIndex = uploads.length + i;
      
      // Update to uploading
      setUploads(prev => prev.map((upload, idx) => 
        idx === uploadIndex ? { ...upload, status: 'uploading' } : upload
      ));

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex ? { ...upload, progress } : upload
        ));
      }

      // Update to processing
      setUploads(prev => prev.map((upload, idx) => 
        idx === uploadIndex ? { ...upload, status: 'processing' } : upload
      ));

      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Complete
      const mockResult: ShireRates = {
        id: `mock-${Date.now()}-${i}`,
        documentName: files[i].name,
        documentType: files[i].type.includes('pdf') ? 'pdf' : 'image',
        ocrStatus: 'completed',
        ocrConfidence: 85 + Math.random() * 10,
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUploads(prev => prev.map((upload, idx) => 
        idx === uploadIndex ? { ...upload, status: 'completed', result: mockResult } : upload
      ));

      // Add to main list
      setShireRates(prev => [...prev, mockResult]);
    }
  };

  const handleRemoveUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const filteredRates = shireRates.filter(rate => {
    const matchesSearch = !searchTerm || 
      rate.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.shireName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.tenementId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || rate.paymentStatus === filterStatus;
    const matchesHolder = filterHolder === 'all' || rate.clientName === filterHolder;

    return matchesSearch && matchesStatus && matchesHolder;
  });

  // Get unique holders for filter dropdown
  const uniqueHolders = Array.from(new Set(shireRates.map(rate => rate.clientName).filter(Boolean)));

  const toggleHolderExpansion = (holderName: string) => {
    const newExpanded = new Set(expandedHolders);
    if (newExpanded.has(holderName)) {
      newExpanded.delete(holderName);
    } else {
      newExpanded.add(holderName);
    }
    setExpandedHolders(newExpanded);
  };

  // Filter holder groups based on current filters
  const filteredHolderGroups = holderGroups.map(group => {
    const filteredRates = group.rates.filter(rate => {
      const matchesSearch = !searchTerm || 
        rate.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.shireName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.tenementId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || rate.paymentStatus === filterStatus;

      return matchesSearch && matchesStatus;
    });

    return {
      ...group,
      rates: filteredRates,
      totalDocuments: filteredRates.length,
      totalAmount: filteredRates.reduce((sum, rate) => sum + (rate.totalRates || 0), 0),
      unpaidCount: filteredRates.filter(rate => rate.paymentStatus === 'unpaid').length,
      overdueCount: filteredRates.filter(rate => {
        if (rate.paymentStatus !== 'unpaid' || !rate.dueDate) return false;
        const dueDate = new Date(rate.dueDate);
        return dueDate < new Date();
      }).length,
    };
  }).filter(group => {
    const matchesHolder = filterHolder === 'all' || group.holder_name === filterHolder;
    return matchesHolder && group.rates.length > 0;
  });

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return 'N/A';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-AU');
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      unpaid: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-orange-100 text-orange-800',
      partial: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading shire rates...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shire Rates & Property Compliance</h1>
          <p className="text-gray-600">Manage property rates and compliance obligations for tenement holders</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Due</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.upcomingDue}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search holders, tenements, shires..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterHolder}
                onChange={(e) => setFilterHolder(e.target.value)}
              >
                <option value="all">All Holders</option>
                {uniqueHolders.map(holder => (
                  <option key={holder} value={holder}>{holder}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Documents</span>
            </button>
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Shire Rates Documents</h2>
            <DocumentUpload
              onUpload={handleUpload}
              onRemove={handleRemoveUpload}
              uploads={uploads}
            />
          </div>
        )}

        {/* Holder-Grouped Shire Rates */}
        <div className="space-y-6">
          {filteredHolderGroups.map((group) => (
            <div key={group.holder_name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Holder Header */}
              <div 
                className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 p-6 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-colors"
                onClick={() => toggleHolderExpansion(group.holder_name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {expandedHolders.has(group.holder_name) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <Building2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                        <button 
                          onClick={() => window.open(`/holders/${group.holder_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`, '_blank')}
                          className="text-left"
                        >
                          {group.holder_name}
                        </button>
                      </h3>
                      <p className="text-sm text-gray-600">{group.totalDocuments} shire rates documents</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    {group.overdueCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600">{group.overdueCount} overdue</span>
                      </div>
                    )}
                    {group.unpaidCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-600">{group.unpaidCount} unpaid</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(group.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Shire Rates */}
              {expandedHolders.has(group.holder_name) && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Property / Tenement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shire / Council
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Workflow
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.rates.map((rate) => (
                        <tr key={rate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-2xl mr-3">
                                🏗️
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {rate.propertyReference || rate.documentName}
                                </div>
                                <div className="text-sm text-gray-500 font-mono">
                                  {rate.tenementId || 'No tenement linked'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {rate.propertyAddress}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {rate.shireName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Assessment: {rate.assessmentNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(rate.totalRates)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {rate.financialYear}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(rate.dueDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(rate.paymentStatus)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {rate.actionId ? (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Active Workflow
                                </span>
                                <button 
                                  onClick={() => window.open(`/actions?id=${rate.actionId}`, '_blank')}
                                  className="text-blue-600 hover:text-blue-900 text-xs"
                                >
                                  View →
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No workflow</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-emerald-600 hover:text-emerald-900">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-blue-600 hover:text-blue-900">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {filteredHolderGroups.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterHolder !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first shire rates document to get started'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
