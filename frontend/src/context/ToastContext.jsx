import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-fade-in flex items-start gap-2 rounded-lg shadow-card px-4 py-3 text-sm font-medium border
              ${toast.type === 'success' ? 'bg-white border-green-200 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-200 text-red-800' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-200 text-blue-800' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />}
            {toast.type === 'error' && <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />}
            {toast.type === 'info' && <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
