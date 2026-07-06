import { useEffect, useState, useCallback } from 'react';
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../context/ToastContext';

export default function Inventory() {
  const [tab, setTab] = useState('current');
  const [current, setCurrent] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showToast } = useToast();

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await inventoryService.getCurrent();
      setCurrent(data);
    } catch (err) {
      showToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await inventoryService.getHistory({ page, limit: 15 });
      setHistory(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      showToast('Failed to load inventory history', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    if (tab === 'current') loadCurrent();
    else loadHistory();
  }, [tab, loadCurrent, loadHistory]);

  const currentColumns = [
    { key: 'name', header: 'Product', render: (row) => <span className="font-medium text-gray-800">{row.name}</span> },
    { key: 'sku', header: 'SKU' },
    { key: 'category_name', header: 'Category', render: (row) => row.category_name || <span className="text-gray-400">-</span> },
    {
      key: 'stock_quantity', header: 'Current Stock',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={row.stock_quantity <= row.low_stock_threshold ? 'text-red-600 font-medium' : 'text-gray-700'}>
            {row.stock_quantity} {row.unit}
          </span>
          {row.stock_quantity <= row.low_stock_threshold && (
            <Badge color="red"><AlertTriangle size={11} className="inline mr-0.5" /> Low</Badge>
          )}
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      key: 'type', header: 'Type',
      render: (row) => row.type === 'in' ? (
        <Badge color="green"><ArrowDownCircle size={11} className="inline mr-1" />Stock In</Badge>
      ) : (
        <Badge color="red"><ArrowUpCircle size={11} className="inline mr-1" />Stock Out</Badge>
      ),
    },
    { key: 'product_name', header: 'Product' },
    { key: 'quantity', header: 'Quantity', render: (row) => `${row.quantity} ${row.unit}` },
    { key: 'reason', header: 'Reason', render: (row) => row.reason || <span className="text-gray-400">-</span> },
    { key: 'reference_type', header: 'Source', render: (row) => <span className="capitalize">{row.reference_type}</span> },
    { key: 'created_at', header: 'Date', render: (row) => new Date(row.created_at).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track current stock and stock movement history" />

      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="flex border-b border-gray-100 px-4">
          <button
            onClick={() => setTab('current')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${tab === 'current' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Current Inventory
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${tab === 'history' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Movement History
          </button>
        </div>

        {tab === 'current' ? (
          <DataTable columns={currentColumns} data={current} loading={loading} emptyTitle="No products yet" />
        ) : (
          <>
            <DataTable columns={historyColumns} data={history} loading={loading} emptyTitle="No stock movements yet" />
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
