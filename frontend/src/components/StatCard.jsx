export default function StatCard({ title, value, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5 flex items-center justify-between hover:shadow-md transition">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
        {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
      </div>
      <div className={`rounded-lg p-3 ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}
