import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, ShoppingCart } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import SearchInput from '../components/SearchInput';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import { saleService } from '../services/saleService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition';

const statusColors = { completed: 'green', pending: 'yellow', cancelled: 'red' };

export default function Sales() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await saleService.getAll({ search: debouncedSearch, page, limit: 10 });
      setRows(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      showToast('Failed to load sales', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, showToast]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  async function openCreate() {
    setCustomerId('');
    setSaleDate(new Date().toISOString().slice(0, 10));
    setItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
    setModalOpen(true);
    try {
      const [custRes, prodRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        productService.getAll({ limit: 100 }),
      ]);
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      showToast('Failed to load customers/products', 'error');
    }
  }

  function updateItem(index, field, value) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'product_id') {
        const product = products.find((p) => p.id === Number(value));
        next[index].unit_price = product ? Number(product.price) : 0;
      }
      return next;
    });
  }

  function addItemRow() {
    setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0 }]);
  }

  function removeItemRow(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    const validItems = items.filter((i) => i.product_id && Number(i.quantity) > 0);
    if (!validItems.length) {
      showToast('Please add at least one product', 'error');
      return;
    }

    setSaving(true);
    try {
      const { data } = await saleService.create({
        customer_id: customerId || null,
        sale_date: saleDate,
        items: validItems,
      });
      showToast(`Sale ${data.invoice_no} created successfully`, 'success');
      setModalOpen(false);
      loadData();
      navigate(`/sales/${data.id}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create sale', 'error');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'invoice_no', header: 'Invoice No.', render: (row) => <span className="font-medium text-gray-800">{row.invoice_no}</span> },
    { key: 'customer_name', header: 'Customer', render: (row) => row.customer_name || <span className="text-gray-400">Walk-in</span> },
    { key: 'sale_date', header: 'Date', render: (row) => new Date(row.sale_date).toLocaleDateString() },
    { key: 'total_amount', header: 'Total', render: (row) => `৳${Number(row.total_amount).toLocaleString()}` },
    { key: 'status', header: 'Status', render: (row) => <Badge color={statusColors[row.status]}>{row.status}</Badge> },
    {
      key: 'actions', header: '',
      render: (row) => (
        <button onClick={() => navigate(`/sales/${row.id}`)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Create and manage sales invoices"
        action={<Button onClick={openCreate}><Plus size={16} /> Create Sale</Button>}
      />

      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice no. or customer..." />
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyTitle="No sales yet"
          emptyMessage="Create your first sale to get started."
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Sale" size="lg">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Customer">
              <select className={inputClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in Customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Sale Date" required>
              <input type="date" className={inputClass} value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
            </FormField>
          </div>

          <div className="mt-2 mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Products</p>
            <button type="button" onClick={addItemRow} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map((item, index) => {
              const product = products.find((p) => p.id === Number(item.product_id));
              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                  <select
                    className={`${inputClass} col-span-5`}
                    value={item.product_id}
                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                        {p.name} ({p.stock_quantity} {p.unit} left)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max={product?.stock_quantity || undefined}
                    className={`${inputClass} col-span-2`}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputClass} col-span-3`}
                    placeholder="Price"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                  />
                  <div className="col-span-1 text-xs text-gray-600 text-right">
                    ৳{(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(0)}
                  </div>
                  <button type="button" onClick={() => removeItemRow(index)} className="col-span-1 text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500 flex items-center gap-2"><ShoppingCart size={16} /> Total Amount</span>
            <span className="text-xl font-semibold text-gray-800">৳{total.toLocaleString()}</span>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Processing...' : 'Complete Sale'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
