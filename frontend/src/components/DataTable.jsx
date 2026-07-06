import Spinner from './Spinner';
import EmptyState from './EmptyState';

// columns: [{ key, header, render?(row) }]
export default function DataTable({ columns, data, loading, emptyTitle, emptyMessage }) {
  if (loading) {
    return (
      <div className="py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/60 transition">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
