'use client';

import React, { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';

interface EnhancedTenementViewProps {
  tenementNumber: string;
}

interface EnhancedTenementData {
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

export function EnhancedTenementView({ tenementNumber }: EnhancedTenementViewProps) {
  const [data, setData] = useState<EnhancedTenementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const fetchEnhancedData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenements/enhanced?tenement=${encodeURIComponent(tenementNumber)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const enhancedData = await response.json();
      setData(enhancedData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch enhanced data');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading enhanced tenement data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️ {error}</div>
          <button
            onClick={fetchEnhancedData}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Enhanced Tenement Data
          </h3>
          <p className="text-gray-600 mb-4">
            Load comprehensive data including sites, projects, environmental registrations, and production records.
          </p>
          <button
            onClick={fetchEnhancedData}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Download className="w-5 h-5" />
            <span>Load Enhanced Data</span>
          </button>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ 
    id, 
    title, 
    icon: Icon, 
    count 
  }: { 
    id: string; 
    title: string; 
    icon: React.ElementType; 
    count?: number;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg"
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-emerald-600" />
        <span className="font-semibold text-gray-900">{title}</span>
        {count !== undefined && (
          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
            {count}
          </span>
        )}
      </div>
      {expandedSections.has(id) ? (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Enhanced Tenement Data
            </h2>
            <p className="text-gray-600 mt-1">
              Comprehensive information for {tenementNumber}
            </p>
          </div>
          {data.stored && (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Data Stored</span>
            </div>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <SectionHeader id="basic" title="Basic Information" icon={Building2} />
        
        {expandedSections.has('basic') && (
          <div className="p-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Tenement Number</label>
                <p className="text-lg font-semibold text-gray-900">{data.tenementNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p className="text-lg text-gray-900">{data.tenementType || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  data.status === 'Live' ? 'bg-green-100 text-green-800' :
                  data.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {data.status || 'Unknown'}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Applied Date</label>
                <p className="text-lg text-gray-900">{formatDate(data.appliedDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Granted Date</label>
                <p className="text-lg text-gray-900">{formatDate(data.grantedDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                <p className="text-lg text-gray-900">{formatDate(data.expiryDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Area (ha)</label>
                <p className="text-lg text-gray-900">{formatNumber(data.area)}</p>
              </div>
            </div>

            {data.holders && data.holders.length > 0 && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-500 block mb-3">Holders</label>
                <div className="space-y-2">
                  {data.holders.map((holder, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{holder.holderName}</span>
                      <span className="text-sm text-gray-600">{holder.interest}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sites */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <SectionHeader id="sites" title="Mining Sites" icon={MapPin} count={data.sites?.length || 0} />
        
        {expandedSections.has('sites') && (
          <div className="p-6 border-t border-gray-200">
            {data.sites && data.sites.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Site Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Stage</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Project</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sites.map((site, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{site.siteName}</td>
                        <td className="py-3 px-4 text-gray-600">{site.siteCode}</td>
                        <td className="py-3 px-4 text-gray-600">{site.siteType}</td>
                        <td className="py-3 px-4 text-gray-600">{site.siteStage || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-600">{site.projectName || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sites found</p>
            )}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <SectionHeader id="projects" title="Projects" icon={Factory} count={data.projects?.length || 0} />
        
        {expandedSections.has('projects') && (
          <div className="p-6 border-t border-gray-200">
            {data.projects && data.projects.length > 0 ? (
              <div className="space-y-6">
                {data.projects.map((project, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{project.projectName}</h4>
                      <span className="text-sm text-gray-500">{project.projectCode}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Commodity</label>
                        <p className="text-sm text-gray-900">{project.commodity || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Status</label>
                        <p className="text-sm text-gray-900">{project.projectStatus || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Duration</label>
                        <p className="text-sm text-gray-900">
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </p>
                      </div>
                    </div>

                    {project.owners && project.owners.length > 0 && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-gray-500 block mb-2">Owners</label>
                        <div className="flex flex-wrap gap-2">
                          {project.owners.map((owner, ownerIndex) => (
                            <span key={ownerIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {owner.ownerName} {owner.percentage && `(${owner.percentage}%)`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.events && project.events.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-2">Recent Events</label>
                        <div className="space-y-1">
                          {project.events.slice(0, 3).map((event, eventIndex) => (
                            <div key={eventIndex} className="text-xs text-gray-600">
                              <span className="font-medium">{formatDate(event.eventDate)}</span> - {event.eventType}: {event.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No projects found</p>
            )}
          </div>
        )}
      </div>

      {/* Environmental Registrations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <SectionHeader 
          id="environmental" 
          title="Environmental Registrations" 
          icon={Leaf} 
          count={data.environmentalRegistrations?.length || 0} 
        />
        
        {expandedSections.has('environmental') && (
          <div className="p-6 border-t border-gray-200">
            {data.environmentalRegistrations && data.environmentalRegistrations.length > 0 ? (
              <div className="space-y-4">
                {data.environmentalRegistrations.map((reg, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Registration</label>
                        <p className="text-sm text-gray-900">{reg.registrationName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Category</label>
                        <p className="text-sm text-gray-900">{reg.registrationCategory || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Status</label>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          reg.registrationStatus === 'Active' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reg.registrationStatus || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Date Decided</label>
                        <p className="text-sm text-gray-900">{formatDate(reg.dateDecided)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No environmental registrations found</p>
            )}
          </div>
        )}
      </div>

      {/* Production Records */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <SectionHeader 
          id="production" 
          title="Production Records" 
          icon={BarChart3} 
          count={data.production?.length || 0} 
        />
        
        {expandedSections.has('production') && (
          <div className="p-6 border-t border-gray-200">
            {data.production && data.production.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Unit</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Commodity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.production.map((prod, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-900">
                          {formatDate(prod.startDate)} - {formatDate(prod.endDate)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{prod.product || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-600">{formatNumber(prod.quantity)}</td>
                        <td className="py-3 px-4 text-gray-600">{prod.unit || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-600">{prod.commodity || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No production records found</p>
            )}
          </div>
        )}
      </div>

      {/* Information Sources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <SectionHeader 
          id="sources" 
          title="Information Sources" 
          icon={FileText} 
          count={data.informationSources?.length || 0} 
        />
        
        {expandedSections.has('sources') && (
          <div className="p-6 border-t border-gray-200">
            {data.informationSources && data.informationSources.length > 0 ? (
              <div className="space-y-3">
                {data.informationSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{source.title}</p>
                      <p className="text-sm text-gray-600">{source.type}</p>
                    </div>
                    {source.identifier && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {source.identifier}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No information sources found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
