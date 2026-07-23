import { NavLink } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import teacherIcon from '../../assets/teacher-icon.png';
import studentIcon from '../../assets/student-icon.png';
import adminIcon from '../../assets/admin-icon.png';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  LogOut, Shield, ChevronRight, Bell, Settings,
  BarChart3, UserCog, UserPlus, UserCircle, BookMarked
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

export function Sidebar() {
  const { user, logout } = useAuth();

  const adminLinks: NavItem[] = [
    { to: '/admin', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/admin/students', icon: GraduationCap, label: 'Sinh viên' },
    { to: '/admin/teachers', icon: Users, label: 'Giảng viên' },
    { to: '/admin/classes', icon: BookOpen, label: 'Lớp học' },
    { to: '/admin/enrollments', icon: UserPlus, label: 'Ghi danh' },
    { to: '/admin/curriculum', icon: BookMarked, label: 'Chương trình khung' },
    { to: '/admin/profile', icon: UserCircle, label: 'Hồ sơ cá nhân' },
  ];

  const teacherLinks: NavItem[] = [
    { to: '/teacher', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/teacher/classes', icon: BookOpen, label: 'Lớp học phần' },
    { to: '/teacher/advisor', icon: GraduationCap, label: 'Lớp cố vấn' },
    { to: '/teacher/profile', icon: UserCircle, label: 'Hồ sơ cá nhân' },
  ];

  const studentLinks: NavItem[] = [
    { to: '/student', icon: LayoutDashboard, label: 'Trang cá nhân' },
    { to: '/student/curriculum', icon: BookMarked, label: 'Chương trình đào tạo' },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'teacher' ? teacherLinks : studentLinks;

  const roleConfig = {
    admin: {
      label: 'Quản Trị Viên',
      color: 'from-red-500 to-rose-600',
      badge: 'bg-red-500/20 text-red-300 border-red-500/30',
      icon: Shield,
    },
    teacher: {
      label: 'Giảng Viên',
      color: 'from-blue-500 to-indigo-600',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: UserCog,
    },
    student: {
      label: 'Sinh Viên',
      color: 'from-emerald-500 to-teal-600',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: GraduationCap,
    },
  };

  const role = (user?.role as keyof typeof roleConfig) || 'student';
  const config = roleConfig[role] || roleConfig.student;
  const RoleIcon = config.icon;

  const avatarSrc = 
    user?.role === 'admin' 
      ? adminIcon 
      : user?.role === 'teacher' 
        ? teacherIcon 
        : studentIcon;

  return (
    <aside className="w-64 flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>

      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />
      
      {/* Background mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-16 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Logo Section */}
      <div className="relative p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <GraduationCap className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0f172a]" />
          </div>
          <div>
            <h1 className="font-black text-white text-lg tracking-tight leading-none">TVU CET</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1 tracking-wide">Quản lý Sinh viên</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="relative px-4 pt-4 pb-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${config.badge}`}
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <RoleIcon className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-black tracking-wider uppercase">{config.label}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        <p className="px-3 pt-2.5 pb-1 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Menu chính</p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/teacher' || link.to === '/student'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group overflow-hidden ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.15) 100%)',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }} />
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full" />
                )}
                <link.icon
                  className={`relative w-4.5 h-4.5 flex-shrink-0 transition-all duration-200 ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="relative text-sm font-medium flex-1">{link.label}</span>
                {link.badge && (
                  <span className="relative ml-auto text-[10px] font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-500/30">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="relative w-3.5 h-3.5 text-blue-400 opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile section */}
      <div className="relative p-3 border-t border-white/5" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-xl mb-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <img
              src={avatarSrc}
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-white"
              style={{ border: '2px solid rgba(59,130,246,0.4)' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all duration-200 text-sm font-bold group"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
            (e.currentTarget as HTMLElement).style.border = '1px solid rgba(239,68,68,0.2)';
            (e.currentTarget as HTMLElement).style.color = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.border = 'none';
            (e.currentTarget as HTMLElement).style.color = '';
          }}
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30" />
    </aside>
  );
}

export default Sidebar;
