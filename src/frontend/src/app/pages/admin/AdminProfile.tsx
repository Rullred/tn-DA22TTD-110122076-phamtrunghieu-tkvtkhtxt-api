import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import {
  User, Mail, Shield, Settings, Key, Bell, Monitor,
  Lock, CheckCircle, LogOut, Edit, X, Save
} from 'lucide-react';
import { toast } from 'sonner';
import adminIcon from '../../../assets/admin-icon.png';

export function AdminProfile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'settings'>('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.name || 'Administrator',
    email: user?.email || '',
    phone: '',
    department: 'Ban Quản trị Hệ thống',
    position: 'Quản trị viên hệ thống',
    note: ''
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real system, this would call an API
    toast.success('Đã lưu thông tin thành công!');
    setShowEditModal(false);
  };

  const tabs = [
    { id: 'info', label: 'Thông tin cá nhân', icon: User },
    { id: 'security', label: 'Bảo mật & Quyền hạn', icon: Shield },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
  ] as const;

  return (
    <div className="page-container space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hồ sơ Quản trị viên</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Thông tin tài khoản và cài đặt hệ thống TVU CET</p>
          </div>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-md active:scale-95 transition-all"
        >
          <Edit className="w-4 h-4" />
          Chỉnh sửa thông tin
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 to-rose-600" />

            <div className="relative inline-block mt-2">
              <img
                src={adminIcon}
                alt="Admin Avatar"
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-red-50 dark:border-slate-800 object-cover shadow-sm bg-white"
              />
              <span className="absolute bottom-4 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Trực tuyến" />
            </div>

            <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {editForm.displayName}
            </h2>
            <p className="text-[11px] font-bold font-mono text-slate-500 mt-1 uppercase tracking-wider">
              ID: {user?.id?.slice(0, 8).toUpperCase()}...
            </p>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-3 bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Quản trị viên
            </span>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-left space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate text-blue-600 dark:text-blue-400 font-mono">{user?.email || editForm.email || 'admin@tvu.edu.vn'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{editForm.department}</span>
              </div>
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{editForm.position}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Thao tác nhanh</p>
            <button
              onClick={() => setActiveTab('security')}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
            >
              <Key className="w-4 h-4 text-amber-500" />
              Đổi mật khẩu
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
            >
              <Bell className="w-4 h-4 text-blue-500" />
              Cài đặt thông báo
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-3 space-y-4">

          {/* Tab Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-1.5 flex gap-1 shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {activeTab === 'info' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-red-600" />
                Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Tên hiển thị', value: editForm.displayName },
                  { label: 'Email tài khoản', value: user?.email || editForm.email || 'admin@tvu.edu.vn' },
                  { label: 'Vai trò hệ thống', value: 'Quản trị viên (ADMIN)' },
                  { label: 'Chức vụ', value: editForm.position },
                  { label: 'Bộ phận / Ban', value: editForm.department },
                  { label: 'Trạng thái', value: 'Hoạt động' },
                ].map(item => (
                  <div key={item.label} className="p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Security */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-red-600" />
                Bảo mật &amp; Phân quyền
              </h3>

              <div className="space-y-3">
                {[
                  { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Toàn quyền quản trị hệ thống', desc: 'Có thể truy cập và chỉnh sửa tất cả tài nguyên' },
                  { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Quản lý tài khoản người dùng', desc: 'Tạo, sửa, xóa sinh viên và giảng viên' },
                  { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Quản lý lớp học & ghi danh', desc: 'Tạo, phân công lớp, duyệt đăng ký' },
                  { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Quản lý bảo mật IP', desc: 'Chặn/mở chặn các địa chỉ IP nguy hiểm' },
                  { icon: Lock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Xác thực 2 yếu tố (2FA)', desc: 'Bảo vệ thêm bằng mã OTP khi đăng nhập' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 p-4 ${item.bg} dark:bg-slate-800/20 rounded-2xl`}>
                    <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                  <Key className="w-4 h-4" />
                  Đổi mật khẩu đăng nhập
                </button>
              </div>
            </div>
          )}

          {/* Tab: Settings */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4.5 h-4.5 text-red-600" />
                Cài đặt hệ thống
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Ngôn ngữ hiển thị', value: 'Tiếng Việt (vi-VN)', icon: Monitor },
                  { label: 'Múi giờ', value: 'Indochina Time (ICT +07:00)', icon: Settings },
                  { label: 'Thông báo email', value: 'Bật — Gửi khi có thay đổi quan trọng', icon: Bell },
                  { label: 'Phiên đăng nhập', value: 'Tự động đăng xuất sau 60 phút không hoạt động', icon: Lock },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.value}</p>
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-blue-600 hover:underline">Sửa</button>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <p className="text-xs font-extrabold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Vùng nguy hiểm
                </p>
                <p className="text-[11px] text-red-600/70 mb-3">Các hành động này không thể hoàn tác và ảnh hưởng toàn hệ thống.</p>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất khỏi tất cả thiết bị
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 text-slate-100 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">

            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0f172a]">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 uppercase tracking-wide">
                <Edit className="w-5 h-5 text-red-500" />
                Chỉnh sửa thông tin cá nhân
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tên hiển thị</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Chức vụ</label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Bộ phận / Ban</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all">
                  HỦY
                </button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold shadow-md transition-all">
                  <Save className="w-3.5 h-3.5" />
                  LƯU THAY ĐỔI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProfile;
