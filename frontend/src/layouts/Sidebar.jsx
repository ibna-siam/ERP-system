import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Truck,
  Package,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Receipt,
  BarChart3,
  Settings,
  X,
  Building2,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/customers', label: 'Customers', icon: UserSquare2 },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/purchases', label: 'Purchases', icon: ClipboardList },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose, collapsed }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-gray-900/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-100 z-40 transition-all duration-200 flex flex-col
          ${collapsed ? 'w-20' : 'w-64'}
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="bg-primary-600 text-white rounded-lg p-1.5 shrink-0">
              <Building2 size={20} />
            </div>
            {!collapsed && <span className="font-semibold text-gray-800 whitespace-nowrap">Nexus ERP</span>}
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}
                ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
            ERP System v1.0 &middot; Student Project
          </div>
        )}
      </aside>
    </>
  );
}
