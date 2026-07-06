import { useEffect, useState } from 'react';
import {
  Users,
  UserSquare2,
  Truck,
  Package,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import { dashboardService } from '../services/dashboardService';

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [revenueVsExpense, setRevenueVsExpense] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryRes, salesRes, revExpRes, activityRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getMonthlySales(),
          dashboardService.getRevenueVsExpense(),
          dashboardService.getRecentActivities(),
        ]);
        setSummary(summaryRes.data);
        setMonthlySales(salesRes.data);
        setRevenueVsExpense(revExpRes.data);
        setActivities(activityRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const monthLabel = (m) => {
    const [, month] = m.split('-');
    return new Date(2000, Number(month) - 1).toLocaleString('default', { month: 'short' });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your business performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Employees" value={summary.totalEmployees} icon={Users} color="blue" />
        <StatCard title="Total Customers" value={summary.totalCustomers} icon={UserSquare2} color="green" />
        <StatCard title="Total Suppliers" value={summary.totalSuppliers} icon={Truck} color="purple" />
        <StatCard title="Total Products" value={summary.totalProducts} icon={Package} color="orange" />
        <StatCard title="Total Sales" value={summary.totalSales} icon={ShoppingCart} color="blue" />
        <StatCard title="Total Purchases" value={summary.totalPurchases} icon={ClipboardList} color="purple" />
        <StatCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon={DollarSign} color="green" />
        <StatCard title="Total Expenses" value={formatCurrency(summary.totalExpenses)} icon={TrendingDown} color="red" />
      </div>

      {/* Low stock alert banner */}
      {summary.lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{summary.lowStockCount} product{summary.lowStockCount > 1 ? 's' : ''}</span> running
            low on stock. Check the Products page to restock.
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Sales</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={monthLabel} />
              <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueVsExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={monthLabel} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Activities</h3>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No recent activity yet.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {activities.map((act) => (
              <li key={act.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Badge color={
                    act.type === 'sale' ? 'green' :
                    act.type === 'purchase' ? 'blue' :
                    act.type === 'expense' ? 'red' :
                    act.type === 'inventory' ? 'yellow' : 'gray'
                  }>
                    {act.type}
                  </Badge>
                  <p className="text-sm text-gray-700">{act.message}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-3">{timeAgo(act.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
