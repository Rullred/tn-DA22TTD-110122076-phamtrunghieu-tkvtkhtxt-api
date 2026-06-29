import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, TeacherDto } from '../../../services/teacherService';
import { classService, ClassDto } from '../../../services/classService';
import { Mail, Phone, MapPin, Calendar, Award, BookOpen, RefreshCw, User, ShieldCheck, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import teacherIconDefault from '../../../assets/teacher-icon.png';

export function TeacherProfile() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<TeacherDto | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
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

  // Extra metadata loaded from localStorage
  const [metadata, setMetadata] = useState({
    academicTitle: 'ThS.',
    position: 'Giảng viên',
    extensionNumber: '123'
  });

  useEffect(() => {
    if (!user) return;
    async function loadTeacherData() {
      setLoading(true);
      try {
        // Fetch all teachers to find the logged-in teacher by email
        const teachersPage = await teacherService.getAll(0, 100);
        const currentTeacher = teachersPage.content.find(t => t.email === user.email);
        
        if (currentTeacher) {
          setTeacher(currentTeacher);

          // Fetch metadata from localStorage
          const metaStr = localStorage.getItem(`teacher_meta_${currentTeacher.id}`);
          if (metaStr) {
            const parsed = JSON.parse(metaStr);
            setMetadata({
              academicTitle: parsed.academicTitle || 'ThS.',
              position: parsed.position || 'Giảng viên',
              extensionNumber: parsed.extensionNumber || '123'
            });
          } else {
            setMetadata({
              academicTitle: 'ThS.',
              position: 'Giảng viên',
              extensionNumber: '123'
            });
          }

          // Fetch classes taught by this teacher
          const classesPage = await classService.getAll(0, 200);
          const list = classesPage.content || [];
          const teacherClasses = list.filter(c => c.teacherId === currentTeacher.id);
          setClasses(teacherClasses);
        }
      } catch (err) {
        console.error("Error loading teacher profile", err);
        toast.error("Không thể tải thông tin trang cá nhân.");
      } finally {
        setLoading(false);
      }
    }
    loadTeacherData();
  }, [user, refreshTrigger]);

  const handleEditClick = () => {
    if (!teacher) return;
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
      academicTitle: metadata.academicTitle,
      position: metadata.position,
      extensionNumber: metadata.extensionNumber
    });
    setShowEditModal(true);
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    // --- Client-side validation ---
    if (!editForm.firstName.trim()) {
      toast.error("Họ & tên đệm không được để trống.");
      return;
    }
    if (!editForm.lastName.trim()) {
      toast.error("Tên giảng viên không được để trống.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast.error("Email liên hệ không đúng định dạng.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(editForm.phoneNumber)) {
      toast.error("Số điện thoại phải đúng 10 chữ số (ví dụ: 0333336731).");
      return;
    }

    if (!editForm.department.trim()) {
      toast.error("Bộ môn (Khoa) không được để trống.");
      return;
    }
    if (!editForm.address.trim()) {
      toast.error("Địa chỉ liên hệ không được để trống.");
      return;
    }

    setLoading(true);
    try {
      // 1. Update core fields via backend API
      await teacherService.update(teacher.id, editForm);

      // 2. Update local metadata
      const meta = {
        academicTitle: editForm.academicTitle,
        position: editForm.position,
        extensionNumber: editForm.extensionNumber
      };
      localStorage.setItem(`teacher_meta_${teacher.id}`, JSON.stringify(meta));

      toast.success("Cập nhật thông tin cá nhân thành công!");
      setShowEditModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      
      const validationErrors = err.response?.data?.data;
      if (validationErrors && typeof validationErrors === 'object') {
        // Display detailed error for each field returned by validation exception handler
        Object.entries(validationErrors).forEach(([field, msg]: [string, any]) => {
          let fieldNameVi = field;
          if (field === 'phoneNumber') fieldNameVi = 'Số điện thoại';
          else if (field === 'email') fieldNameVi = 'Email';
          else if (field === 'firstName') fieldNameVi = 'Họ & tên đệm';
          else if (field === 'lastName') fieldNameVi = 'Tên';
          else if (field === 'address') fieldNameVi = 'Địa chỉ';
          else if (field === 'department') fieldNameVi = 'Khoa/Bộ môn';
          else if (field === 'dateOfBirth') fieldNameVi = 'Ngày sinh';

          toast.error(`Lỗi [${fieldNameVi}]: ${msg}`);
        });
      } else {
        toast.error(err.response?.data?.message || "Cập nhật thất bại.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !teacher) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải trang cá nhân...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-slate-500 font-semibold mb-4">Không tìm thấy thông tin giảng viên.</p>
        </div>
      </div>
    );
  }

  const isCurrentlyTeaching = teacher.status === 'ACTIVE' || teacher.status === 'HOAT_DONG';
  const isOnLeave = teacher.status === 'NGHI_PHEP';
  const isRetired = teacher.status === 'DA_NGHI_HUU';

  const statusText = isCurrentlyTeaching ? 'Đang làm việc'
    : isOnLeave ? 'Nghỉ phép'
    : isRetired ? 'Đã nghỉ hưu'
    : 'Nghỉ việc';

  const statusColor = isCurrentlyTeaching 
    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
    : isOnLeave 
      ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border-amber-100 dark:border-amber-900/30'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-700/50';

  return (
    <div className="page-container p-6 space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-xl font-extrabold text-slate-955 dark:text-white tracking-tight">Hồ sơ cá nhân giảng viên</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Thông tin nhân sự khoa Công nghệ thông tin TVU CET của bạn</p>
        </div>

        <button
          onClick={handleEditClick}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 shadow-md active:scale-95 transition-transform"
        >
          <Edit className="w-4 h-4" />
          Cập nhật thông tin
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Profile card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

            <img
              src={teacher.avatarUrl || teacherIconDefault}
              alt={`${teacher.lastName} ${teacher.firstName}`}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-50 dark:border-slate-800 object-cover shadow-sm bg-white"
              onError={(e) => {
                (e.target as HTMLImageElement).src = teacherIconDefault;
              }}
            />
            
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white leading-tight">
              {metadata.academicTitle} {teacher.lastName} {teacher.firstName}
            </h2>
            <p className="text-xs font-bold font-mono text-slate-500 dark:text-slate-500 mt-1.5 uppercase tracking-wider">
              Mã GV: {teacher.teacherCode}
            </p>
            
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-4 border ${statusColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCurrentlyTeaching ? 'bg-emerald-500' : isOnLeave ? 'bg-amber-500' : 'bg-slate-400'}`} />
              {statusText}
            </span>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-850 text-left space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate font-mono text-blue-650 dark:text-blue-400" title={teacher.email}>{teacher.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Di động: {teacher.phoneNumber || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Số nội bộ: <b className="text-slate-900 dark:text-white font-mono">{metadata.extensionNumber}</b></span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate" title={teacher.address}>{teacher.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Ngày sinh: {teacher.dateOfBirth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Details and Classes taught */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Professional Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-955 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Thông tin công tác & Chuyên môn
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-slate-700 dark:text-slate-355">
              <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-black">Chức vụ giảng dạy</p>
                <p className="text-slate-900 dark:text-white text-sm font-extrabold">{metadata.position}</p>
              </div>

              <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-black">Học vị / Học hàm</p>
                <p className="text-slate-900 dark:text-white text-sm font-extrabold">{metadata.academicTitle}</p>
              </div>

              <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-black">Bộ môn / Khoa công tác</p>
                <p className="text-slate-900 dark:text-white text-sm font-extrabold">{teacher.department}</p>
              </div>

              <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-black">Chuyên ngành chính</p>
                <p className="text-slate-900 dark:text-white text-sm font-extrabold">{teacher.specialization || 'Chưa cập nhật'}</p>
              </div>

              <div className="space-y-1 p-3 bg-slate-50 dark:bg-slate-800/20 rounded-xl md:col-span-2">
                <p className="text-[10px] text-slate-400 uppercase font-black">Ngày tuyển dụng chính thức</p>
                <p className="text-slate-900 dark:text-white text-sm font-extrabold">{teacher.hireDate}</p>
              </div>
            </div>
          </div>

          {/* Classes Taught */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Danh sách Lớp học phần phụ trách giảng dạy
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    <th className="pb-3 px-2">Mã học phần</th>
                    <th className="pb-3 px-2">Tên lớp học phần</th>
                    <th className="pb-3 px-2">Môn học</th>
                    <th className="pb-3 px-2">Sĩ số</th>
                    <th className="pb-3 px-2">Học kỳ / Năm học</th>
                    <th className="pb-3 px-2">Lịch học</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  {classes.map((cls) => (
                    <tr key={cls.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">{cls.classCode}</td>
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{cls.className}</td>
                      <td className="py-3 px-2 font-bold">{cls.subject}</td>
                      <td className="py-3 px-2 font-bold">{cls.currentStudents || 0} / {cls.maxStudents} SV</td>
                      <td className="py-3 px-2">Học kỳ {cls.semester} ({cls.academicYear})</td>
                      <td className="py-3 px-2 font-medium text-slate-500">{cls.schedule || 'Chưa xếp lịch'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {classes.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8 italic bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 mt-2">
                Bạn chưa được phân công giảng dạy lớp học phần nào trong học kỳ này.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 text-slate-100 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0f172a]">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 uppercase tracking-wide">
                <Edit className="w-5.5 h-5.5 text-blue-500" />
                Cập nhật thông tin hồ sơ cá nhân giảng viên
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-850 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTeacher} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-[#111827]">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Họ & Tên đệm (*)</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tên giảng viên (*)</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Email liên hệ (*)</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value.trim() })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Số điện thoại (*)</label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value.trim() })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Học hàm / Học vị (*)</label>
                  <input
                    type="text"
                    value={editForm.academicTitle}
                    onChange={(e) => setEditForm({ ...editForm, academicTitle: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Chức vụ công tác (*)</label>
                  <input
                    type="text"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Số máy nội bộ (*)</label>
                  <input
                    type="text"
                    value={editForm.extensionNumber}
                    onChange={(e) => setEditForm({ ...editForm, extensionNumber: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Bộ môn (Khoa) (*)</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Chuyên ngành chính</label>
                  <input
                    type="text"
                    value={editForm.specialization}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Trạng thái giảng dạy</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                  >
                    <option value="HOAT_DONG">Đang làm việc</option>
                    <option value="KHONG_HOAT_DONG">Nghỉ việc</option>
                    <option value="NGHI_PHEP">Nghỉ phép</option>
                    <option value="DA_NGHI_HUU">Đã nghỉ hưu</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Địa chỉ liên hệ (*)</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                    required
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
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
export default TeacherProfile;
