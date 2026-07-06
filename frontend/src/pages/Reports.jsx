import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { reportService } from '../services/reportService';
import { useToast } from '../context/ToastContext';

const TABS = [
  { key: 'sales', label: 'Sales Report' },
  { key: 'purchases', label: 'Purchase Report' },
  { key: 'inventory', label: 'Inventory Report' },
  { key: 'employees', label: 'Employee Report' },
  { key: 'expenses', label: 'Expense Report' },
];

const inputClass =
  'px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition';

function currency(v) {
  return `৳${Number(v || 0).toLocaleString()}`;
}

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });
  const { showToast } = useToast();

  const loadReport = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      let res;
      if (tab === 'sales') res = await reportService.getSalesReport(dateRange);
      else if (tab === 'purchases') res = await reportService.getPurchaseReport(dateRange);
      else if (tab === 'inventory') res = await reportService.getInventoryReport();
      else if (tab === 'employees') res = await reportService.getEmployeeReport();
      else if (tab === 'expenses') res = await reportService.getExpenseReport(dateRange);
      setData(res.data);
    } catch (err) {
      showToast('Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab, dateRange, showToast]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const showDateFilter = ['sales', 'purchases', 'expenses'].includes(tab);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Business insights across all modules" />

      <div className="bg-white rounded-xl shadow-card border border-gray-100">
        <div className="flex flex-wrap border-b border-gray-100 px-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showDateFilter && (
          <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
            <input type="date" className={inputClass} value={dateRange.start_date} onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })} />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" className={inputClass} value={dateRange.end_date} onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })} />
            {(dateRange.start_date || dateRange.end_date) && (
              <button onClick={() => setDateRange({ start_date: '', end_date: '' })} className="text-sm text-gray-400 hover:text-gray-600">
                Clear
              </button>
            )}
          </div>
        )}

        <div className="p-5">
          {loading ? (
            <div className="py-16"><Spinner size={28} /></div>
          ) : !data ? (
            <EmptyState title="No data" />
          ) : tab === 'sales' ? (
            <SalesReport data={data} />
          ) : tab === 'purchases' ? (
            <PurchaseReport data={data} />
          ) : tab === 'inventory' ? (
            <InventoryReport data={data} />
          ) : tab === 'employees' ? (
            <EmployeeReport data={data} />
          ) : (
            <ExpenseReport data={data} />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function SalesReport({ data }) {
  if (!data.rows.length) return <EmptyState title="No sales in this range" />;
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-5">
        <SummaryCard label="Total Orders" value={data.summary.total_orders} />
        <SummaryCard label="Total Revenue" value={currency(data.summary.total_revenue)} />
      </div>
      <ReportTable
        headers={['Invoice No.', 'Customer', 'Date', 'Status', 'Amount']}
        rows={data.rows.map((r) => [r.invoice_no, r.customer_name || 'Walk-in', new Date(r.sale_date).toLocaleDateString(), r.status, currency(r.total_amount)])}
      />
    </div>
  );
}

function PurchaseReport({ data }) {
  if (!data.rows.length) return <EmptyState title="No purchases in this range" />;
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-5">
        <SummaryCard label="Total Orders" value={data.summary.total_orders} />
        <SummaryCard label="Total Spent" value={currency(data.summary.total_spent)} />
      </div>
      <ReportTable
        headers={['Purchase No.', 'Supplier', 'Date', 'Status', 'Amount']}
        rows={data.rows.map((r) => [r.purchase_no, r.supplier_name || '-', new Date(r.purchase_date).toLocaleDateString(), r.status, currency(r.total_amount)])}
      />
    </div>
  );
}

function InventoryReport({ data }) {
  if (!data.rows.length) return <EmptyState title="No products yet" />;
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryCard label="Total Products" value={data.summary.total_products} />
        <SummaryCard label="Total Stock Value" value={currency(data.summary.total_stock_value)} />
        <SummaryCard label="Low Stock Items" value={data.summary.low_stock_items} />
      </div>
      <ReportTable
        headers={['Product', 'SKU', 'Category', 'Stock', 'Price', 'Stock Value']}
        rows={data.rows.map((r) => [r.name, r.sku || '-', r.category_name || '-', r.stock_quantity, currency(r.price), currency(r.stock_value)])}
      />
    </div>
  );
}

function EmployeeReport({ data }) {
  if (!data.rows.length) return <EmptyState title="No employees yet" />;
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryCard label="Total Employees" value={data.summary.total_employees} />
        <SummaryCard label="Active" value={data.summary.active_count} />
        <SummaryCard label="Total Payroll" value={currency(data.summary.total_payroll)} />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-2">By Department</p>
      <ReportTable
        headers={['Department', 'Employees', 'Total Salary']}
        rows={data.byDepartment.map((r) => [r.department, r.count, currency(r.total_salary)])}
      />
      <p className="text-sm font-medium text-gray-700 mt-6 mb-2">All Employees</p>
      <ReportTable
        headers={['Name', 'Department', 'Position', 'Salary', 'Status']}
        rows={data.rows.map((r) => [r.name, r.department, r.position, currency(r.salary), r.status])}
      />
    </div>
  );
}

function ExpenseReport({ data }) {
  if (!data.rows.length) return <EmptyState title="No expenses in this range" />;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <SummaryCard label="Total Entries" value={data.summary.total_entries} />
        <SummaryCard label="Total Amount" value={currency(data.summary.total_amount)} />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-2">By Category</p>
      <ReportTable
        headers={['Category', 'Total']}
        rows={data.byCategory.map((r) => [r.category, currency(r.total)])}
      />
      <p className="text-sm font-medium text-gray-700 mt-6 mb-2">All Expenses</p>
      <ReportTable
        headers={['Title', 'Category', 'Amount', 'Date']}
        rows={data.rows.map((r) => [r.title, r.category, currency(r.amount), new Date(r.expense_date).toLocaleDateString()])}
      />
    </div>
  );
}

function ReportTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            {headers.map((h) => <th key={h} className="px-3 py-2 font-medium text-gray-500 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/60">
              {row.map((cell, j) => <td key={j} className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
