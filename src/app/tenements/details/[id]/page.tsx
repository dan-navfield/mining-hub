'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  FileText, 
  Users, 
  Factory, 
  Leaf, 
  BarChart3,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Download,
  Zap,
  Globe,
  TrendingUp
} from 'lucide-react';

// Simple Badge component since we removed the UI library import
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

// Simple Button component
const Button = ({ children, onClick, className }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
}) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${className}`}
  >
    {children}
  </button>
);

interface Tenement {
  id: string;
  jurisdiction: string;
  number: string;
  type: string;
  status: string;
  holder_name?: string;
  expiry_date?: string;
  area_ha?: number;
  last_sync_at?: string;
  // Additional fields that might be present
  [key: string]: any;
}

interface TenementData {
  tenementNumber: string;
  tenementType?: string;
  status?: string;
  appliedDate?: string;
  grantedDate?: string;
  expiryDate?: string;
  area?: number;
  holders?: Array<{
    holderName: string;
    interest: string;
  }>;
  sites: Array<{
    siteName: string;
    siteCode: string;
    siteType: string;
    siteSubtype?: string;
    siteStage?: string;
    projectName?: string;
    projectCode?: string;
  }>;
  projects: Array<{
    projectName: string;
    projectCode: string;
    commodity?: string;
    startDate?: string;
    endDate?: string;
    projectStatus?: string;
    owners?: Array<{
      ownerName: string;
      percentage?: number;
    }>;
    events?: Array<{
      eventDate: string;
      eventType: string;
      description: string;
    }>;
  }>;
  environmentalRegistrations: Array<{
    registrationName?: string;
    registrationCategory?: string;
    registrationStatus?: string;
    dateDecided?: string;
  }>;
  production: Array<{
    startDate?: string;
    endDate?: string;
    product?: string;
    quantity?: number;
    unit?: string;
    commodity?: string;
  }>;
  informationSources: Array<{
    type: string;
    title: string;
    identifier?: string;
  }>;
  stored?: boolean;
}

interface Client {
  id: string;
  company_name: string;
  abn?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  industry_sector?: string;
  client_status: string;
  assigned_consultant_id?: string;
  service_types?: string[];
  notes?: string;
}

interface ClientTenementRelationship {
  id: string;
  client_id: string;
  tenement_id: string;
  relationship_type: string;
  ownership_percentage?: number;
  is_active: boolean;
  client: Client;
}

export default function TenementDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [tenement, setTenement] = useState<Tenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Client relationship state
  const [clientRelationships, setClientRelationships] = useState<ClientTenementRelationship[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  
  // Additional tenement data state
  const [additionalData, setAdditionalData] = useState<TenementData | null>(null);
  const [additionalLoading, setAdditionalLoading] = useState(false);
  const [additionalError, setAdditionalError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'holders']));
  const [showCreateAction, setShowCreateAction] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadTenement(params.id as string);
    }
  }, [params.id]);

  // Auto-load additional data when tenement loads
  useEffect(() => {
    if (tenement && !additionalData && !additionalLoading) {
      fetchAdditionalData();
    }
  }, [tenement]);

  const loadTenement = async (tenementId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading tenement details for ID:', tenementId);
      
      // Use Next.js API route
      const response = await fetch(`/api/tenements/${tenementId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(`Tenement with ID "${tenementId}" not found.`);
        } else {
          throw new Error(`API error: ${response.status}`);
        }
        return;
      }
      
      const tenementData = await response.json();
      setTenement(tenementData);
      console.log('✅ Loaded tenement:', tenementData.number, 'from', tenementData.jurisdiction);
      
      // Load client relationships
      loadClientRelationships(tenementId);
      
    } catch (err) {
      console.error('❌ Error loading tenement:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenement');
    } finally {
      setLoading(false);
    }
  };

  const loadClientRelationships = async (tenementId: string) => {
    try {
      setClientLoading(true);
      // For now, we'll create a mock API call - this would need to be implemented in the backend
      const response = await fetch(`http://localhost:4000/api/tenements/${tenementId}/clients`);
      
      if (response.ok) {
        const relationships = await response.json();
        setClientRelationships(relationships);
      } else {
        // If endpoint doesn't exist yet, check if this tenement matches any client patterns
        checkClientMatches(tenementId);
      }
    } catch (err) {
      console.log('Client relationships API not available yet, checking patterns...');
      checkClientMatches(tenementId);
    } finally {
      setClientLoading(false);
    }
  };

  const checkClientMatches = async (tenementId: string) => {
    // This would check if the holder name matches any client patterns
    // For now, we'll do a simple check for "RADIANT EXPLORATION"
    if (tenement?.holder_name?.includes('RADIANT EXPLORATION')) {
      setClientRelationships([{
        id: 'mock-1',
        client_id: 'client-1',
        tenement_id: tenementId,
        relationship_type: 'Holder',
        is_active: true,
        client: {
          id: 'client-1',
          company_name: 'Radiant Exploration Pty Ltd',
          abn: '12345678901',
          primary_contact_name: 'Sarah Mitchell',
          primary_contact_email: 'sarah.mitchell@radiantexploration.com.au',
          primary_contact_phone: '+61 8 9123 4567',
          industry_sector: 'Gold Exploration',
          client_status: 'Active',
          service_types: ['Compliance', 'Reporting', 'Tenement Management'],
          notes: 'New exploration company focused on WA goldfields. High growth potential.'
        }
      }]);
    }
  };

  const createActionForClient = async (clientId: string, actionType: string) => {
    try {
      const actionData = {
        client_id: clientId,
        tenement_id: tenement?.id,
        action_type: actionType,
        status: 'pending',
        amount: actionType === 'Rent Payment' ? 2500 : 0
      };

      console.log('Creating action:', actionData);
      // This would call the actions API
      alert(`Action "${actionType}" created for ${tenement?.number}!`);
    } catch (err) {
      console.error('Error creating action:', err);
      alert('Failed to create action');
    }
  };

  // Additional data functions
  const fetchAdditionalData = async () => {
    if (!tenement) return;
    
    setAdditionalLoading(true);
    setAdditionalError(null);

    try {
      const response = await fetch(`/api/tenements/enhanced?tenement=${encodeURIComponent(tenement.number)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch additional data: ${response.status}`);
      }

      const data = await response.json();
      setAdditionalData(data);

    } catch (err) {
      setAdditionalError(err instanceof Error ? err.message : 'Failed to fetch additional data');
    } finally {
      setAdditionalLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU');
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Live': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Granted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ML': return 'bg-purple-100 text-purple-800';
      case 'EL': return 'bg-emerald-100 text-emerald-800';
      case 'PL': return 'bg-blue-100 text-blue-800';
      case 'CML': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tenement details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tenement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tenement Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/tenements')}>
              ← Back to Tenements
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              Dashboard
            </button>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => router.push('/tenements')}
              className="text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              Tenements
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{tenement.number}</span>
          </div>
        </nav>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-4xl font-bold">{tenement.number}</h1>
                <div className="px-3 py-1 bg-white/20 rounded-lg text-sm font-medium">
                  {tenement.jurisdiction}
                </div>
                <Badge className={getTypeColor(tenement.type) + ' text-lg px-4 py-2'}>
                  {tenement.type}
                </Badge>
                <Badge className={getStatusColor(tenement.status) + ' text-lg px-4 py-2'}>
                  {tenement.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-emerald-100">
                <div>
                  <p className="text-sm opacity-80">Holder</p>
                  <p className="text-lg font-semibold">{tenement.holder_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Area</p>
                  <p className="text-lg font-semibold">{tenement.area_ha ? `${tenement.area_ha.toLocaleString()} ha` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Last Updated</p>
                  <p className="text-lg font-semibold">{tenement.last_sync_at ? new Date(tenement.last_sync_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => router.push('/tenements')}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              ← Back to List
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Core Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Identification Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">🆔</span>
                Identification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tenement Number</label>
                    <p className="text-lg font-semibold text-gray-900">{tenement.number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-lg font-semibold text-gray-900">{tenement.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-lg font-semibold text-gray-900">{tenement.status}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Jurisdiction</label>
                    <p className="text-lg font-semibold text-gray-900">{tenement.jurisdiction}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Area (Ha)</label>
                    <p className="text-lg font-semibold text-gray-900">{tenement.area_ha ? tenement.area_ha.toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                    <p className="text-lg font-semibold text-gray-900">{tenement.expiry_date ? new Date(tenement.expiry_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Holder Information Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="w-6 h-6 text-emerald-600 mr-3" />
                Holder Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Primary Holder</label>
                  <p className="text-lg font-semibold text-gray-900">{tenement.holder_name || 'N/A'}</p>
                </div>

                {/* Additional holder data */}
                {additionalData?.holders && additionalData.holders.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-3">All Registered Holders</label>
                    <div className="space-y-3">
                      {additionalData.holders.map((holder, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div>
                            <p className="font-medium text-gray-900">{holder.holderName}</p>
                            <p className="text-sm text-gray-600">Interest: {holder.interest}</p>
                          </div>
                          <div className="text-right">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-medium">
                              Registered Holder
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {additionalLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading holder information...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Client Relationship Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">🤝</span>
                Client Relationship
              </h2>
              
              {clientLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Checking client relationships...</p>
                </div>
              ) : clientRelationships.length > 0 ? (
                <div className="space-y-6">
                  {clientRelationships.map((relationship) => (
                    <div key={relationship.id} className="border border-emerald-200 rounded-lg p-6 bg-emerald-50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                            🏢 {relationship.client.company_name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-emerald-700">
                            <span className="bg-emerald-200 px-2 py-1 rounded-full font-medium">
                              {relationship.relationship_type}
                            </span>
                            <span className="bg-green-200 px-2 py-1 rounded-full font-medium">
                              {relationship.client.client_status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-emerald-600 font-medium">Hetherington Client</p>
                          <p className="text-xs text-emerald-500">Active Relationship</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-xs font-medium text-emerald-600">Primary Contact</label>
                          <p className="text-sm font-semibold text-gray-900">{relationship.client.primary_contact_name}</p>
                          <p className="text-xs text-gray-600">{relationship.client.primary_contact_email}</p>
                          <p className="text-xs text-gray-600">{relationship.client.primary_contact_phone}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-emerald-600">Industry & Services</label>
                          <p className="text-sm font-semibold text-gray-900">{relationship.client.industry_sector}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {relationship.client.service_types?.map((service, idx) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {relationship.client.notes && (
                        <div className="mb-4">
                          <label className="text-xs font-medium text-emerald-600">Notes</label>
                          <p className="text-sm text-gray-700 bg-white p-3 rounded border">{relationship.client.notes}</p>
                        </div>
                      )}

                      <div className="border-t border-emerald-200 pt-4">
                        <h4 className="text-sm font-semibold text-emerald-900 mb-3">Quick Actions for Client</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <button
                            onClick={() => createActionForClient(relationship.client_id, 'Rent Payment')}
                            className="px-3 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            💰 Rent Payment
                          </button>
                          <button
                            onClick={() => createActionForClient(relationship.client_id, 'Compliance Report')}
                            className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            📋 Compliance
                          </button>
                          <button
                            onClick={() => createActionForClient(relationship.client_id, 'Renewal Notice')}
                            className="px-3 py-2 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            🔄 Renewal
                          </button>
                          <button
                            onClick={() => createActionForClient(relationship.client_id, 'Environmental Review')}
                            className="px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            🌱 Environment
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Client Relationship Found</h3>
                  <p className="text-gray-600 mb-4">
                    This tenement holder "{tenement.holder_name}" is not currently a Hetherington client.
                  </p>
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    + Add as Client
                  </button>
                </div>
              )}
            </div>

            {/* Mining Sites & Operations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-6 h-6 text-emerald-600 mr-3" />
                Mining Sites & Operations
              </h2>
              
              {additionalData?.sites && additionalData.sites.length > 0 ? (
                <div className="grid gap-4">
                  {additionalData.sites.map((site, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{site.siteName}</h4>
                          <p className="text-sm text-gray-600">{site.siteCode}</p>
                        </div>
                        <div className="text-right">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {site.siteType}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {site.siteSubtype && (
                          <div>
                            <span className="text-gray-500">Subtype:</span>
                            <span className="ml-2 text-gray-900">{site.siteSubtype}</span>
                          </div>
                        )}
                        {site.siteStage && (
                          <div>
                            <span className="text-gray-500">Stage:</span>
                            <span className="ml-2 text-gray-900">{site.siteStage}</span>
                          </div>
                        )}
                        {site.projectName && (
                          <div>
                            <span className="text-gray-500">Project:</span>
                            <span className="ml-2 text-gray-900">{site.projectName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : additionalLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading sites information...</p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No mining sites information available</p>
                </div>
              )}
            </div>

            {/* Projects & Development */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Factory className="w-6 h-6 text-emerald-600 mr-3" />
                Projects & Development
              </h2>
              
              {additionalData?.projects && additionalData.projects.length > 0 ? (
                <div className="space-y-6">
                  {additionalData.projects.map((project, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{project.projectName}</h4>
                          <p className="text-sm text-gray-600">{project.projectCode}</p>
                        </div>
                        <div className="text-right">
                          {project.projectStatus && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              {project.projectStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {project.commodity && (
                          <div>
                            <span className="text-sm text-gray-500">Commodity:</span>
                            <span className="ml-2 text-sm font-medium text-gray-900">{project.commodity}</span>
                          </div>
                        )}
                        {project.startDate && (
                          <div>
                            <span className="text-sm text-gray-500">Start Date:</span>
                            <span className="ml-2 text-sm text-gray-900">{formatDate(project.startDate)}</span>
                          </div>
                        )}
                        {project.endDate && (
                          <div>
                            <span className="text-sm text-gray-500">End Date:</span>
                            <span className="ml-2 text-sm text-gray-900">{formatDate(project.endDate)}</span>
                          </div>
                        )}
                      </div>

                      {project.owners && project.owners.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Project Owners:</h5>
                          <div className="space-y-1">
                            {project.owners.map((owner, ownerIndex) => (
                              <div key={ownerIndex} className="flex justify-between text-sm">
                                <span className="text-gray-900">{owner.ownerName}</span>
                                {owner.percentage && (
                                  <span className="text-gray-600">{owner.percentage}%</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : additionalLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading projects...</p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Factory className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No project information available</p>
                </div>
              )}
            </div>

            {/* Environmental & Compliance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Leaf className="w-6 h-6 text-emerald-600 mr-3" />
                Environmental & Compliance
              </h2>
              
              {additionalData?.environmentalRegistrations && additionalData.environmentalRegistrations.length > 0 ? (
                <div className="grid gap-4">
                  {additionalData.environmentalRegistrations.map((reg, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{reg.registrationName || 'Environmental Registration'}</h4>
                        {reg.registrationStatus && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            reg.registrationStatus === 'Active' ? 'bg-green-100 text-green-800' :
                            reg.registrationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {reg.registrationStatus}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {reg.registrationCategory && (
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-2 text-gray-900">{reg.registrationCategory}</span>
                          </div>
                        )}
                        {reg.dateDecided && (
                          <div>
                            <span className="text-gray-500">Date Decided:</span>
                            <span className="ml-2 text-gray-900">{formatDate(reg.dateDecided)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : additionalLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading environmental data...</p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Leaf className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No environmental registrations available</p>
                </div>
              )}
            </div>

            {/* Production & Performance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 mr-3" />
                Production & Performance
              </h2>
              
              {additionalData?.production && additionalData.production.length > 0 ? (
                <div className="grid gap-4">
                  {additionalData.production.map((prod, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {prod.commodity && (
                          <div>
                            <span className="text-gray-500">Commodity:</span>
                            <p className="font-medium text-gray-900">{prod.commodity}</p>
                          </div>
                        )}
                        {prod.product && (
                          <div>
                            <span className="text-gray-500">Product:</span>
                            <p className="font-medium text-gray-900">{prod.product}</p>
                          </div>
                        )}
                        {prod.quantity && (
                          <div>
                            <span className="text-gray-500">Quantity:</span>
                            <p className="font-medium text-gray-900">{formatNumber(prod.quantity)} {prod.unit || ''}</p>
                          </div>
                        )}
                        {prod.startDate && (
                          <div>
                            <span className="text-gray-500">Period:</span>
                            <p className="font-medium text-gray-900">
                              {formatDate(prod.startDate)} - {formatDate(prod.endDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : additionalLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading production data...</p>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No production records available</p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 text-emerald-600 mr-3" />
                Additional Information
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Sync</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {tenement.last_sync_at ? new Date(tenement.last_sync_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  {additionalData?.appliedDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Applied Date</label>
                      <p className="text-lg font-semibold text-gray-900">{formatDate(additionalData.appliedDate)}</p>
                    </div>
                  )}
                  {additionalData?.grantedDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Granted Date</label>
                      <p className="text-lg font-semibold text-gray-900">{formatDate(additionalData.grantedDate)}</p>
                    </div>
                  )}
                </div>

                {/* Information Sources */}
                {additionalData?.informationSources && additionalData.informationSources.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-3">Information Sources</label>
                    <div className="grid gap-3">
                      {additionalData.informationSources.map((source, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{source.title}</p>
                            <p className="text-sm text-gray-600">{source.type}</p>
                          </div>
                          {source.identifier && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{source.identifier}</span>
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <span className="mr-3">📋</span>
                    <span className="font-medium">Create Action</span>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <span className="mr-3">🗺️</span>
                    <span className="font-medium">View on Map</span>
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <span className="mr-3">📄</span>
                    <span className="font-medium">Generate Report</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold">{tenement.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-semibold">{tenement.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jurisdiction</span>
                  <span className="font-semibold">{tenement.jurisdiction}</span>
                </div>
                {tenement.area_ha && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area</span>
                    <span className="font-semibold">{tenement.area_ha.toLocaleString()} ha</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
