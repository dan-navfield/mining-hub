interface QuickActionButtonProps {
  title: string;
  icon: string;
  color: 'emerald' | 'blue' | 'purple';
  onClick?: () => void;
}

export function QuickActionButton({ title, icon, color, onClick }: QuickActionButtonProps) {
  const colorConfig = {
    emerald: {
      bg: 'from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100',
      border: 'border-emerald-200',
      iconBg: 'from-emerald-400 to-emerald-600',
      arrow: 'text-emerald-600'
    },
    blue: {
      bg: 'from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100',
      border: 'border-blue-200',
      iconBg: 'from-blue-400 to-indigo-600',
      arrow: 'text-blue-600'
    },
    purple: {
      bg: 'from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100',
      border: 'border-purple-200',
      iconBg: 'from-purple-400 to-pink-600',
      arrow: 'text-purple-600'
    }
  };

  const config = colorConfig[color];

  return (
    <button 
      onClick={onClick}
      className={`w-full group flex items-center justify-between p-4 text-left rounded-2xl bg-gradient-to-r ${config.bg} border ${config.border} transition-all duration-200 hover:shadow-lg`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 bg-gradient-to-br ${config.iconBg} rounded-xl`}>
          <span className="text-white text-lg">{icon}</span>
        </div>
        <span className="font-semibold text-gray-900">{title}</span>
      </div>
      <span className={`${config.arrow} group-hover:translate-x-1 transition-transform text-xl`}>→</span>
    </button>
  );
}
