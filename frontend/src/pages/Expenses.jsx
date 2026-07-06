import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import { expenseService } from '../services/expenseService';
import { useToast } from '../context/ToastContext';

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition';

const CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Transportation', 'Maintenance', 'Miscellaneous'];

const emptyForm = { title: '', category: 'Rent', amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' };

function monthLabel(m) {
  const [, month] = m.split('-');
  return new Date(2000, Number(month) - 1).toLocaleString('default', { month: 'short' });
}

export default function Expenses() {
  const [rows, setRows] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await expenseService.getAll({ page, limit: 10 });
      setRows(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  const loadMonthly = useCallback(async () => {
    try {
      const { data } = await expenseService.getMonthlyReport();
      setMonthlyData(data);
    } catch (err) {
      // non-critical, ignore
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadMonthly(); }, [loadMonthly]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      title: row.title, category: row.category, amount: row.amount,
      expense_date: row.expense_date.slice(0, 10), notes: row.notes || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await expenseService.update(editingId, form);
        showToast('Expense updated successfully', 'success');
      } else {
        await expenseService.create(form);
        showToast('Expense added successfully', 'success');
      }
      setModalOpen(false);
      loadData();
      loadMonthly();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save expense', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await expenseService.remove(deleteTarget.id);
      showToast('Expense deleted', 'success');
      setDeleteTarget(null);
      loadData();
      loadMonthly();
    } catch (err) {
      showToast('Failed to delete expense', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: 'title', header: 'Title', render: (row) => <span className="font-medium text-gray-800">{row.title}</span> },
    { key: 'category', header: 'Category' },
    { key: 'amount', header: 'Amount', render: (row) => `৳${Number(row.amount).toLocaleString()}` },
    { key: 'expense_date', header: 'Date', render: (row) => new Date(row.expense_date).toLocaleDateString() },
    { key: 'notes', header: 'Notes', render: (row) => row.notes || <span className="text-gray-400">-</span> },
    {
      key: 'actions', header: '',
      render: (row) => (
        <div className="flex items-center gap-2">
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
        title="Expenses"
        subtitle="Track and categorize business expenses"
        action={<Button onClick={openCreate}><Plus size={16} /> Add Expense</Button>}
      />

      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5 mb-4">
        <h3 className="font-semibold text-gray-800 mb-4">Monthly Expense Report</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `৳${Number(v).toLocaleString()}`} labelFormatter={monthLabel} />
            <Bar dataKey="total" fill="#dc2626" radius={[6, 6, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyTitle="No expenses recorded"
          emptyMessage="Add your first expense to get started."
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Title" required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </FormField>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField label="Category" required>
              <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Amount" required>
              <input type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </FormField>
          </div>
          <FormField label="Date" required>
            <input type="date" className={inputClass} value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
          </FormField>
          <FormField label="Notes">
            <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </FormField>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Expense' : 'Add Expense'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Expense"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
      />
    </div>
  );
}
