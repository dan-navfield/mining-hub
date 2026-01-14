'use client';

import { useEffect, useState } from 'react';
import { Button, Badge } from '@mining-hub/ui';
import { waMTOService } from '@/lib/services/wa-mto.service';
import { WATenement } from '@mining-hub/types';

export default function HomePage() {
  const [tenementStats, setTenementStats] = useState({
    total: 5,
    pending: 6,
    overdue: 2,
    completed: 12
  });
  const [recentTenements, setRecentTenements] = useState<WATenement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🚀 HomePage loaded with WA tenements integration');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading REAL dashboard data from WA Government...');
      console.log('🌐 Connecting to DMIRS-003 Mining Tenements dataset...');
      
      // Load real tenements for dashboard
      const tenements = await waMTOService.getSampleTenements();
      console.log('✅ Retrieved', tenements.length, 'REAL WA tenements');
      
      if (tenements.length === 0) {
        console.warn('⚠️ No real tenements available from WA Government API');
        setTenementStats({
          total: 0,
          pending: 0,
          overdue: 0,
          completed: 0
        });
        return;
      }
      
      setRecentTenements(tenements.slice(0, 3)); // Show first 3 for recent actions
      
      // Calculate stats from REAL WA data
      const now = new Date();
      const stats = {
        total: tenements.length,
        pending: tenements.filter(t => t.status === 'Withdrawn' || t.status === 'Refused').length,
        overdue: tenements.filter(t => t.expiryDate && t.expiryDate < now).length,
        completed: tenements.filter(t => t.status === 'Live' || t.status === 'Granted').length
      };
      
      setTenementStats(stats);
      
      console.log('✅ REAL WA dashboard data loaded:', { 
        source: 'WA Government DMIRS-003',
        tenementsCount: tenements.length,
        stats: stats,
        sampleTenements: tenements.slice(0, 3).map(t => ({ name: t.name, holder: t.holder, status: t.status }))
      });
    } catch (error) {
      console.error('❌ Failed to load REAL WA dashboard data:', error);
      // Show error state instead of fallback data
      setTenementStats({
        total: 0,
        pending: 0,
        overdue: 0,
        completed: 0
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome back, John! 👋
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Here's what's happening with your tenement portfolio today. Stay on top of renewals, compliance, and opportunities.
          </p>
        </div>

        {/* Beautiful Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Total Tenements Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-md">
                <span className="text-white text-2xl">🏢</span>
              </div>
              <div className="text-2xl opacity-60">📊</div>
            </div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Tenements</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{loading ? '...' : tenementStats.total}</p>
            <p className="text-sm font-medium text-emerald-600">Live WA data 🌐</p>
          </div>

          {/* Pending Actions Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-md">
                <span className="text-white text-2xl">⏰</span>
              </div>
              <div className="text-2xl opacity-60">🔔</div>
            </div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Pending Actions</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{loading ? '...' : tenementStats.pending}</p>
            <p className="text-sm font-medium text-amber-600">From WA MTO ⚡</p>
          </div>

          {/* Overdue Items Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-md">
                <span className="text-white text-2xl">⚠️</span>
              </div>
              <div className="text-2xl opacity-60">🚨</div>
            </div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Overdue Items</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{loading ? '...' : tenementStats.overdue}</p>
            <p className="text-sm font-medium text-red-600">Needs attention 🔥</p>
          </div>

          {/* Completed Card */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl shadow-md">
                <span className="text-white text-2xl">✅</span>
              </div>
              <div className="text-2xl opacity-60">🎉</div>
            </div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Live Tenements</h3>
            <p className="text-3xl font-bold text-gray-900 mb-2">{loading ? '...' : tenementStats.completed}</p>
            <p className="text-sm font-medium text-emerald-600">Active now 🚀</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Recent Actions</h2>
                    <p className="text-emerald-100">Stay on top of your compliance requirements</p>
                  </div>
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                    View All →
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                      <span className="text-white text-lg">📅</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Anniversary Renewal Due</h3>
                      <p className="text-sm text-gray-600">M77/1234 • Hetherington Mining Pty Ltd</p>
                      <p className="text-xs text-gray-500">Due March 20, 2024</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>
                </div>

                <div className="flex items-start justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gradient-to-br from-red-400 to-red-600 rounded-lg">
                      <span className="text-white text-lg">💰</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Annual Rent Payment</h3>
                      <p className="text-sm text-gray-600">M77/1234 • $5,000.00</p>
                      <p className="text-xs text-gray-500">Due February 20, 2024</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="animate-pulse">Overdue</Badge>
                </div>

                <div className="flex items-start justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg">
                      <span className="text-white text-lg">📋</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Section 29 Compliance</h3>
                      <p className="text-sm text-gray-600">M77/1234 • Annual compliance report</p>
                      <p className="text-xs text-gray-500">Due June 20, 2024</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">Scheduled</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button className="w-full justify-between bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200">
                  <div className="flex items-center">
                    <span className="mr-2">➕</span>
                    Add Tenement
                  </div>
                  <span>→</span>
                </Button>
                <Button className="w-full justify-between bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                  <div className="flex items-center">
                    <span className="mr-2">📊</span>
                    Generate Report
                  </div>
                  <span>→</span>
                </Button>
                <Button className="w-full justify-between bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200">
                  <div className="flex items-center">
                    <span className="mr-2">📁</span>
                    Import CSV
                  </div>
                  <span>→</span>
                </Button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <span className="text-xl">✨</span>
                </div>
                <h3 className="text-lg font-semibold">System Status</h3>
              </div>
              <p className="text-emerald-100 mb-4 text-sm">
                🚀 All systems operational! WA Government data integration active with real-time tenement sync.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Live WA Data</span>
                </div>
                <Button 
                  size="sm" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  onClick={() => window.location.href = '/tenements'}
                >
                  View Tenements →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
