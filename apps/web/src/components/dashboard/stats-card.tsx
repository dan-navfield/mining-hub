interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: 'emerald' | 'amber' | 'red' | 'green';
}

export function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  const colorClasses = {
    emerald: 'from-emerald-400 to-emerald-600 text-emerald-600',
    amber: 'from-amber-400 to-orange-500 text-amber-600',
    red: 'from-red-400 to-red-600 text-red-600',
    green: 'from-green-400 to-emerald-600 text-emerald-600',
  };

  return (
    <div className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]} rounded-xl shadow-md`}>
          <span className="text-white text-2xl">{icon}</span>
        </div>
        <div className="text-2xl opacity-60">📊</div>
      </div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className={`text-sm font-medium ${colorClasses[color].split(' ')[2]}`}>{subtitle}</p>
    </div>
  );
}
