import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data found', message = 'There is nothing to show here yet.', icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-3">
        <Icon size={28} className="text-gray-400" />
      </div>
      <p className="font-semibold text-gray-700">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{message}</p>
    </div>
  );
}
