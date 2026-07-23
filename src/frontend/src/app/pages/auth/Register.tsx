import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../../services/studentService';
import { GraduationCap, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student', // Đăng ký công khai chỉ tạo tài khoản Sinh viên
    major: 'TT',
    // Hồ sơ sinh viên (tạo cùng lúc để tài khoản có đầy đủ hồ sơ)
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '2004-01-01',
    gender: 'NAM',
    address: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const lastSubmitTime = useRef<number>(0);

  // TVU CET Majors
  const tvuMajors = [
    { code: 'TT', name: 'Công nghệ thông tin' },
    { code: 'TT_EIP', name: 'Công nghệ thông tin - CT liên kết' },
    { code: 'TTNT', name: 'Trí tuệ nhân tạo' },
    { code: 'KTMT', name: 'Kỹ thuật máy tính' },
    { code: 'KD', name: 'Khoa học dữ liệu' },
    { code: 'XD', name: 'Kỹ thuật Xây dựng' },
    { code: 'XDGT', name: 'Xây dựng Công trình Giao thông' },
    { code: 'CNOT', name: 'Công nghệ kỹ thuật Ô tô' },
    { code: 'CDT', name: 'Công nghệ kỹ thuật Cơ điện tử' },
    { code: 'CK', name: 'Công nghệ kỹ thuật Cơ khí' },
    { code: 'DT', name: 'Công nghệ kỹ thuật Điện, Điện tử' },
    { code: 'HH', name: 'Công nghệ kỹ thuật Hóa học' },
    { code: 'QLTN', name: 'Quản lý tài nguyên và môi trường' },
  ];

  // Password rules
  const rules = {
    length: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);
  const doPasswordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Anti-spam click check (0.5s limit)
    const now = Date.now();
    if (now - lastSubmitTime.current < 500) {
      toast.warning('Thao tác quá nhanh! Vui lòng không click liên tục.');
      return;
    }
    lastSubmitTime.current = now;

    setError('');

    if (!isPasswordValid) {
      setError('Mật khẩu không đủ mạnh. Vui lòng kiểm tra lại các yêu cầu.');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      setError('Số điện thoại phải gồm đúng 10 chữ số.');
      return;
    }

    setLoading(true);
    try {
      // Tài khoản tự đăng ký luôn là Sinh viên (backend cũng ép STUDENT nếu không phải admin)
      await register(
        formData.username,
        formData.email,
        formData.password,
        'student'
      );

      // Tạo hồ sơ sinh viên cho tài khoản vừa đăng ký để trang sinh viên có dữ liệu
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u.role === 'student') {
          try {
            await studentService.create({
              userId: u.id,
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              email: formData.email,
              phoneNumber: formData.phoneNumber,
              dateOfBirth: formData.dateOfBirth,
              gender: formData.gender,
              address: formData.address.trim() || 'Chưa cập nhật',
              enrollmentDate: new Date().toISOString().split('T')[0],
              major: tvuMajors.find(m => m.code === formData.major)?.name,
            });
          } catch (profileErr) {
            console.error('Tạo hồ sơ sinh viên thất bại:', profileErr);
            toast.warning('Tài khoản đã tạo nhưng chưa tạo được hồ sơ sinh viên. Vui lòng liên hệ quản trị viên.');
          }
        }
        toast.success('Đăng ký tài khoản thành công!');
        navigate(`/${u.role}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Đăng ký tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-lg z-10 my-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-3 shadow-xl border border-blue-400/30">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">ĐẠI HỌC TRÀ VINH</h2>
          <p className="text-amber-400 font-semibold text-[10px] tracking-widest uppercase mt-0.5">
            KHOA KỸ THUẬT VÀ CÔNG NGHỆ (CET)
          </p>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tạo tài khoản mới</h3>
            <p className="text-xs text-slate-500 mt-1">Đăng ký tham gia hệ thống quản lý học tập</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.trim() })}
                  className="w-full px-4 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium"
                  placeholder="Ví dụ: nguyenvana"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                  className="w-full px-4 py-2 border border-slate-355 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium"
                  placeholder="name@tvu.edu.vn"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Vai trò
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled
                  className="w-full px-4 py-2 border border-slate-360 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium cursor-not-allowed"
                  title="Đăng ký công khai chỉ dành cho Sinh viên. Tài khoản Giáo viên do quản trị viên tạo."
                >
                  <option value="student">Sinh viên</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Ngành học TVU CET
                  </label>
                  <select
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-365 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium"
                  >
                    {tvuMajors.map((major) => (
                      <option key={major.code} value={major.code}>
                        {major.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Thông tin hồ sơ sinh viên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Họ và tên đệm</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium"
                  placeholder="VD: Nguyễn Văn"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Tên</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium"
                  placeholder="VD: An"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-4 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium"
                  placeholder="10 chữ số"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Ngày sinh</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium cursor-pointer"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium cursor-pointer"
                >
                  <option value="NAM">Nam</option>
                  <option value="NU">Nữ</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Địa chỉ <span className="text-slate-400 normal-case font-medium">(tùy chọn)</span></label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-slate-350 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium"
                placeholder="VD: Trà Vinh, Việt Nam"
              />
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-370 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium pr-10"
                  placeholder="Tạo mật khẩu mạnh"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength checklist */}
              {formData.password && (
                <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-200/50 dark:border-slate-800/50 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {rules.length ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={rules.length ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-slate-500'}>Tối thiểu 8 ký tự</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rules.hasUpper ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={rules.hasUpper ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-slate-500'}>Có chữ in hoa (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rules.hasLower ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={rules.hasLower ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-slate-500'}>Có chữ thường (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rules.hasNumber ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={rules.hasNumber ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-slate-500'}>Có chữ số (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    {rules.hasSpecial ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={rules.hasSpecial ? 'text-green-700 dark:text-green-400 font-semibold' : 'text-slate-500'}>Có ký tự đặc biệt (@, #, $, %, ...)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-375 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs font-medium pr-10"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`text-[10px] font-bold mt-1.5 ${doPasswordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {doPasswordsMatch ? '✓ Mật khẩu khớp' : '✗ Mật khẩu chưa khớp'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !doPasswordsMatch}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3 rounded-xl transition-all shadow-md font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Đang tạo tài khoản...' : 'TẠO TÀI KHOẢN'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Brand footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400 font-medium">
            © 2026 Trường Kỹ thuật và Công nghệ - Đại học Trà Vinh
          </p>
        </div>
      </div>
    </div>
  );
}
