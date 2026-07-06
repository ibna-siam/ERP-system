import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import SearchInput from '../components/SearchInput';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import { employeeService } from '../services/employeeService';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  salary: '',
  joining_date: '',
  status: 'active',
};

export default function Employees() {
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
      const { data } = await employeeService.getAll({ search: debouncedSearch, page, limit: 10 });
      setRows(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      department: row.department || '',
      position: row.position || '',
      salary: row.salary || '',
      joining_date: row.joining_date ? row.joining_date.slice(0, 10) : '',
      status: row.status || 'active',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await employeeService.update(editingId, form);
        showToast('Employee updated successfully', 'success');
      } else {
        await employeeService.create(form);
        showToast('Employee added successfully', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save employee', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await employeeService.remove(deleteTarget.id);
      showToast('Employee deleted', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast('Failed to delete employee', 'error');
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
    { key: 'department', header: 'Department' },
    { key: 'position', header: 'Position' },
    { key: 'salary', header: 'Salary', render: (row) => `৳${Number(row.salary).toLocaleString()}` },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge color={row.status === 'active' ? 'green' : 'gray'}>{row.status}</Badge>,
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
        title="Employees"
        subtitle="Manage your team members"
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Employee
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, department..." />
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyTitle="No employees found"
          emptyMessage="Add your first employee to get started."
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Full Name" required>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </FormField>
            <FormField label="Phone">
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </FormField>
            <FormField label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
            <FormField label="Department" required>
              <input
                className={inputClass}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Position" required>
              <input
                className={inputClass}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Salary">
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </FormField>
            <FormField label="Joining Date">
              <input
                type="date"
                className={inputClass}
                value={form.joining_date}
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Employee' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
