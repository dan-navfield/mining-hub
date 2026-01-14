'use client';

import { useQuery } from '@tanstack/react-query';
import { actionsApi } from '@/lib/api/actions';
import { StatusBadge, ActionTypeBadge } from '@mining-hub/ui';
import { formatDate } from '@mining-hub/ui';

export function RecentActions() {
  const { data: actions } = useQuery({
    queryKey: ['actions', 'recent'],
    queryFn: () => actionsApi.getAll({ page: 1, limit: 5 }),
  });

  if (!actions?.data.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent actions found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.data.map((action) => (
        <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={action.status} />
            </div>
            <p className="font-medium">{action.title}</p>
            <p className="text-sm text-muted-foreground">
              Tenement ID: {action.tenementId} - Due {action.dueDate ? formatDate(action.dueDate) : 'No due date'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
