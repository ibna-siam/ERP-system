import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Building2 } from 'lucide-react';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { saleService } from '../services/saleService';
import { settingsService } from '../services/settingsService';
import { useToast } from '../context/ToastContext';

const statusColors = { completed: 'green', pending: 'yellow', cancelled: 'red' };

export default function SaleInvoice() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [saleRes, companyRes] = await Promise.all([
          saleService.getById(id),
          settingsService.getCompany(),
        ]);
        setSale(saleRes.data);
        setCompany(companyRes.data);
      } catch (err) {
        showToast('Failed to load invoice', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Spinner size={32} /></div>;
  }

  if (!sale) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => navigate('/sales')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back to Sales
        </button>
        <Button onClick={() => window.print()}><Printer size={16} /> Print Invoice</Button>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-8 max-w-3xl mx-auto print:shadow-none print:border-none">
        <div className="flex justify-between items-start pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 text-white rounded-lg p-2"><Building2 size={22} /></div>
            <div>
              <p className="font-semibold text-gray-800">{company?.company_name || 'Company Name'}</p>
              <p className="text-xs text-gray-500 max-w-xs">{company?.address}</p>
              <p className="text-xs text-gray-500">{company?.phone} {company?.email && `· ${company.email}`}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-800">INVOICE</h2>
            <p className="text-sm text-gray-500">{sale.invoice_no}</p>
            <div className="mt-1"><Badge color={statusColors[sale.status]}>{sale.status}</Badge></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Billed To</p>
            <p className="font-medium text-gray-800">{sale.customer_name || 'Walk-in Customer'}</p>
            {sale.customer_phone && <p className="text-sm text-gray-500">{sale.customer_phone}</p>}
            {sale.customer_address && <p className="text-sm text-gray-500">{sale.customer_address}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Sale Date</p>
            <p className="text-sm text-gray-700">{new Date(sale.sale_date).toLocaleDateString()}</p>
          </div>
        </div>

        <table className="w-full text-sm my-6">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <th className="py-2">Product</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 text-gray-700">{item.product_name}</td>
                <td className="py-2.5 text-right text-gray-600">{item.quantity} {item.unit}</td>
                <td className="py-2.5 text-right text-gray-600">৳{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-2.5 text-right text-gray-800 font-medium">৳{Number(item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56">
            <div className="flex justify-between py-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Total</span>
              <span className="text-lg font-bold text-gray-800">৳{Number(sale.total_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">Thank you for your business!</p>
      </div>
    </div>
  );
}
