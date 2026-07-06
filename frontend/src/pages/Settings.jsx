import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Lock, LogOut } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';
import { settingsService } from '../services/settingsService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition';

export default function Settings() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('company');

  // Company settings
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    async function loadCompany() {
      try {
        const { data } = await settingsService.getCompany();
        setCompany(data);
      } catch (err) {
        showToast('Failed to load company settings', 'error');
      } finally {
        setCompanyLoading(false);
      }
    }
    loadCompany();
  }, [showToast]);

  async function handleCompanySubmit(e) {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await settingsService.updateCompany(company);
      showToast('Company settings updated', 'success');
    } catch (err) {
      showToast('Failed to update company settings', 'error');
    } finally {
      setSavingCompany(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showToast('Password updated successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const tabs = [
    { key: 'company', label: 'Company Info', icon: Building2 },
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Change Password', icon: Lock },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your company and account settings" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar tabs */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-2 h-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-1 last:mb-0 ${
                tab === t.key ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition mt-2 border-t border-gray-100 pt-3"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-card border border-gray-100 p-6">
          {tab === 'company' && (
            companyLoading ? (
              <div className="py-16"><Spinner size={28} /></div>
            ) : (
              <form onSubmit={handleCompanySubmit} className="max-w-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Company Information</h3>
                <FormField label="Company Name">
                  <input className={inputClass} value={company?.company_name || ''} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} />
                </FormField>
                <FormField label="Address">
                  <textarea rows={2} className={inputClass} value={company?.address || ''} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
                </FormField>
                <div className="grid grid-cols-2 gap-x-4">
                  <FormField label="Phone">
                    <input className={inputClass} value={company?.phone || ''} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
                  </FormField>
                  <FormField label="Email">
                    <input type="email" className={inputClass} value={company?.email || ''} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
                  </FormField>
                </div>
                <Button type="submit" disabled={savingCompany} className="mt-2">
                  {savingCompany ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            )
          )}

          {tab === 'profile' && (
            <div className="max-w-lg">
              <h3 className="font-semibold text-gray-800 mb-4">Profile</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-semibold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{user?.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              <FormField label="Email">
                <input className={inputClass} value={user?.email || ''} disabled />
              </FormField>
              <p className="text-xs text-gray-400">Profile editing is not available in this demo build.</p>
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="max-w-md">
              <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
              <FormField label="Current Password" required>
                <input type="password" className={inputClass} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
              </FormField>
              <FormField label="New Password" required>
                <input type="password" className={inputClass} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} />
              </FormField>
              <FormField label="Confirm New Password" required>
                <input type="password" className={inputClass} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required minLength={6} />
              </FormField>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
