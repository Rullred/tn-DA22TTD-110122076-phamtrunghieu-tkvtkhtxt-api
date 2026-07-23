import { useState, useEffect } from 'react';
import { classService, ClassDto } from '../../../services/classService';
import { teacherService, TeacherDto } from '../../../services/teacherService';
import { proposalService, TeachingProposalDto } from '../../../services/proposalService';
import { Search, Plus, Edit, Trash2, Users, AlertCircle, BookOpen, Calendar, MapPin, X, PlusCircle, User, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'sonner';
import teacherIcon from '../../../assets/teacher-icon.png';
import { ConfirmModal } from '../../components/ConfirmModal';

export function Classes() {
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Proposals & Tab state
  const [proposals, setProposals] = useState<TeachingProposalDto[]>([]);
  const [activeClassTab, setActiveClassTab] = useState<'classes' | 'proposals'>('classes');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; classItem: ClassDto | null }>({ open: false, classItem: null });
  const [addForm, setAddForm] = useState({
    classCode: '',
    className: '',
    description: 'Lớp học thuộc khoa Kỹ thuật và Công nghệ (CET)',
    teacherId: '',
    subject: 'Công nghệ thông tin',
    room: 'B11.201',
    maxStudents: 40,
    academicYear: '2025-2026',
    semester: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 months later
    schedule: ''
  });
  const [scheduleDay, setScheduleDay] = useState('Thứ 2');
  const [editForm, setEditForm] = useState({
    className: '',
    description: '',
    teacherId: '',
    subject: '',
    room: '',
    maxStudents: 40,
    schedule: '',
    status: 'HOAT_DONG',
    academicYear: '',
    semester: 1,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch classes
        const classesPage = await classService.getAll(0, 100);
        setClasses(classesPage.content || []);

        // Fetch teachers for dropdown selection
        const teachersPage = await teacherService.getAll(0, 100);
        setTeachers(teachersPage.content || []);

        // Load proposals from backend (chia sẻ giữa mọi tài khoản, không còn localStorage)
        const props = await proposalService.list().catch(() => []);
        setProposals(props);
      } catch (err) {
        console.error("Error loading classes data", err);
        toast.error("Không thể tải danh sách lớp học từ máy chủ.");
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshTrigger]);

  const handleApproveProposal = async (prop: TeachingProposalDto) => {
    if (!window.confirm(`Duyệt đề xuất dạy môn "${prop.subject}" của ${prop.teacherName || 'GV'}?\nHệ thống sẽ tạo lớp học phần chính thức.`)) return;
    try {
      await proposalService.approve(prop.id);
      toast.success('Đã duyệt và tạo lớp học phần.');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Duyệt đề xuất thất bại.');
    }
  };

  const handleRejectProposal = async (prop: TeachingProposalDto) => {
    const reason = window.prompt('Lý do từ chối (tùy chọn):') || undefined;
    try {
      await proposalService.reject(prop.id, reason);
      toast.success('Đã từ chối đề xuất.');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Từ chối đề xuất thất bại.');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await classService.create({
        classCode: addForm.classCode,
        className: addForm.className,
        description: addForm.description,
        teacherId: addForm.teacherId || undefined,
        subject: addForm.subject,
        room: addForm.room,
        maxStudents: addForm.maxStudents,
        academicYear: addForm.academicYear,
        semester: addForm.semester,
        startDate: addForm.startDate,
        endDate: addForm.endDate,
        schedule: addForm.schedule
      });

      toast.success("Tạo lớp học phần mới thành công!");
      setShowAddModal(false);
      setAddForm({
        classCode: '',
        className: '',
        description: 'Lớp học thuộc khoa Kỹ thuật và Công nghệ (CET)',
        teacherId: '',
        subject: 'Công nghệ thông tin',
        room: 'B11.201',
        maxStudents: 40,
        academicYear: '2025-2026',
        semester: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        schedule: ''
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Tạo lớp học thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = (cls: ClassDto) => {
    setConfirmDelete({ open: true, classItem: cls });
  };

  const executeDeleteClass = async () => {
    if (!confirmDelete.classItem) return;
    const cls = confirmDelete.classItem;
    setConfirmDelete({ open: false, classItem: null });
    try {
      await classService.delete(cls.id);
      toast.success(`Đã xóa lớp "${cls.className}" thành công.`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toast.error('Không thể xóa lớp học.');
    }
  };

  const handleEditClick = (cls: ClassDto) => {
    setEditingClass(cls);
    setEditForm({
      className: cls.className,
      description: cls.description || '',
      teacherId: cls.teacherId || '',
      subject: cls.subject,
      room: cls.room || '',
      maxStudents: cls.maxStudents,
      schedule: cls.schedule || '',
      status: cls.status,
      academicYear: cls.academicYear,
      semester: cls.semester,
      startDate: cls.startDate,
      endDate: cls.endDate
    });
    setShowEditModal(true);
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    setLoading(true);
    try {
      await classService.update(editingClass.id, editForm);
      toast.success("Cập nhật thông tin lớp học thành công!");
      setShowEditModal(false);
      setEditingClass(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.classCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookOpen className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">Quản lý lớp học & Học phần</h1>
            <p className="text-sm text-slate-600 font-medium mt-0.5">Danh mục các lớp lý thuyết, lớp chuyên sâu TVU CET</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 shadow-md active:scale-95 transition-transform duration-250 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Tạo lớp học phần mới
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        
        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-880 bg-slate-50/30 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveClassTab('classes')}
            className={`flex-1 py-5 px-6 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeClassTab === 'classes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-650 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Lớp học phần hiện tại ({classes.length})
          </button>
          <button
            onClick={() => setActiveClassTab('proposals')}
            className={`flex-1 py-5 px-6 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeClassTab === 'proposals'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-650 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20'
            }`}
          >
            <Users className="w-5 h-5" />
            Môn học Giảng viên đăng ký dạy ({proposals.filter(p => p.status === 'CHO_DUYET').length})
          </button>
        </div>

        {activeClassTab === 'classes' && (
          <>
            {/* Search filter */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/10">
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên lớp, mã lớp hoặc môn học giảng dạy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm font-semibold text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredClasses.map((cls) => {
                const hasNoStudents = cls.currentStudents === 0 || !cls.currentStudents;
                const hasNoAdvisor = !cls.teacherId;

                return (
                  <div
                    key={cls.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between ${
                      hasNoStudents || hasNoAdvisor 
                        ? 'border-amber-200 dark:border-amber-900/30 bg-amber-50/15 dark:bg-amber-955/5' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full font-mono uppercase border border-blue-150/40 dark:border-blue-900/30">
                            {cls.classCode}
                          </span>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1.5 line-clamp-1">{cls.className}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(cls)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Sửa"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(cls)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                        {cls.description || 'Chưa cấu hình mô tả chi tiết học phần.'}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-400 font-medium">
                          <BookOpen className="w-4.5 h-4.5 text-slate-400" />
                          <span>Môn học: <b className="text-slate-800 dark:text-white">{cls.subject}</b></span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs text-slate-650 dark:text-slate-400 font-medium">
                          <Calendar className="w-4.5 h-4.5 text-slate-400" />
                          <span>Học kỳ: {cls.semester} (Niên khóa {cls.academicYear})</span>
                        </div>

                        {/* Scale block */}
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Users className="w-4.5 h-4.5 text-slate-400" />
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">Quy mô</span>
                          </div>
                          <span className={`text-xs font-bold ${hasNoStudents ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
                            {cls.currentStudents || 0} / {cls.maxStudents} SV
                          </span>
                        </div>

                        {/* Teacher Card */}
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">Giảng viên & Cố vấn</span>
                          </div>
                          {cls.teacherId ? (
                            <div className="flex items-center gap-2.5">
                              <img
                                src={teacherIcon}
                                alt="Giảng viên"
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 bg-white"
                              />
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{cls.teacherName}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-450 mt-1 font-bold text-[10px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Chưa phân công giảng viên</span>
                            </div>
                          )}
                        </div>

                        {/* Alerts panel */}
                        {(hasNoStudents || hasNoAdvisor) && (
                          <div className="p-3 bg-amber-50/50 dark:bg-amber-955/25 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                            <div className="flex items-start gap-2 text-[10px] leading-relaxed font-bold">
                              <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 text-amber-800 dark:text-amber-400">
                                <p className="font-extrabold uppercase mb-0.5 tracking-wide">Yêu cầu hoàn tất</p>
                                {hasNoAdvisor && <p className="font-semibold">• Phân bổ Giáo viên phụ trách lớp</p>}
                                {hasNoStudents && <p className="font-semibold">• Đăng ký/Ghi danh học viên học phần</p>}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Mở lớp: {cls.startDate}</span>
                        <span>Kết thúc: {cls.endDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredClasses.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-slate-350 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold text-sm">Không tìm thấy lớp học phần nào phù hợp</p>
              </div>
            )}
          </>
        )}

        {activeClassTab === 'proposals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-800/15 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Giảng viên đề xuất</th>
                  <th className="py-4 px-5">Môn học giảng dạy</th>
                  <th className="py-4 px-5">Học kỳ / Năm học</th>
                  <th className="py-4 px-5">Ghi chú đề xuất</th>
                  <th className="py-4 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm font-medium text-slate-700 dark:text-slate-350">
                {proposals.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <img src={teacherIcon} className="w-8 h-8 rounded-full bg-white border border-slate-200 object-cover" alt="teacher" />
                      <span>{prop.teacherName || '—'}</span>
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {prop.subject}
                    </td>
                    <td className="py-4 px-5 font-semibold">
                      Học kỳ {prop.semester} ({prop.academicYear})
                    </td>
                    <td className="py-4 px-5 text-slate-600 italic">
                      {prop.notes || prop.description || 'Không có ghi chú'}
                      {prop.status === 'TU_CHOI' && prop.rejectionReason && (
                        <span className="block not-italic text-rose-600 text-xs font-semibold mt-1">Từ chối: {prop.rejectionReason}</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {prop.status === 'CHO_DUYET' ? (
                        <div className="inline-flex items-center gap-2">
                          <button onClick={() => handleApproveProposal(prop)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors active:scale-95">
                            <Check className="w-4 h-4" /> Duyệt & tạo lớp
                          </button>
                          <button onClick={() => handleRejectProposal(prop)}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-bold transition-colors">
                            <X className="w-4 h-4" /> Từ chối
                          </button>
                        </div>
                      ) : prop.status === 'DA_DUYET' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <X className="w-3.5 h-3.5" /> Đã từ chối
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {proposals.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-sm">Chưa có giảng viên nào gửi đề xuất đăng ký dạy</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <PlusCircle className="w-5.5 h-5.5 text-blue-600" />
                Tạo lớp học phần mới (TVU CET)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Mã lớp khóa (Code)</label>
                  <input
                    type="text"
                    value={addForm.classCode}
                    onChange={(e) => setAddForm({ ...addForm, classCode: e.target.value.trim() })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    placeholder="Ví dụ: DA22TTD"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Tên lớp học phần</label>
                  <input
                    type="text"
                    value={addForm.className}
                    onChange={(e) => setAddForm({ ...addForm, className: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    placeholder="Ví dụ: Lớp K22 CNTT D"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Tên môn học giảng dạy</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><BookOpen className="w-3.5 h-3.5" /></span>
                  <input
                    type="text"
                    value={addForm.subject}
                    onChange={(e) => setAddForm({ ...addForm, subject: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    placeholder="Ví dụ: Cấu trúc dữ liệu và giải thuật"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Giảng viên phụ trách</label>
                  <select
                    value={addForm.teacherId}
                    onChange={(e) => setAddForm({ ...addForm, teacherId: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="">Chưa phân công giảng viên</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.lastName} {t.firstName} ({t.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Quy mô tối đa (Sĩ số)</label>
                  <input
                    type="number"
                    value={addForm.maxStudents}
                    onChange={(e) => setAddForm({ ...addForm, maxStudents: parseInt(e.target.value) })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    min={5}
                    max={100}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Phòng học</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><MapPin className="w-3.5 h-3.5" /></span>
                    <input
                      type="text"
                      value={addForm.room}
                      onChange={(e) => setAddForm({ ...addForm, room: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                      placeholder="B11.203"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Năm học</label>
                  <input
                    type="text"
                    value={addForm.academicYear}
                    onChange={(e) => setAddForm({ ...addForm, academicYear: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    placeholder="2025-2026"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Học kỳ đào tạo</label>
                  <select
                    value={addForm.semester}
                    onChange={(e) => setAddForm({ ...addForm, semester: parseInt(e.target.value) })}
                    className="w-full px-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm cursor-pointer bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-300"
                  >
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                    <option value={3}>Học kỳ 3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={addForm.startDate}
                    onChange={(e) => setAddForm({ ...addForm, startDate: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={addForm.endDate}
                    onChange={(e) => setAddForm({ ...addForm, endDate: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Lịch học + ca học mặc định (1.6) */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Lịch học</label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={scheduleDay}
                    onChange={(e) => setScheduleDay(e.target.value)}
                    className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-white cursor-pointer"
                  >
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {[
                    { label: 'Ca sáng · 07:00–10:30', range: '7h-10h30' },
                    { label: 'Ca chiều · 13:00–16:30', range: '13h-16h30' },
                    { label: 'Ca tối · 18:30–21:00', range: '18h30-21h' },
                  ].map(shift => (
                    <button
                      key={shift.range}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, schedule: `${scheduleDay}, ${shift.range}` })}
                      className="px-3 py-2.5 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                    >
                      {shift.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={addForm.schedule}
                  onChange={(e) => setAddForm({ ...addForm, schedule: e.target.value })}
                  className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                  placeholder="Ví dụ: Thứ 2, 7h-10h30 (chọn ca ở trên hoặc tự nhập)"
                />
                <p className="text-[11px] text-slate-400">Chọn thứ rồi bấm ca học để tự điền — vẫn có thể chỉnh sửa tay. Ca mặc định: Sáng 07:00–10:30, Chiều 13:00–16:30, Tối 18:30–21:00.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl text-sm font-bold shadow-md transition-colors active:scale-95"
                >
                  Tạo lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-600" />
                Chỉnh sửa thông tin Lớp học
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditClass} className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
              <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl">
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-normal font-semibold">
                  Mã lớp: <span className="font-mono">{editingClass.classCode}</span> - Chỉ cập nhật thông tin lớp học, không thể thay đổi mã lớp.
                </p>
              </div>

              {/* Class name and subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Tên lớp học</label>
                  <input
                    type="text"
                    value={editForm.className}
                    onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Học phần</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white font-medium"
                    required
                  />
                </div>
              </div>

              {/* Teacher assignment */}
              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Giảng viên phụ trách</label>
                <select
                  value={editForm.teacherId}
                  onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
                  className="w-full px-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm cursor-pointer bg-white dark:bg-slate-950 text-slate-800 dark:text-white"
                >
                  <option value="">Chưa phân công</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.lastName} {t.firstName} ({t.teacherCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Room and max students */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Phòng học</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><MapPin className="w-3.5 h-3.5" /></span>
                    <input
                      type="text"
                      value={editForm.room}
                      onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Sĩ số tối đa</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.maxStudents}
                    onChange={(e) => setEditForm({ ...editForm, maxStudents: parseInt(e.target.value) || 40 })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Trạng thái</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm cursor-pointer bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  >
                    <option value="HOAT_DONG">Đang mở</option>
                    <option value="KHONG_HOAT_DONG">Tạm dừng</option>
                    <option value="DA_HOAN_THANH">Đã kết thúc</option>
                    <option value="DA_HUY">Đã hủy</option>
                  </select>
                </div>
              </div>

              {/* Academic year and semester */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Năm học</label>
                  <input
                    type="text"
                    value={editForm.academicYear}
                    onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    placeholder="2025-2026"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Học kỳ</label>
                  <select
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: parseInt(e.target.value) })}
                    className="w-full px-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm cursor-pointer bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  >
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                    <option value={3}>Học kỳ 3 (Hè)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Lịch học</label>
                  <input
                    type="text"
                    value={editForm.schedule}
                    onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    placeholder="T2,T5: 7h-9h"
                  />
                </div>
              </div>

              {/* Start and end dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase">Mô tả lớp học</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-3 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 bg-white dark:bg-slate-955 text-slate-800 dark:text-white font-medium"
                  rows={3}
                  placeholder="Mô tả ngắn gọn về lớp học..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-3 border border-slate-250 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-455"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors active:scale-95 disabled:opacity-50"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmDelete.open}
        title="Xóa lớp học phần"
        message={confirmDelete.classItem
          ? `Bạn có chắc chắn muốn xóa lớp "${confirmDelete.classItem.className}" (${confirmDelete.classItem.classCode})? Hành động này sẽ xóa toàn bộ dữ liệu ghi danh liên quan và không thể hoàn tác.`
          : ''}
        confirmLabel="Xóa lớp"
        cancelLabel="Hủy"
        variant="danger"
        icon="trash"
        onConfirm={executeDeleteClass}
        onCancel={() => setConfirmDelete({ open: false, classItem: null })}
      />
    </div>
  );
}
export default Classes;

