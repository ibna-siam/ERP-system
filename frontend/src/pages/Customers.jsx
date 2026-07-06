import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import SearchInput from '../components/SearchInput';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import { customerService } from '../services/customerService';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition';

const emptyForm = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await customerService.getAll({ search: debouncedSearch, page, limit: 10 });
      setRows(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, showToast]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({ name: row.name || '', email: row.email || '', phone: row.phone || '', address: row.address || '' });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await customerService.update(editingId, form);
        showToast('Customer updated successfully', 'success');
      } else {
        await customerService.create(form);
        showToast('Customer added successfully', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save customer', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await customerService.remove(deleteTarget.id);
      showToast('Customer deleted', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast('Failed to delete customer', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-gray-800">{row.name}</span> },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <div className="text-xs text-gray-500 space-y-0.5">
          {row.email && <div className="flex items-center gap-1"><Mail size={12} /> {row.email}</div>}
          {row.phone && <div className="flex items-center gap-1"><Phone size={12} /> {row.phone}</div>}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (row) => row.address ? <div className="flex items-center gap-1 text-gray-500"><MapPin size={12} /> {row.address}</div> : '-',
    },
    {
      key: 'actions',
      header: '',
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
        title="Customers"
        subtitle="Manage your customer base"
        action={<Button onClick={openCreate}><Plus size={16} /> Add Customer</Button>}
      />

      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, phone..." />
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyTitle="No customers found"
          emptyMessage="Add your first customer to get started."
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Full Name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Email">
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="Address">
            <textarea rows={2} className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Customer' : 'Add Customer'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
