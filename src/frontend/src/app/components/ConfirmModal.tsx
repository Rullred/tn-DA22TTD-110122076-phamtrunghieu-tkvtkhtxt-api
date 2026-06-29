import { AlertTriangle, X, Trash2, Ban } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  icon?: 'trash' | 'ban' | 'alert';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  icon = 'trash',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!open) return null;

  const iconColors = {
    danger: 'text-rose-600 bg-rose-100',
    warning: 'text-amber-600 bg-amber-100'
  };

  const btnColors = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
  };

  const IconComp = icon === 'trash' ? Trash2 : icon === 'ban' ? Ban : AlertTriangle;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-[fadeInScale_0.2s_ease-out]"
          style={{ animation: 'fadeInUp 0.18s ease-out' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconColors[variant]}`}>
                <IconComp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">{title}</h2>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors -mr-1 -mt-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 pb-6">
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>

            {/* Divider */}
            <div className="border-t border-slate-100 my-5" />

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95 ${btnColors[variant]}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
