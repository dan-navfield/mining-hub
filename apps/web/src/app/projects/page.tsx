'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Building, 
  MapPin, 
  Gem, 
  Activity,
  ExternalLink,
  ChevronRight,
  Factory,
  TrendingUp
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [commodityFilter, setCommodityFilter] = useState('all');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, commodityFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.commodity?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => 
        project.project_status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Commodity filter
    if (commodityFilter !== 'all') {
      filtered = filtered.filter(project =>
        project.commodities_list?.toLowerCase().includes(commodityFilter.toLowerCase()) ||
        project.commodity?.toLowerCase().includes(commodityFilter.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const getUniqueStatuses = () => {
    const statuses = projects.map(p => p.project_status).filter(Boolean);
    return [...new Set(statuses)];
  };

  const getUniqueCommodities = () => {
    const commodities = projects.flatMap(p => 
      (p.commodities_list || p.commodity || '').split(',').map(c => c.trim()).filter(Boolean)
    );
    return [...new Set(commodities)].sort();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'proposed': return 'bg-blue-100 text-blue-800';
      case 'care and maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'shut': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mining Projects</h1>
              <p className="text-gray-600 mt-2">
                Browse {projects.length} mining projects across Australia
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-50 px-4 py-2 rounded-lg">
                <div className="flex items-center text-emerald-700">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <span className="font-medium">{filteredProjects.length} Projects</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                {getUniqueStatuses().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Commodity Filter */}
            <div>
              <select
                value={commodityFilter}
                onChange={(e) => setCommodityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Commodities</option>
                {getUniqueCommodities().slice(0, 20).map(commodity => (
                  <option key={commodity} value={commodity}>{commodity}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCommodityFilter('all');
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const commodities = (project.commodities_list || project.commodity || '').split(',').map(c => c.trim()).filter(Boolean);
              const siteCount = project.associated_sites ? project.associated_sites.split(',').length : 0;
              
              return (
                <Link
                  key={project.project_code}
                  href={`/projects/${encodeURIComponent(project.project_code)}`}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {project.project_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{project.project_code}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>

                  <div className="space-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.project_status)}`}>
                        {project.project_status || 'Unknown'}
                      </span>
                    </div>

                    {/* Commodities */}
                    {commodities.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500 block mb-2">Commodities:</span>
                        <div className="flex flex-wrap gap-1">
                          {commodities.slice(0, 4).map((commodity, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded">
                              {commodity}
                            </span>
                          ))}
                          {commodities.length > 4 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{commodities.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sites Count */}
                    {siteCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Mining Sites:</span>
                        <span className="text-sm font-medium text-gray-900">{siteCount}</span>
                      </div>
                    )}

                    {/* Last Updated */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                      <span>Updated:</span>
                      <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Factory className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || commodityFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No mining projects are currently available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
