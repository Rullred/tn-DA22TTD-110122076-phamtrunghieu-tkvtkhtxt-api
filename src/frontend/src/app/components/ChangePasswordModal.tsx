import { useState } from 'react';
import { createPortal } from 'react-dom';
import { authService } from '../../services/authService';
import { Loader2, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal người dùng tự đổi mật khẩu (dùng chung cho mọi vai trò qua Navbar).
 * Gọi PUT /api/users/me/password; backend xác thực mật khẩu hiện tại.
 */
export function ChangePasswordModal({ open, onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState({ c: false, n: false, k: false });
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const reset = () => { setCurrent(''); setNext(''); setConfirm(''); setShow({ c: false, n: false, k: false }); };
  const close = () => { if (!busy) { reset(); onClose(); } };

  const submit = async () => {
    if (!current || !next || !confirm) { toast.error('Vui lòng nhập đầy đủ các ô.'); return; }
    if (next.length < 8) { toast.error('Mật khẩu mới phải từ 8 ký tự.'); return; }
    if (next !== confirm) { toast.error('Mật khẩu xác nhận không khớp.'); return; }
    if (next === current) { toast.error('Mật khẩu mới phải khác mật khẩu hiện tại.'); return; }
    setBusy(true);
    try {
      await authService.changePassword({ currentPassword: current, newPassword: next, confirmPassword: confirm });
      toast.success('Đổi mật khẩu thành công!');
      reset();
      onClose();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Đổi mật khẩu thất bại.';
      toast.error(msg.includes('Current password') ? 'Mật khẩu hiện tại không đúng.' : msg);
    } finally {
      setBusy(false);
    }
  };

  const field = (
    label: string, value: string, set: (v: string) => void,
    shownKey: 'c' | 'n' | 'k', placeholder: string,
  ) => (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <div className="relative mt-1">
        <input
          type={show[shownKey] ? 'text' : 'password'}
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none"
        />
        <button type="button" onClick={() => setShow(s => ({ ...s, [shownKey]: !s[shownKey] }))}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show[shownKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/40 p-4 py-6 overflow-y-auto" onClick={close}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" /> Đổi mật khẩu
          </h3>
          <button onClick={close} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          {field('Mật khẩu hiện tại', current, setCurrent, 'c', 'Nhập mật khẩu đang dùng')}
          {field('Mật khẩu mới', next, setNext, 'n', 'Tối thiểu 8 ký tự')}
          {field('Xác nhận mật khẩu mới', confirm, setConfirm, 'k', 'Nhập lại mật khẩu mới')}
        </div>

        <p className="text-[11px] text-slate-400 mt-3">Mật khẩu mới nên gồm chữ hoa, chữ thường, số và ký tự đặc biệt để an toàn hơn.</p>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={close} disabled={busy} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50">Hủy</button>
          <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ChangePasswordModal;
