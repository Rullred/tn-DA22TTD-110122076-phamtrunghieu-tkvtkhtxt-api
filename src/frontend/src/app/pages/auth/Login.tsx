import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, AlertCircle, Clock, Sparkles, CheckCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockInfo, setLockInfo] = useState<{
    isLocked: boolean;
    remainingTime: number;
    attempts?: string;
  }>({ isLocked: false, remainingTime: 0 });

  const { login } = useAuth();
  const navigate = useNavigate();
  const lastSubmitTime = useRef<number>(0);

  // Actual client IP configuration (Retained in background for security logic, removed from UI)
  const [clientIp, setClientIp] = useState(localStorage.getItem('clientIp') || '127.0.0.1');

  useEffect(() => {
    async function fetchRealIp() {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
          const data = await response.json();
          if (data && data.ip) {
            setClientIp(data.ip);
            localStorage.setItem('clientIp', data.ip);
            console.log('Real client IP detected:', data.ip);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch real IP, falling back to local IP', err);
      }
      
      // Fallback if network/API fails
      if (!localStorage.getItem('clientIp')) {
        localStorage.setItem('clientIp', '127.0.0.1');
      }
    }
    fetchRealIp();
  }, []);

  // Countdown timer for locked state
  useEffect(() => {
    if (lockInfo.isLocked && lockInfo.remainingTime > 0) {
      const timer = setInterval(() => {
        setLockInfo((prev) => {
          if (prev.remainingTime <= 1) {
            clearInterval(timer);
            return { ...prev, isLocked: false, remainingTime: 0 };
          }
          return { ...prev, remainingTime: prev.remainingTime - 1 };
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockInfo.isLocked, lockInfo.remainingTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Anti-spam click check (0.5s limit)
    const now = Date.now();
    if (now - lastSubmitTime.current < 500) {
      toast.warning('Thao tác quá nhanh! Vui lòng không click liên tục.');
      return;
    }
    lastSubmitTime.current = now;

    setLoading(true);
    setError('');
    
    try {
      await login(usernameOrEmail, password);
      toast.success('Đăng nhập thành công!');
      // Redirection is handled in AuthContext, but as a fallback:
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        navigate(`/${u.role}`);
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setError(errorMessage);

      // Parse lockout time (e.g., "khóa... 30 giây")
      if (errorMessage.includes('khóa') || err.response?.status === 423) {
        const timeMatch = errorMessage.match(/(\d+)\s*giây/);
        const lockTime = timeMatch ? parseInt(timeMatch[1]) : 30; // fallback to 30s
        setLockInfo({
          isLocked: true,
          remainingTime: lockTime,
        });
      }

      // Parse attempt counts (e.g., "(5/20)")
      const attemptsMatch = errorMessage.match(/\((\d+\/20)\)/);
      if (attemptsMatch) {
        setLockInfo(prev => ({
          ...prev,
          attempts: attemptsMatch[1],
        }));
      }

      // Show special warnings as notifications
      if (errorMessage.includes('CẢNH BÁO') || errorMessage.includes('bị chặn vĩnh viễn')) {
        toast.error(errorMessage, { duration: 8000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* BRANDING PANEL - Left column (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 flex-col justify-between p-12 text-white border-r border-white/5">
        
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/5 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg">
            <GraduationCap className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wide">ĐẠI HỌC TRÀ VINH</h1>
            <p className="text-[9px] text-amber-400/90 font-extrabold tracking-widest uppercase">KHOA KỸ THUẬT & CÔNG NGHỆ (CET)</p>
          </div>
        </div>

        {/* Main hero area */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/25 text-[11px] text-blue-300 font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            CỔNG THÔNG TIN TÍCH HỢP CET SMARTPORTAL
          </div>
          
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Quản lý học tập vụ <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-300">
              Thông minh & Bảo mật
            </span>
          </h2>
          
          <p className="text-slate-300 text-sm leading-relaxed font-medium">
            Hệ thống cung cấp trải nghiệm kết nối thông suốt giữa nhà trường, giảng viên và sinh viên. Quản lý toàn diện hồ sơ học lực, chuyên cần, và kết quả rèn luyện trên nền tảng an toàn đa tầng.
          </p>
          
          {/* Key pillars */}
          <div className="space-y-3 pt-6 border-t border-white/10">
            {[
              'Đăng nhập bảo mật đa tầng với IAM Guard',
              'Quản lý hồ sơ rèn luyện, điểm số học phần',
              'Cổng tự phục vụ học tập thông minh cho Sinh viên',
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 text-slate-350 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 font-semibold tracking-wide">
          © {new Date().getFullYear()} Trường Kỹ thuật và Công nghệ - ĐH Trà Vinh. Bảo lưu mọi quyền.
        </div>
      </div>

      {/* LOGIN FORM PANEL - Right column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-950 relative">
        
        {/* Glow ambient background for mobile view */}
        <div className="lg:hidden absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="lg:hidden absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[420px] z-10">
          
          {/* Brand header for mobile only */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg border border-blue-400/20 mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">ĐẠI HỌC TRÀ VINH</h1>
            <p className="text-[10px] text-amber-500 dark:text-amber-400 font-extrabold tracking-wider uppercase mt-1">KHOA KỸ THUẬT & CÔNG NGHỆ (CET)</p>
          </div>

          {/* Form wrapper */}
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 space-y-6">
            
            <div className="space-y-1.5 text-center lg:text-left">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Chào mừng trở lại</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Đăng nhập vào cổng thông tin tích hợp của bạn</p>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-450 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-350 leading-relaxed">{error}</p>
                  {lockInfo.attempts && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold bg-rose-100/70 dark:bg-rose-900/40 text-rose-700 dark:text-rose-350 px-2 py-0.5 rounded-full">
                      Lần thử thứ: {lockInfo.attempts}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Lock countdown alerting */}
            {lockInfo.isLocked && lockInfo.remainingTime > 0 && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-450 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-350">
                    Tài khoản đang tạm thời bị khóa!
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-normal">
                    Vui lòng đợi thêm <span className="font-extrabold text-sm text-amber-700 dark:text-amber-350">{lockInfo.remainingTime}s</span> trước khi thử lại.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-650 dark:text-slate-350 uppercase tracking-wider">
                  Tên đăng nhập hoặc Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Nhập tên đăng nhập hoặc email"
                    required
                    disabled={loading || (lockInfo.isLocked && lockInfo.remainingTime > 0)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-650 dark:text-slate-350 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-white transition-all text-sm font-medium"
                    placeholder="Nhập mật khẩu truy cập"
                    required
                    disabled={loading || (lockInfo.isLocked && lockInfo.remainingTime > 0)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Extras checkbox & links */}
              <div className="flex items-center justify-between pt-1.5">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500/35 cursor-pointer"
                    disabled={loading || (lockInfo.isLocked && lockInfo.remainingTime > 0)}
                  />
                  <span className="ml-2 text-xs text-slate-600 dark:text-slate-450 font-semibold">Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-650 dark:text-blue-400 font-bold hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (lockInfo.isLocked && lockInfo.remainingTime > 0)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl transition-all duration-300 shadow-md font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ĐANG XÁC THỰC...
                  </>
                ) : (
                  'ĐĂNG NHẬP'
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-450 font-medium">
                Chưa có tài khoản đăng ký?{' '}
                <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-extrabold">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Footer for mobile only */}
          <div className="lg:hidden text-center text-xs text-slate-450 font-semibold mt-8">
            © {new Date().getFullYear()} Trường Kỹ thuật và Công nghệ - ĐH Trà Vinh
          </div>

        </div>
      </div>
    </div>
  );
}
