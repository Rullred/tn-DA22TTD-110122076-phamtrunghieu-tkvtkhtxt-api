import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { teacherService, TeacherDto } from '../../../services/teacherService';
import { authService } from '../../../services/authService';
import { classService, ClassDto } from '../../../services/classService';
import { Search, Plus, Edit, Trash2, Users, AlertCircle, X, UserPlus, RefreshCw, Briefcase, Mail, Phone, MapPin, Calendar, Award, User, Lock, ShieldCheck, Eye } from 'lucide-react';
import { toast } from 'sonner';

// Default teacher icon as fallback
const teacherIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xOSAyMXYtMmE0IDQgMCAwIDAtNC00SDlhNCA0IDAgMCAwLTQgNHYyIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+PC9zdmc+';

export function Teachers() {
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(20);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherDto | null>(null);
  
  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({
    username: '',
    password: 'Password@123',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '1985-01-01',
    gender: 'MALE',
    address: 'Trà Vinh, Việt Nam',
    department: 'Công nghệ thông tin',
    specialization: 'Kỹ thuật phần mềm',
    hireDate: new Date().toISOString().split('T')[0],
    academicTitle: 'ThS.',
    position: 'Giảng viên',
    extensionNumber: '123'
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    department: '',
    specialization: '',
    status: 'HOAT_DONG',
    academicTitle: 'ThS.',
    position: 'Giảng viên',
    extensionNumber: '123'
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch teachers with pagination
        const teachersPage = await teacherService.getAll(currentPage, pageSize);
        setTeachers(teachersPage.content || []);
        setTotalPages(teachersPage.totalPages || 0);

        // Fetch classes to map classes taught
        const classesPage = await classService.getAll(0, 100);
        setClasses(classesPage.content || []);
      } catch (err) {
        console.error("Error loading teachers", err);
        toast.error("Không thể tải danh sách giảng viên từ máy chủ.");
        setTeachers([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshTrigger, currentPage, pageSize]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) {
          setShowAddModal(false);
          setAvatarFile(null);
          setAvatarPreview(null);
        }
        if (showEditModal) {
          setShowEditModal(false);
          setAvatarFile(null);
          setAvatarPreview(null);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAddModal, showEditModal]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!addForm.username || addForm.username.length < 3) {
        toast.error("Tên đăng nhập phải có ít nhất 3 ký tự!");
        setLoading(false);
        return;
      }

      if (!addForm.email.includes('@')) {
        toast.error("Email không hợp lệ!");
        setLoading(false);
        return;
      }

      if (addForm.password.length < 8) {
        toast.error("Mật khẩu phải có ít nhất 8 ký tự!");
        setLoading(false);
        return;
      }

      if (!/^[0-9]{10}$/.test(addForm.phoneNumber)) {
        toast.error("Số điện thoại phải đúng 10 chữ số (ví dụ: 0901234567)!");
        setLoading(false);
        return;
      }

      // Step 1: Register User Account in IAM Service
      toast.info("Đang tạo tài khoản giảng viên IAM...");
      const registerRes = await authService.register({
        username: addForm.username,
        email: addForm.email,
        password: addForm.password,
        role: 'TEACHER'
      });

      const userId = registerRes.user.id;

      // Step 2: Create Teacher Profile in HR Service
       toast.info("Đang tạo hồ sơ lý lịch giảng viên HR...");
      const newTeacher = await teacherService.create({
        userId,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        phoneNumber: addForm.phoneNumber,
        dateOfBirth: addForm.dateOfBirth,
        gender: addForm.gender,
        address: addForm.address,
        department: addForm.department,
        specialization: addForm.specialization,
        hireDate: addForm.hireDate
      });

      // Save metadata to localStorage
      const metadata = {
        academicTitle: addForm.academicTitle,
        position: addForm.position,
        extensionNumber: addForm.extensionNumber
      };
      localStorage.setItem(`teacher_meta_${newTeacher.id}`, JSON.stringify(metadata));

      // Step 3: Upload avatar if file selected
      if (avatarFile && newTeacher.id) {
        toast.info("Đang tải lên ảnh đại diện...");
        try {
          await teacherService.uploadAvatar(newTeacher.id, avatarFile);
        } catch (err) {
          console.warn("Avatar upload failed", err);
          toast.warning("Tạo giảng viên thành công nhưng không thể tải ảnh đại diện.");
        }
      }

      toast.success("Thêm mới giảng viên thành công!");
      setShowAddModal(false);
      
      // Reset form and avatar
      setAddForm({
        username: '',
        password: 'Password@123',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '1985-01-01',
        gender: 'MALE',
        address: 'Trà Vinh, Việt Nam',
        department: 'Công nghệ thông tin',
        specialization: 'Kỹ thuật phần mềm',
        hireDate: new Date().toISOString().split('T')[0],
        academicTitle: 'ThS.',
        position: 'Giảng viên',
        extensionNumber: '123'
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Tạo giảng viên thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giảng viên này?")) return;
    try {
      await teacherService.delete(id);
      toast.success("Đã xóa giảng viên thành công.");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toast.error("Không thể xóa giảng viên.");
    }
  };

  const handleEditClick = (teacher: TeacherDto) => {
    setEditingTeacher(teacher);
    const metaStr = localStorage.getItem(`teacher_meta_${teacher.id}`);
    const meta = metaStr ? JSON.parse(metaStr) : {
      academicTitle: 'ThS.',
      position: 'Giảng viên',
      extensionNumber: '123'
    };
    setEditForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber,
      dateOfBirth: teacher.dateOfBirth,
      gender: teacher.gender,
      address: teacher.address,
      department: teacher.department,
      specialization: teacher.specialization || '',
      status: teacher.status,
      academicTitle: meta.academicTitle || 'ThS.',
      position: meta.position || 'Giảng viên',
      extensionNumber: meta.extensionNumber || '123'
    });
    setAvatarPreview(teacher.avatarUrl);
    setAvatarFile(null);
    setShowEditModal(true);
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    if (!/^[0-9]{10}$/.test(editForm.phoneNumber)) {
      toast.error("Số điện thoại phải đúng 10 chữ số (ví dụ: 0901234567)!");
      return;
    }

    setLoading(true);
    try {
      await teacherService.update(editingTeacher.id, editForm);

      // Save metadata to localStorage
      const metadata = {
        academicTitle: editForm.academicTitle,
        position: editForm.position,
        extensionNumber: editForm.extensionNumber
      };
      localStorage.setItem(`teacher_meta_${editingTeacher.id}`, JSON.stringify(metadata));

      // Upload new avatar if file selected
      if (avatarFile) {
        toast.info("Đang cập nhật ảnh đại diện...");
        try {
          await teacherService.uploadAvatar(editingTeacher.id, avatarFile);
        } catch (err) {
          console.warn("Avatar upload failed", err);
          toast.warning("Cập nhật thông tin thành công nhưng không thể tải ảnh đại diện.");
        }
      }

      toast.success("Cập nhật thông tin giảng viên thành công!");
      setShowEditModal(false);
      setEditingTeacher(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Vui lòng chọn file ảnh!");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB!");
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.lastName} ${teacher.firstName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           teacher.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
           teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="page-container space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Briefcase className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-955 dark:text-white tracking-tight">Quản lý Giảng viên</h1>
            <p className="text-xs text-slate-500 font-medium">Hồ sơ giảng dạy & Cán bộ đào tạo khoa TVU CET</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm active:scale-95 transition-all"
            title="Làm mới danh sách"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 shadow-md active:scale-95 transition-transform duration-250 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Thêm giảng viên mới
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        
        {/* Search */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/10">
          <div className="relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên giảng viên, mã số hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-xs font-semibold text-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Teachers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/10 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="py-4 px-5">Ảnh</th>
                <th className="py-4 px-5">Mã GV</th>
                <th className="py-4 px-5">Họ tên</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">Bộ môn</th>
                <th className="py-4 px-5">Chuyên ngành</th>
                <th className="py-4 px-5">Trạng thái</th>
                <th className="py-4 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-xs font-semibold text-slate-700 dark:text-slate-350">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                  <td className="py-3 px-5">
                    <img
                      src={teacher.avatarUrl || teacherIcon}
                      alt={teacher.lastName}
                      className="w-9 h-9 rounded-full border border-slate-200/60 object-cover flex-shrink-0 bg-white"
                      onError={(e) => {
                        // Fallback to default icon if image fails to load
                        (e.target as HTMLImageElement).src = teacherIcon;
                      }}
                    />
                  </td>
                  <td className="py-3 px-5 font-mono font-bold text-slate-900 dark:text-slate-250">{teacher.teacherCode}</td>
                  <td className="py-3 px-5 font-bold text-slate-900 dark:text-white">{teacher.lastName} {teacher.firstName}</td>
                  <td className="py-3 px-5 text-slate-600 dark:text-slate-400 font-medium">{teacher.email}</td>
                  <td className="py-3 px-5 text-slate-700 dark:text-slate-300 font-bold">{teacher.department}</td>
                  <td className="py-3 px-5 text-slate-550 dark:text-slate-450 font-medium">{teacher.specialization || 'N/A'}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      teacher.status === 'ACTIVE' || teacher.status === 'HOAT_DONG'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'ACTIVE' || teacher.status === 'HOAT_DONG' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {teacher.status === 'ACTIVE' || teacher.status === 'HOAT_DONG' ? 'Đang dạy' : 'Nghỉ việc'}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/teachers/${teacher.id}`}
                        className="p-2 text-indigo-650 hover:bg-[#e0e7ff]/30 dark:hover:bg-[#1e1b4b]/30 rounded-xl transition-all"
                        title="Xem chi tiết giảng viên"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleEditClick(teacher)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                        title="Xóa giảng viên"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTeachers.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold text-sm">Không tìm thấy giảng viên nào phù hợp</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredTeachers.length > 0 && totalPages > 1 && (
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-semibold">
            Trang {currentPage + 1} / {totalPages} • Tổng {teachers.length} giảng viên
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Trước
            </button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i;
                if (totalPages > 5) {
                  if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setAvatarFile(null);
              setAvatarPreview(null);
            }
          }}
        >
          <div className="bg-[#111827] border border-slate-800 text-slate-100 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-[#0f172a]">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <UserPlus className="w-5.5 h-5.5 text-blue-500" />
                THÔNG TIN THÊM MỚI GIẢNG VIÊN
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto bg-[#111827]">
              <div className="flex flex-col md:flex-row gap-6">

                {/* Left: Avatar */}
                <div className="flex-shrink-0 flex flex-col items-center gap-4 w-44">
                  <div className="w-40 h-40 bg-[#0f172a] border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative group">
                    <img 
                      src={avatarPreview || teacherIcon} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase">Ảnh đại diện</span>
                    </div>
                  </div>
                  <label className="w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all tracking-wide uppercase active:scale-95 text-center cursor-pointer">
                      {avatarPreview ? 'Đổi Avatar' : 'Chọn Avatar'}
                    </span>
                  </label>
                  {avatarFile && (
                    <p className="text-[10px] text-emerald-400 font-semibold text-center">
                      ✓ Đã chọn: {avatarFile?.name && avatarFile.name.length > 20 ? `${avatarFile.name.substring(0, 20)}...` : avatarFile?.name || ''}
                    </p>
                  )}
                </div>

                {/* Right: Grid inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Họ & Tên đệm (*)</label>
                    <input type="text" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Nguyễn Văn" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tên giảng viên (*)</label>
                    <input type="text" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="A" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ngày sinh (*)</label>
                    <input type="date" value={addForm.dateOfBirth} onChange={(e) => setAddForm({ ...addForm, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                      required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Giới tính (*)</label>
                    <select value={addForm.gender} onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer">
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Email (*)</label>
                    <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="nva@tvu.edu.vn" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Số điện thoại (*)</label>
                    <input type="text" value={addForm.phoneNumber} onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="0901234567" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Bộ môn (Khoa) (*)</label>
                    <input type="text" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Công nghệ thông tin" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Chuyên ngành sâu</label>
                    <input type="text" value={addForm.specialization} onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Kỹ thuật phần mềm" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ngày tuyển dụng (*)</label>
                    <input type="date" value={addForm.hireDate} onChange={(e) => setAddForm({ ...addForm, hireDate: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                      required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Học hàm / Học vị (*)</label>
                    <input type="text" value={addForm.academicTitle} onChange={(e) => setAddForm({ ...addForm, academicTitle: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="ThS. / TS." required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Chức vụ (*)</label>
                    <input type="text" value={addForm.position} onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Giảng viên / Trưởng khoa" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Số nội bộ (*)</label>
                    <input type="text" value={addForm.extensionNumber} onChange={(e) => setAddForm({ ...addForm, extensionNumber: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="123" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tên đăng nhập (IAM) (*)</label>
                    <input type="text" value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="gv_vana" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Mật khẩu (*)</label>
                    <input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Tối thiểu 8 ký tự" required />
                  </div>

                  <div className="space-y-1 lg:col-span-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Địa chỉ thường trú (*)</label>
                    <input type="text" value={addForm.address} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Phường 5, Trà Vinh" required />
                  </div>

                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-800 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-bold transition-all active:scale-95">
                  HỦY BỎ
                </button>
                <button type="submit" disabled={loading}
                  className="px-5.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Đang xử lý...' : 'THÊM MỚI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
              setAvatarFile(null);
              setAvatarPreview(null);
            }
          }}
        >
          <div className="bg-[#111827] border border-slate-800 text-slate-100 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-[#0f172a]">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 uppercase tracking-wide">
                <Edit className="w-5.5 h-5.5 text-emerald-500" />
                Thông tin giảng viên: {editForm.firstName.toUpperCase()} {editForm.lastName.toUpperCase()}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTeacher} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto bg-[#111827]">
              <div className="flex flex-col md:flex-row gap-6">

                {/* Left: Avatar */}
                <div className="flex-shrink-0 flex flex-col items-center gap-4 w-44">
                  <div className="w-40 h-40 bg-[#0f172a] border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative group">
                    <img 
                      src={avatarPreview || editingTeacher?.avatarUrl || teacherIcon} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                    {(avatarPreview || editingTeacher?.avatarUrl) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase">Ảnh đại diện</span>
                    </div>
                  </div>
                  <label className="w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all tracking-wide uppercase active:scale-95 text-center cursor-pointer">
                      {avatarPreview ? 'Đổi Avatar' : 'Chọn Avatar'}
                    </span>
                  </label>
                  {avatarFile && (
                    <p className="text-[10px] text-emerald-400 font-semibold text-center">
                      ✓ Đã chọn: {avatarFile?.name && avatarFile.name.length > 20 ? avatarFile.name.substring(0, 20) + '...' : avatarFile?.name || ''}
                    </p>
                  )}
                </div>

                {/* Right: Grid inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Họ & Tên đệm (*)</label>
                    <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tên giảng viên (*)</label>
                    <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ngày sinh (*)</label>
                    <input type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                      required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Giới tính (*)</label>
                    <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer">
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Email (*)</label>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Số điện thoại (*)</label>
                    <input type="text" value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Bộ môn (Khoa) (*)</label>
                    <input type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Chuyên ngành sâu</label>
                    <input type="text" value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold" />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Trạng thái (*)</label>
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer">
                      <option value="HOAT_DONG">Đang làm việc</option>
                      <option value="KHONG_HOAT_DONG">Nghỉ việc</option>
                      <option value="NGHI_PHEP">Nghỉ phép</option>
                      <option value="DA_NGHI_HUU">Đã nghỉ hưu</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Học hàm / Học vị (*)</label>
                    <input type="text" value={editForm.academicTitle} onChange={(e) => setEditForm({ ...editForm, academicTitle: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="ThS. / TS." required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Chức vụ (*)</label>
                    <input type="text" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Giảng viên / Trưởng khoa" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Số nội bộ (*)</label>
                    <input type="text" value={editForm.extensionNumber} onChange={(e) => setEditForm({ ...editForm, extensionNumber: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="123" required />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Mã giảng viên</label>
                    <input type="text" value={editingTeacher?.teacherCode || ''} disabled
                      className="w-full px-3.5 py-2.5 text-xs bg-[#0f172a]/50 border border-slate-850 rounded-xl text-slate-450 font-semibold cursor-not-allowed font-mono" />
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Địa chỉ thường trú (*)</label>
                    <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required />
                  </div>

                </div>
              </div>

              <div className="flex justify-between items-center pt-5 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    if (!editingTeacher) return;
                    if (window.confirm(`Đặt lại mật khẩu cho giảng viên ${editingTeacher.teacherCode} về mặc định?`)) {
                      try {
                        const pw = await authService.resetPassword(editingTeacher.email);
                        toast.success(`Đã đặt lại mật khẩu về: ${pw}`);
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 uppercase tracking-wide"
                >
                  <Lock className="w-4 h-4" />
                  RESET MẬT KHẨU
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => {
                    setShowEditModal(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                    className="px-4.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-bold transition-all active:scale-95">
                    HỦY BỎ
                  </button>
                  <button type="submit" disabled={loading}
                    className="px-5.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50">
                    {loading ? 'Đang cập nhật...' : 'CẬP NHẬT'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Teachers;



