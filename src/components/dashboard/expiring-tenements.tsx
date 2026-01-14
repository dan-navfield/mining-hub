'use client';

import { useQuery } from '@tanstack/react-query';
import { tenementsApi } from '@/lib/api/tenements';
import { StatusBadge } from '@mining-hub/ui';
import { formatDate, isExpiringSoon } from '@mining-hub/ui';
import { AlertTriangle } from 'lucide-react';

export function ExpiringTenements() {
  const { data: tenements } = useQuery({
    queryKey: ['tenements', 'expiring'],
    queryFn: () => {
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 60);
      return tenementsApi.getAll({ 
        page: 1, 
        limit: 5 
      });
    },
  });

  if (!tenements?.data.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tenements expiring soon
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tenements.data.map((tenement) => (
        <div 
          key={tenement.id} 
          className={`flex items-center justify-between p-3 border rounded-lg ${
            tenement.expiry_date && isExpiringSoon(new Date(tenement.expiry_date)) ? 'border-yellow-200 bg-yellow-50' : ''
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={tenement.status} />
              {tenement.expiry_date && isExpiringSoon(new Date(tenement.expiry_date)) && (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <p className="font-medium">{tenement.number}</p>
            <p className="text-sm text-muted-foreground">
              {tenement.holder_name} - Expires {tenement.expiry_date ? formatDate(new Date(tenement.expiry_date)) : 'No expiry date'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
