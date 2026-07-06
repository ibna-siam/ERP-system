import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, PackagePlus, AlertTriangle, FolderPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import SearchInput from '../components/SearchInput';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition';

const emptyForm = {
  name: '', sku: '', category_id: '', price: '', cost_price: '',
  stock_quantity: '', low_stock_threshold: '10', unit: 'pcs',
};

export default function Products() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [savingCategory, setSavingCategory] = useState(false);

  const [stockTarget, setStockTarget] = useState(null);
  const [stockForm, setStockForm] = useState({ type: 'in', quantity: '', reason: '' });
  const [savingStock, setSavingStock] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { showToast } = useToast();

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      showToast('Failed to load categories', 'error');
    }
  }, [showToast]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productService.getAll({
        search: debouncedSearch, category: categoryFilter, page, limit: 10,
      });
      setRows(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, page, showToast]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      name: row.name || '', sku: row.sku || '', category_id: row.category_id || '',
      price: row.price, cost_price: row.cost_price, stock_quantity: row.stock_quantity,
      low_stock_threshold: row.low_stock_threshold, unit: row.unit || 'pcs',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await productService.update(editingId, form);
        showToast('Product updated successfully', 'success');
      } else {
        await productService.create(form);
        showToast('Product added successfully', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    setSavingCategory(true);
    try {
      await categoryService.create(categoryForm);
      showToast('Category added successfully', 'success');
      setCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '' });
      loadCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add category', 'error');
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleStockSubmit(e) {
    e.preventDefault();
    setSavingStock(true);
    try {
      await productService.updateStock(stockTarget.id, stockForm);
      showToast('Stock updated successfully', 'success');
      setStockTarget(null);
      setStockForm({ type: 'in', quantity: '', reason: '' });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update stock', 'error');
    } finally {
      setSavingStock(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await productService.remove(deleteTarget.id);
      showToast('Product deleted', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast('Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'name', header: 'Product',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-800">{row.name}</p>
          <p className="text-xs text-gray-400">{row.sku}</p>
        </div>
      ),
    },
    { key: 'category_name', header: 'Category', render: (row) => row.category_name || <span className="text-gray-400">Uncategorized</span> },
    { key: 'price', header: 'Price', render: (row) => `৳${Number(row.price).toLocaleString()}` },
    {
      key: 'stock_quantity', header: 'Stock',
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
    {
      key: 'actions', header: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setStockTarget(row)} title="Update stock" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
            <PackagePlus size={16} />
          </button>
          <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
            <Pencil size={16} />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog and stock levels"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCategoryModalOpen(true)}><FolderPlus size={16} /> Category</Button>
            <Button onClick={openCreate}><Plus size={16} /> Add Product</Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or SKU..." />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`${inputClass} sm:w-52`}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyTitle="No products found"
          emptyMessage="Add your first product to get started."
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Add/Edit Product Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Product Name" required>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FormField>
            <FormField label="SKU">
              <input className={inputClass} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </FormField>
            <FormField label="Category">
              <select className={inputClass} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Unit">
              <input className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, box..." />
            </FormField>
            <FormField label="Selling Price" required>
              <input type="number" min="0" step="0.01" className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </FormField>
            <FormField label="Cost Price">
              <input type="number" min="0" step="0.01" className={inputClass} value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </FormField>
            <FormField label="Opening Stock">
              <input type="number" min="0" className={inputClass} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} disabled={!!editingId} />
              {editingId && <p className="text-xs text-gray-400 mt-1">Use "Update stock" action to adjust quantity.</p>}
            </FormField>
            <FormField label="Low Stock Threshold">
              <input type="number" min="0" className={inputClass} value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}</Button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="Add Category" size="sm">
        <form onSubmit={handleCreateCategory}>
          <FormField label="Category Name" required>
            <input className={inputClass} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
          </FormField>
          <FormField label="Description">
            <textarea rows={2} className={inputClass} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={savingCategory}>{savingCategory ? 'Saving...' : 'Add Category'}</Button>
          </div>
        </form>
      </Modal>

      {/* Update Stock Modal */}
      <Modal isOpen={!!stockTarget} onClose={() => setStockTarget(null)} title={`Update Stock — ${stockTarget?.name || ''}`} size="sm">
        <form onSubmit={handleStockSubmit}>
          <p className="text-sm text-gray-500 mb-4">
            Current stock: <span className="font-medium text-gray-700">{stockTarget?.stock_quantity} {stockTarget?.unit}</span>
          </p>
          <FormField label="Movement Type" required>
            <select className={inputClass} value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}>
              <option value="in">Stock In (add)</option>
              <option value="out">Stock Out (remove)</option>
            </select>
          </FormField>
          <FormField label="Quantity" required>
            <input type="number" min="1" className={inputClass} value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
          </FormField>
          <FormField label="Reason">
            <input className={inputClass} value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} placeholder="e.g. Damaged goods, stock count correction..." />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setStockTarget(null)}>Cancel</Button>
            <Button type="submit" disabled={savingStock}>{savingStock ? 'Saving...' : 'Update Stock'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
