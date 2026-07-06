import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  danger = true,
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        <div className={`shrink-0 rounded-full p-2 h-fit ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
          <AlertTriangle size={20} className={danger ? 'text-red-600' : 'text-blue-600'} />
        </div>
        <p className="text-sm text-gray-600 pt-1">{message}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition disabled:opacity-60
            ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}
        >
          {loading ? 'Please wait...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
