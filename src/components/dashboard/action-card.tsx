interface ActionCardProps {
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'overdue' | 'scheduled';
  icon: string;
}

export function ActionCard({ title, description, dueDate, status, icon }: ActionCardProps) {
  const statusConfig = {
    pending: {
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-100',
      iconBg: 'from-amber-400 to-orange-500',
      badge: 'from-amber-400 to-orange-500',
      text: 'Pending'
    },
    overdue: {
      bg: 'from-red-50 to-pink-50',
      border: 'border-red-100',
      iconBg: 'from-red-400 to-red-600',
      badge: 'from-red-400 to-red-600 animate-pulse',
      text: 'Overdue'
    },
    scheduled: {
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-100',
      iconBg: 'from-blue-400 to-indigo-600',
      badge: 'from-emerald-400 to-green-500',
      text: 'Scheduled'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`group flex items-start justify-between p-6 bg-gradient-to-r ${config.bg} rounded-2xl border ${config.border} hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start space-x-4">
        <div className={`p-3 bg-gradient-to-br ${config.iconBg} rounded-xl shadow-md`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-600 mb-1">{description}</p>
          <p className="text-sm text-gray-500">{dueDate}</p>
        </div>
      </div>
      <span className={`px-4 py-2 bg-gradient-to-r ${config.badge} text-white text-sm font-bold rounded-full shadow-md`}>
        {config.text}
      </span>
    </div>
  );
}
