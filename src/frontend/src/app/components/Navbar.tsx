import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Bell, Search, Menu, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import adminIcon from '../../assets/admin-icon.png';
import teacherIcon from '../../assets/teacher-icon.png';
import studentIcon from '../../assets/student-icon.png';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel = {
    admin: 'Quản trị viên',
    teacher: 'Giảng viên',
    student: 'Sinh viên',
  }[user?.role || 'student'] || 'Người dùng';

  const roleBadgeStyle = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    teacher: 'bg-blue-100 text-blue-700 border-blue-200',
    student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }[user?.role || 'student'];

  const avatarSrc = 
    user?.role === 'admin' 
      ? adminIcon 
      : user?.role === 'teacher' 
        ? teacherIcon 
        : studentIcon;

  return (
    <header className="h-16 flex items-center px-6 gap-4 relative z-30"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px -4px rgba(0,0,0,0.04)',
      }}>

      {/* Date + Time */}
      <div className="hidden md:flex flex-col items-start mr-2">
        <span className="text-xs font-semibold text-slate-700 leading-none">{timeStr}</span>
        <span className="text-[10px] text-slate-400 mt-0.5 capitalize">{dateStr}</span>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-sm relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-700"
            style={{
              background: 'rgba(241,245,249,0.8)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.border = '1px solid rgba(59,130,246,0.4)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'rgba(241,245,249,0.8)';
              e.currentTarget.style.border = '1px solid rgba(0,0,0,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification Bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
          title="Thông báo"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-all duration-150 group"
            style={{ border: '1px solid transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.border = '1px solid rgba(0,0,0,0.06)')}
            onMouseLeave={(e) => { if (!dropdownOpen) e.currentTarget.style.border = '1px solid transparent'; }}
          >
            <img
              src={avatarSrc}
              alt={user?.name}
              className="w-8 h-8 rounded-lg object-cover bg-white"
              style={{ border: '2px solid rgba(59,130,246,0.3)' }}
            />
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-semibold text-slate-800 leading-none max-w-[120px] truncate">{user?.name}</span>
              <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-px rounded-full border ${roleBadgeStyle}`}>
                {roleLabel}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 8px 32px -8px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)',
                animation: 'fadeInDown 0.15s ease',
              }}
            >
              {/* User info header */}
              <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    if (user?.role === 'teacher') navigate('/teacher/profile');
                    else if (user?.role === 'student') navigate('/student');
                    else if (user?.role === 'admin') navigate('/admin/profile');
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Hồ sơ cá nhân
                </button>
                <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors text-left">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Cài đặt
                </button>
              </div>

              <div className="p-1.5 pt-0 border-t border-slate-100 mt-1">
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}

export default Navbar;
