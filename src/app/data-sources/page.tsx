'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Clock, X } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  jurisdiction: string;
  type: string;
  status: 'Active' | 'Inactive' | 'Error' | 'Maintenance';
  url: string;
  description?: string;
  last_sync_at?: string;
  last_error?: string;
  sync_interval?: number;
  is_enabled: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}


export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [realRecordCounts, setRealRecordCounts] = useState<Record<string, number>>({});
  const [syncingJurisdictions, setSyncingJurisdictions] = useState<Set<string>>(new Set());
  const [syncProgress, setSyncProgress] = useState<Record<string, {
    status: string;
    progress: number;
    currentRecord: number;
    totalRecords: number;
    message: string;
    estimatedTimeRemaining?: number;
  }>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalRecords: 0,
    lastGlobalSync: null as string | null,
    activeConnections: 0,
    errorConnections: 0,
    totalDataSources: 0,
    syncInProgress: false
  });

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    try {
      // Fetch data sources and stats from Next.js API routes
      const [dataSourcesResponse, statsResponse] = await Promise.all([
        fetch('/api/data-sources'),
        fetch('/api/tenements/stats')
      ]);
      
      const dataSources = dataSourcesResponse.ok ? await dataSourcesResponse.json() : [];
      const realRecordCounts = statsResponse.ok ? await statsResponse.json() : {};
      
      setDataSources(dataSources);
      setRealRecordCounts(realRecordCounts);
      
      // Calculate system stats using real data
      const totalRecords = Object.values(realRecordCounts).reduce((sum: number, count: any) => sum + (count || 0), 0);
      
      const stats = {
        totalRecords,
        lastGlobalSync: dataSources.reduce((latest: string | null, ds: DataSource) => {
          if (!ds.last_sync_at) return latest;
          if (!latest) return ds.last_sync_at;
          return new Date(ds.last_sync_at) > new Date(latest) ? ds.last_sync_at : latest;
        }, null),
        activeConnections: dataSources.filter((ds: DataSource) => ds.status === 'Active').length,
        errorConnections: dataSources.filter((ds: DataSource) => ds.status === 'Error').length,
        totalDataSources: dataSources.length,
        syncInProgress: false
      };
      setSystemStats(stats);
      
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
      // Set empty data as fallback
      setDataSources([]);
      setRealRecordCounts({});
    } finally {
      setLoading(false);
    }
  };

  const checkAllStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/data-sources/status/check');
      const results = await response.json();
      console.log('Status check results:', results);
      await fetchDataSources();
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setChecking(false);
    }
  };

  // Notification functions
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after duration (default 5 seconds)
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Poll progress for a jurisdiction
  const pollProgress = async (jurisdiction: string) => {
    try {
      const response = await fetch(`/api/data-sources/sync-progress/${jurisdiction}`);
      const progress = await response.json();
      
      setSyncProgress(prev => ({
        ...prev,
        [jurisdiction]: progress
      }));
      
      return progress.status !== 'syncing';
    } catch (error) {
      console.error('Failed to poll progress:', error);
      return true; // Stop polling on error
    }
  };

  // Enhanced sync function with real-time progress tracking
  const syncDataSource = async (jurisdiction: string) => {
    // Add to syncing set
    setSyncingJurisdictions(prev => new Set(prev).add(jurisdiction));
    
    // Initialize progress
    setSyncProgress(prev => ({
      ...prev,
      [jurisdiction]: {
        status: 'syncing',
        progress: 0,
        currentRecord: 0,
        totalRecords: 0,
        message: 'Starting sync...'
      }
    }));
    
    // Start polling progress
    const progressInterval = setInterval(async () => {
      const shouldStop = await pollProgress(jurisdiction);
      if (shouldStop) {
        clearInterval(progressInterval);
      }
    }, 1000); // Poll every second
    
    try {
      let syncUrl;
      if (jurisdiction === 'WA') {
        syncUrl = `/api/data-sources/sync-wa-all`;
      } else {
        syncUrl = `/api/data-sources/sync-${jurisdiction.toLowerCase()}`;
      }
      
      const response = await fetch(syncUrl, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Sync Completed',
          message: `${jurisdiction} sync completed successfully! ${result.imported} tenements imported.`,
          duration: 8000
        });
        
        // Wait a moment for database to update, then refresh the data
        setTimeout(async () => {
          await fetchDataSources();
        }, 1000);
      } else {
        addNotification({
          type: 'error',
          title: 'Sync Failed',
          message: `${jurisdiction} sync failed: ${result.errors?.join(', ') || 'Unknown error'}`,
          duration: 10000
        });
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: `${jurisdiction} sync failed: Could not connect to API`,
        duration: 10000
      });
    } finally {
      // Remove from syncing set
      setSyncingJurisdictions(prev => {
        const newSet = new Set(prev);
        newSet.delete(jurisdiction);
        return newSet;
      });
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="ml-2">Loading data sources...</span>
        </div>
      </div>
    );
  }

  // Toast Notification Component
  const ToastNotifications = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-2xl w-full mx-4 shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-400' :
            notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
            'bg-blue-50 border-l-4 border-blue-400'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-400" />}
                {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
                {notification.type === 'info' && <Clock className="h-5 w-5 text-blue-400" />}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-900' :
                  notification.type === 'error' ? 'text-red-900' :
                  'text-blue-900'
                }`}>
                  {notification.title}
                </p>
                <p className={`mt-1 text-sm ${
                  notification.type === 'success' ? 'text-green-700' :
                  notification.type === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className={`rounded-md inline-flex ${
                    notification.type === 'success' ? 'text-green-400 hover:text-green-500' :
                    notification.type === 'error' ? 'text-red-400 hover:text-red-500' :
                    'text-blue-400 hover:text-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <ToastNotifications />
      <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Data Source Connections</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage external mining data sources across Australian jurisdictions
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/demo/abn-lookup">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              ABN Lookup Demo
            </button>
          </Link>
          <button 
            onClick={checkAllStatus} 
            disabled={checking}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {checking ? 'Checking...' : 'Check All Status'}
          </button>
        </div>
      </div>

      {/* System Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="text-2xl font-semibold text-gray-900">{systemStats.totalRecords.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Sources</p>
              <p className="text-2xl font-semibold text-gray-900">{systemStats.activeConnections}/{systemStats.totalDataSources}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Connection Issues</p>
              <p className="text-2xl font-semibold text-gray-900">{systemStats.errorConnections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Global Sync</p>
              <p className="text-2xl font-semibold text-gray-900">
                {systemStats.lastGlobalSync ? new Date(systemStats.lastGlobalSync).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">System Status</h3>
            <p className="text-emerald-100 mt-1">
              {systemStats.activeConnections === systemStats.totalDataSources 
                ? "All data sources are operational" 
                : `${systemStats.errorConnections} data source${systemStats.errorConnections !== 1 ? 's' : ''} need${systemStats.errorConnections === 1 ? 's' : ''} attention`
              }
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${systemStats.errorConnections === 0 ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
              <span className="text-sm font-medium">
                {systemStats.errorConnections === 0 ? 'Healthy' : 'Needs Attention'}
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dataSources.length > 0 ? (
          dataSources.map((source) => (
            <div key={source.id} className="bg-white border rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">{source.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{source.description || 'Mining data source'}</p>
              
              <div className="space-y-4">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        source.status === 'Active' ? 'bg-green-500' : 
                        source.status === 'Error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></span>
                      <span className="text-sm font-medium">{source.status}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</span>
                    <p className="text-sm font-medium mt-1">{source.type}</p>
                  </div>
                </div>

                {/* Data URL */}
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Data Source URL</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 break-all"
                    >
                      {source.url}
                    </a>
                  </div>
                </div>

                {/* Records and Sync Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Records</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {(realRecordCounts[source.jurisdiction] || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Interval</span>
                    <p className="text-sm font-medium mt-1">
                      {source.sync_interval ? `${Math.floor(source.sync_interval / 60)}h` : 'Manual'}
                    </p>
                  </div>
                </div>

                {/* Last Sync Details */}
                {source.last_sync_at && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Successful Sync</span>
                    <div className="mt-1">
                      <p className="text-sm font-medium">{new Date(source.last_sync_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(source.last_sync_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}

                {/* Connection Status */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Connection Status</h4>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      source.status === 'Active' ? 'bg-green-100 text-green-800' : 
                      source.status === 'Error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        source.status === 'Active' ? 'bg-green-500' : 
                        source.status === 'Error' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></span>
                      {source.status}
                    </div>
                  </div>
                </div>

                {/* Error Information - Only show when connection status is Error */}
                {source.last_error && source.status === 'Error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-red-800 uppercase tracking-wider">Current Error</span>
                    </div>
                    <p className="text-sm text-red-700">{source.last_error}</p>
                  </div>
                )}

                {/* API Health Check */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-800 uppercase tracking-wider">API Health</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-700">Live</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-blue-600">Last Check:</span>
                      <span className="text-blue-800 ml-1">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Next Check:</span>
                      <span className="text-blue-800 ml-1">{new Date(Date.now() + 300000).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Live Progress Bar */}
                {syncingJurisdictions.has(source.jurisdiction) && syncProgress[source.jurisdiction] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Sync Progress</span>
                      <span className="text-xs text-blue-600">{Math.round(syncProgress[source.jurisdiction].progress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${syncProgress[source.jurisdiction].progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>{syncProgress[source.jurisdiction].message}</div>
                      {syncProgress[source.jurisdiction].totalRecords > 0 && (
                        <div className="flex justify-between">
                          <span>Records: {syncProgress[source.jurisdiction].currentRecord.toLocaleString()} / {syncProgress[source.jurisdiction].totalRecords.toLocaleString()}</span>
                          {syncProgress[source.jurisdiction].estimatedTimeRemaining && (
                            <span>ETA: {Math.round(syncProgress[source.jurisdiction].estimatedTimeRemaining! / 1000)}s</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => syncDataSource(source.jurisdiction)}
                    disabled={syncingJurisdictions.has(source.jurisdiction)}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2 ${
                      syncingJurisdictions.has(source.jurisdiction)
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {syncingJurisdictions.has(source.jurisdiction) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <span>Sync Now</span>
                    )}
                  </button>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium text-center"
                  >
                    View Source
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No data sources found. The API may be initializing...</p>
          </div>
        )}
      </div>

      {/* System Information Footer */}
      <div className="mt-12 bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Data Sources</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• NSW: Mining Titles Register (Oracle APEX)</li>
              <li>• VIC: DataVic WFS Services</li>
              <li>• NT: Strike Weave Mapping System</li>
              <li>• QLD: Open Data ArcGIS REST</li>
              <li>• WA: DMIRS-003 ArcGIS Services</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sync Schedule</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automatic sync every 24 hours</li>
              <li>• Manual sync available anytime</li>
              <li>• Health checks every 5 minutes</li>
              <li>• Error retry after 1 hour</li>
              <li>• Performance monitoring 24/7</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Data Quality</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time validation</li>
              <li>• Duplicate detection</li>
              <li>• Format standardization</li>
              <li>• Historical data preservation</li>
              <li>• Audit trail maintenance</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <span>Mining Hub Data Sources v2.1.0</span>
              <span className="mx-2">•</span>
              <span>API Server: localhost:4000</span>
              <span className="mx-2">•</span>
              <span>Database: Supabase</span>
            </div>
            <div>
              <span>Page loaded: {new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );

}
