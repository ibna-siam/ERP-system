import { useState, useRef, useEffect } from 'react';
import { Menu, PanelLeftClose, PanelLeft, ChevronDown, LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick, onCollapseClick, collapsed }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700">
          <Menu size={22} />
        </button>
        <button onClick={onCollapseClick} className="hidden lg:block text-gray-500 hover:text-gray-700">
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition"
        >
          <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
            {initials || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize leading-tight">{user?.role}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-fade-in">
            <button
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <User size={16} /> Profile
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <SettingsIcon size={16} /> Settings
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
