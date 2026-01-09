'use client';

import { useQuery } from '@tanstack/react-query';
// Card component replaced with div
import { Building2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export function DashboardStats() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    },
  });

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Tenements',
      value: stats.tenements.total,
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      title: 'Overdue Actions',
      value: stats.actions.overdue,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      title: 'Upcoming Actions',
      value: stats.actions.upcoming,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Completed Actions',
      value: stats.actions.byStatus.Done || 0,
      icon: CheckCircle,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.title} className="p-6 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <Icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
