import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition"
      />
    </div>
  );
}
