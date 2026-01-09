'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Factory, 
  Gem, 
  Calendar,
  ExternalLink,
  Building,
  Activity,
  Users,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';

interface Project {
  project_code: string;
  project_name: string;
  commodity: string;
  project_status: string;
  associated_sites: string;
  commodities_list: string;
  created_at: string;
  updated_at: string;
}

interface ProjectSite {
  site_code: string;
  site_name: string;
  short_name?: string;
  site_type: string;
  site_subtype?: string;
  site_stage: string;
  commodities: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  confidence?: string;
  web_link?: string;
}

interface ProjectTenement {
  id: string;
  number: string;
  type: string;
  status: string;
  holder_name: string;
  area_ha?: number;
  jurisdiction: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [sites, setSites] = useState<ProjectSite[]>([]);
  const [tenements, setTenements] = useState<ProjectTenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectCode = params.code as string;

  useEffect(() => {
    if (projectCode) {
      loadProjectData();
    }
  }, [projectCode]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load project details
      const projectResponse = await fetch(`/api/projects/${encodeURIComponent(projectCode)}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      } else {
        throw new Error('Project not found');
      }

      // Load associated sites
      const sitesResponse = await fetch(`/api/projects/${encodeURIComponent(projectCode)}/sites`);
      if (sitesResponse.ok) {
        const sitesData = await sitesResponse.json();
        setSites(sitesData);
      }

      // Load associated tenements
      const tenementsResponse = await fetch(`/api/projects/${encodeURIComponent(projectCode)}/tenements`);
      if (tenementsResponse.ok) {
        const tenementsData = await tenementsResponse.json();
        setTenements(tenementsData);
      }

    } catch (err) {
      console.error('Error loading project data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested project could not be found.'}</p>
          <Link 
            href="/projects" 
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const commodities = project.commodities_list?.split(', ').filter(Boolean) || [];
  const statusColor = project.project_status === 'Active' ? 'bg-green-100 text-green-800' : 
                     project.project_status === 'Proposed' ? 'bg-blue-100 text-blue-800' :
                     'bg-gray-100 text-gray-800';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
                <p className="text-gray-600 mt-1">Project Code: {project.project_code}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                {project.project_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Project Overview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Building className="w-6 h-6 text-emerald-600 mr-3" />
                Project Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Project Name</h3>
                  <p className="text-lg font-semibold text-gray-900">{project.project_name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Project Code</h3>
                  <p className="text-lg font-semibold text-gray-900">{project.project_code}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                    {project.project_status}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Primary Commodities</h3>
                  <div className="flex flex-wrap gap-2">
                    {commodities.map((commodity, index) => (
                      <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-sm font-medium">
                        {commodity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mining Sites */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MapPin className="w-6 h-6 text-emerald-600 mr-3" />
                Mining Sites ({sites.length})
              </h2>
              
              {sites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sites.map((site, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{site.site_name}</h4>
                          <p className="text-sm text-gray-600">{site.site_code}</p>
                          {site.short_name && site.short_name !== site.site_name && (
                            <p className="text-xs text-gray-500 italic">{site.short_name}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {site.site_type}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {site.site_subtype && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Subtype:</span>
                            <span className="text-sm text-gray-900">{site.site_subtype}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Stage:</span>
                          <span className="text-sm text-gray-900">{site.site_stage}</span>
                        </div>
                        {site.commodities && (
                          <div>
                            <span className="text-sm text-gray-500">Commodities:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {site.commodities.split(', ').map((commodity, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded">
                                  {commodity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {site.coordinates && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Coordinates:</span>
                            <span className="text-sm text-gray-900">
                              {site.coordinates.latitude.toFixed(4)}, {site.coordinates.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                        {site.web_link && (
                          <div className="mt-3">
                            <a 
                              href={site.web_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-800"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View in MINEDX
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Factory className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No mining sites information available</p>
                </div>
              )}
            </div>

            {/* Associated Tenements */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 text-emerald-600 mr-3" />
                Associated Tenements ({tenements.length})
              </h2>
              
              {tenements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Holder
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Area (ha)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenements.map((tenement) => (
                        <tr key={tenement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link 
                              href={`/tenements/${tenement.jurisdiction}/${encodeURIComponent(tenement.number.replace(/\s+/g, '-'))}`}
                              className="text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                              {tenement.number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tenement.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              tenement.status === 'CURRENT' ? 'bg-green-100 text-green-800' :
                              tenement.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {tenement.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {tenement.holder_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tenement.area_ha ? `${tenement.area_ha.toLocaleString()}` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No associated tenements found</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mining Sites</span>
                  <span className="text-lg font-semibold text-gray-900">{sites.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tenements</span>
                  <span className="text-lg font-semibold text-gray-900">{tenements.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Commodities</span>
                  <span className="text-lg font-semibold text-gray-900">{commodities.length}</span>
                </div>
              </div>
            </div>

            {/* Project Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
