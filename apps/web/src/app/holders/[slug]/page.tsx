'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Building2, MapPin, Calendar, DollarSign, AlertTriangle, TrendingUp, FileText, Receipt, Mountain, Edit3, Save, X, Search, ExternalLink } from 'lucide-react';
import { companyLookupService, type CompanyInfo, type HolderContactInfo } from '@/lib/services/company-lookup.service';
import { ABNLookup } from '@/components/abn-lookup';
import { ABNLookupResult } from '@/lib/services/abn-lookup';

interface HolderData {
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
}

interface Tenement {
  id: string;
  number: string;
  type: string;
  status: string;
  jurisdiction: string;
  area_ha: number;
  expiry_date: string;
  grant_date: string;
}

interface Action {
  id: string;
  tenement_number: string;
  jurisdiction: string;
  action_name: string;
  action_type: string;
  status: string;
  due_date: string;
  amount?: number;
  description?: string;
}

interface ShireRate {
  id: string;
  documentName: string;
  shireName: string;
  propertyAddress: string;
  totalRates: number;
  dueDate: string;
  paymentStatus: string;
  tenementId: string;
}

export default function HolderPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [holderData, setHolderData] = useState<HolderData | null>(null);
  const [tenements, setTenements] = useState<Tenement[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [shireRates, setShireRates] = useState<ShireRate[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'tenements' | 'actions' | 'shire-rates'>('overview');
  const [loading, setLoading] = useState(true);
  
  // Contact info editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContactInfo, setEditedContactInfo] = useState<HolderContactInfo | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    loadHolderData();
  }, [slug]);

  const loadHolderData = async () => {
    setLoading(true);
    
    try {
      // Use the new holders API to get holder info
      const holderResponse = await fetch(`http://localhost:4000/api/holders/${slug}`);
      
      if (!holderResponse.ok) {
        console.error('Holder not found:', holderResponse.status);
        setLoading(false);
        return;
      }

      const holderApiData = await holderResponse.json();
      
      // Get tenements for this specific holder
      const tenementsResponse = await fetch(`http://localhost:4000/api/tenements?search=${encodeURIComponent(holderApiData.name)}&limit=1000`);
      const actionsResponse = await fetch('http://localhost:4000/api/actions');
      
      let holderTenements = [];
      let holderActions = [];

      if (tenementsResponse.ok) {
        const tenementsData = await tenementsResponse.json();
        const allTenements = Array.isArray(tenementsData) ? tenementsData : tenementsData.data || [];
        holderTenements = allTenements.filter((t: any) => t.holder_name === holderApiData.name);
      }

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        const allActions = Array.isArray(actionsData) ? actionsData : actionsData.data || [];
        holderActions = allActions.filter((a: any) => a.tenements?.holder_name === holderApiData.name);
      }

      // Create holder data object
      const holder: HolderData = {
        name: holderApiData.name,
        slug: holderApiData.slug,
        abn: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        totalTenements: holderApiData.totalTenements,
        totalActions: holderApiData.totalActions,
        totalShireRates: 0,
        totalValue: holderApiData.totalValue,
        overdueActions: holderApiData.overdueActions,
        upcomingActions: holderApiData.upcomingActions,
      };

      setHolderData(holder);
      setTenements(holderTenements.map((t: any) => ({
        id: t.id,
        number: t.number,
        type: t.type,
        status: t.status,
        jurisdiction: t.jurisdiction,
        area_ha: t.area_ha,
        expiry_date: t.expiry_date,
        grant_date: t.grant_date,
      })));
      setActions(holderActions.map((a: any) => ({
        id: a.id,
        tenement_number: a.tenement_number,
        jurisdiction: a.jurisdiction,
        action_name: a.action_name,
        action_type: a.action_type,
        status: a.status,
        due_date: a.due_date,
        amount: a.amount,
        description: a.description,
      })));
      loadShireRates(holderApiData.name);
      
      // Try to load existing contact info or lookup company data
      await loadContactInfo(holderApiData.name);
      
    } catch (error) {
      console.error('Error loading holder data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContactInfo = async (holderName: string) => {
    try {
      // First, try to get saved contact info from our database
      const savedContactInfo = await companyLookupService.getHolderContactInfo(holderName);
      
      if (savedContactInfo) {
        // Use saved contact info
        setEditedContactInfo(savedContactInfo);
        if (holderData) {
          setHolderData({
            ...holderData,
            abn: savedContactInfo.abn || '',
            address: savedContactInfo.address || '',
            contactEmail: savedContactInfo.contact_email || '',
            contactPhone: savedContactInfo.contact_phone || '',
          });
        }
      } else {
        // Try to lookup company info from public sources
        const publicCompanyInfo = await companyLookupService.searchCompanyByName(holderName);
        if (publicCompanyInfo) {
          setCompanyInfo(publicCompanyInfo);
          // Initialize editable contact info with public data
          setEditedContactInfo({
            holder_name: holderName,
            abn: publicCompanyInfo.abn || '',
            address: publicCompanyInfo.address ? 
              `${publicCompanyInfo.address.suburb || ''} ${publicCompanyInfo.address.stateCode || ''} ${publicCompanyInfo.address.postcode || ''}`.trim() : '',
            contact_email: '',
            contact_phone: '',
          });
        } else {
          // Initialize empty contact info for manual entry
          setEditedContactInfo({
            holder_name: holderName,
            abn: '',
            address: '',
            contact_email: '',
            contact_phone: '',
          });
        }
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const handleLookupCompany = async () => {
    if (!holderData) return;
    
    setLookupLoading(true);
    try {
      const companyInfo = await companyLookupService.searchCompanyByName(holderData.name);
      if (companyInfo) {
        setCompanyInfo(companyInfo);
        setEditedContactInfo({
          ...editedContactInfo,
          holder_name: holderData.name,
          abn: companyInfo.abn || editedContactInfo?.abn || '',
          address: companyInfo.address ? 
            `${companyInfo.address.suburb || ''} ${companyInfo.address.stateCode || ''} ${companyInfo.address.postcode || ''}`.trim() 
            : editedContactInfo?.address || '',
        });
      }
    } catch (error) {
      console.error('Error looking up company:', error);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleABNSelect = (result: ABNLookupResult) => {
    if (!holderData) return;
    
    // Auto-fill contact info with ABN lookup result
    setEditedContactInfo({
      ...editedContactInfo,
      holder_name: holderData.name,
      abn: result.abn,
      address: result.state && result.postcode ? 
        `${result.state} ${result.postcode}` : 
        editedContactInfo?.address || '',
    });

    // Also set company info for display
    setCompanyInfo({
      entityName: result.entityName,
      abn: result.abn,
      entityType: result.entityType,
      status: result.abnStatus,
      gstStatus: result.gstStatus,
      address: result.state && result.postcode ? {
        stateCode: result.state,
        postcode: result.postcode,
        suburb: ''
      } : undefined
    });
  };

  const handleSaveContactInfo = async () => {
    if (!editedContactInfo || !holderData) return;

    try {
      const success = await companyLookupService.saveHolderContactInfo(editedContactInfo);
      if (success) {
        // Update holder data with new contact info
        setHolderData({
          ...holderData,
          abn: editedContactInfo.abn || '',
          address: editedContactInfo.address || '',
          contactEmail: editedContactInfo.contact_email || '',
          contactPhone: editedContactInfo.contact_phone || '',
        });
        setIsEditing(false);
      } else {
        alert('Failed to save contact information');
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('Error saving contact information');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original data
    if (holderData) {
      setEditedContactInfo({
        holder_name: holderData.name,
        abn: holderData.abn || '',
        address: holderData.address || '',
        contact_email: holderData.contactEmail || '',
        contact_phone: holderData.contactPhone || '',
      });
    }
  };


  const loadShireRates = (holderName: string) => {
    // Mock shire rates data
    const mockShireRates: ShireRate[] = [
      { id: '1', documentName: 'Shire_Rates_2024.pdf', shireName: 'Shire of Coolgardie', propertyAddress: '123 Mine Site Road', totalRates: 4520, dueDate: '2024-11-30', paymentStatus: 'unpaid', tenementId: 'M15/1789' },
    ];
    setShireRates(mockShireRates);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!holderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Holder Not Found</h1>
          <p className="text-gray-600">The requested holder could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{holderData.name}</h1>
              <p className="text-gray-600">Mining Company Profile & Holdings</p>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
              <div className="flex items-center space-x-2">
                {companyInfo && (
                  <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    <ExternalLink className="w-3 h-3" />
                    <span>Public Data Available</span>
                  </div>
                )}
                {!isEditing ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleLookupCompany}
                      disabled={lookupLoading}
                      className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                    >
                      <Search className="w-3 h-3" />
                      <span>{lookupLoading ? 'Looking up...' : 'Lookup Company'}</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveContactInfo}
                      className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">ABN</p>
                  <p className="text-sm text-gray-900">{holderData.abn || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{holderData.address || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{holderData.contactEmail || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{holderData.contactPhone || 'Not available'}</p>
                </div>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ABN</label>
                  <input
                    type="text"
                    value={editedContactInfo?.abn || ''}
                    onChange={(e) => setEditedContactInfo(prev => prev ? {...prev, abn: e.target.value} : null)}
                    placeholder="12 345 678 901"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editedContactInfo?.address || ''}
                    onChange={(e) => setEditedContactInfo(prev => prev ? {...prev, address: e.target.value} : null)}
                    placeholder="Perth WA 6000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editedContactInfo?.contact_email || ''}
                    onChange={(e) => setEditedContactInfo(prev => prev ? {...prev, contact_email: e.target.value} : null)}
                    placeholder="contact@company.com.au"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editedContactInfo?.contact_phone || ''}
                    onChange={(e) => setEditedContactInfo(prev => prev ? {...prev, contact_phone: e.target.value} : null)}
                    placeholder="+61 8 9123 4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">🔍 ABN Lookup</h4>
                <ABNLookup 
                  onSelect={handleABNSelect}
                  placeholder={`Search for "${holderData?.name}" or enter ABN...`}
                  className="max-w-2xl"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Search the Australian Business Register to auto-fill company details
                </p>
              </div>
              </>
            )}

            {companyInfo && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Public Record:</strong> {companyInfo.entityName} • Status: {companyInfo.status} • 
                  {companyInfo.gstStatus && ` GST: ${companyInfo.gstStatus}`}
                </p>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <Mountain className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Tenements</p>
                  <p className="text-2xl font-bold text-gray-900">{holderData.totalTenements}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Actions</p>
                  <p className="text-2xl font-bold text-gray-900">{holderData.totalActions}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <Receipt className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Shire Rates</p>
                  <p className="text-2xl font-bold text-gray-900">{holderData.totalShireRates}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">${holderData.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { key: 'overview', label: 'Overview', icon: TrendingUp },
                  { key: 'tenements', label: 'Tenements', icon: Mountain },
                  { key: 'actions', label: 'Actions', icon: FileText },
                  { key: 'shire-rates', label: 'Shire Rates', icon: Receipt },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Company Overview</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Overdue Actions</span>
                          <span className="font-medium text-red-600">{holderData.overdueActions}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Upcoming Actions</span>
                          <span className="font-medium text-orange-600">{holderData.upcomingActions}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Portfolio Summary</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Active Tenements</span>
                          <span className="font-medium text-gray-900">{holderData.totalTenements}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Area</span>
                          <span className="font-medium text-gray-900">12,230 ha</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tenements' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenement Holdings</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (ha)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tenements.map((tenement) => (
                          <tr key={tenement.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {tenement.number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tenement.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {tenement.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tenement.area_ha.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(tenement.expiry_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Actions</h3>
                  <div className="space-y-4">
                    {actions.map((action) => (
                      <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{action.action_name}</h4>
                            <p className="text-sm text-gray-500">{action.tenement_number} • {action.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {action.amount ? `$${action.amount.toLocaleString()}` : 'No cost'}
                            </p>
                            <p className="text-sm text-gray-500">{new Date(action.due_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'shire-rates' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shire Rates</h3>
                  <div className="space-y-4">
                    {shireRates.map((rate) => (
                      <div key={rate.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{rate.shireName}</h4>
                            <p className="text-sm text-gray-500">{rate.propertyAddress} • {rate.tenementId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">${rate.totalRates.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{new Date(rate.dueDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
