import { useState, useEffect, useCallback } from 'react';
import { classService, ClassDto, EnrollmentDto } from '../../../services/classService';
import { studentService, StudentDto } from '../../../services/studentService';
import {
  Search, Trash2, Users, BookOpen, RefreshCw,
  CheckSquare, Square, X, GraduationCap,
  UserPlus, ArrowRight, Download
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import studentIcon from '../../../assets/student-icon.png';
import { ConfirmModal } from '../../components/ConfirmModal';

interface EnrollmentWithStudent extends EnrollmentDto {
  studentProfile?: StudentDto;
}

export function Enrollments() {
  // --- Core data state ---
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassDto | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithStudent[]>([]);

  // --- UI state ---
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showEnrollPanel, setShowEnrollPanel] = useState(false);

  // --- Bulk enroll state ---
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // --- Confirm modal state ---
  const [confirmDrop, setConfirmDrop] = useState<{ open: boolean; enrollment: EnrollmentWithStudent | null }>({ open: false, enrollment: null });

  // Load classes and students
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [classesPage, studentsPage] = await Promise.all([
          classService.getAll(0, 100),
          studentService.getAll(0, 200),
        ]);
        setClasses(classesPage.content || []);
        setStudents(studentsPage.content || []);

        // Auto-select first class
        if (classesPage.content?.length > 0 && !selectedClass) {
          setSelectedClass(classesPage.content[0]);
        }
      } catch (err) {
        console.error('Error loading enrollment data', err);
        toast.error('Không thể kết nối backend.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshTrigger]);

  // Load enrollments for selected class
  const loadEnrollments = useCallback(async () => {
    if (!selectedClass) return;
    try {
      // Primary: load via enrollments endpoint (includes grade data)
      const res = await classService.getClassEnrollments(selectedClass.id, 0, 200);
      const rawEnrollments = res.content || [];

      if (rawEnrollments.length > 0) {
        // Enrich with student profiles
        const enriched = await Promise.all(
          rawEnrollments.map(async (enroll) => {
            try {
              const studentProfile = await studentService.getById(enroll.studentId);
              return { ...enroll, studentProfile };
            } catch {
              return { ...enroll };
            }
          })
        );
        setEnrollments(enriched);
      } else {
        // Fallback: use active students endpoint if enrollments returns empty
        try {
          const activeStudents = await classService.getActiveStudents(selectedClass.id);
          const fallbackEnrollments: EnrollmentWithStudent[] = activeStudents.map(s => ({
            id: s.id,
            classId: selectedClass.id,
            studentId: s.id,
            studentName: `${s.lastName} ${s.firstName}`,
            studentCode: s.studentCode,
            enrollmentDate: '',
            status: 'ACTIVE',
            grade: null,
            attendanceRate: null,
            notes: null,
            droppedAt: null,
            studentProfile: s
          }));
          setEnrollments(fallbackEnrollments);
        } catch {
          setEnrollments([]);
        }
      }
    } catch (err: any) {
      console.error('Error loading enrollments', err);
      // Fallback to active students on error
      try {
        const activeStudents = await classService.getActiveStudents(selectedClass.id);
        const fallbackEnrollments: EnrollmentWithStudent[] = activeStudents.map(s => ({
          id: s.id,
          classId: selectedClass.id,
          studentId: s.id,
          studentName: `${s.lastName} ${s.firstName}`,
          studentCode: s.studentCode,
          enrollmentDate: '',
          status: 'ACTIVE',
          grade: null,
          attendanceRate: null,
          notes: null,
          droppedAt: null,
          studentProfile: s
        }));
        setEnrollments(fallbackEnrollments);
        if (activeStudents.length === 0) {
          toast.info('Lớp này chưa có sinh viên nào ghi danh.');
        }
      } catch {
        setEnrollments([]);
        toast.error('Không thể tải danh sách sinh viên trong lớp.');
      }
    }
  }, [selectedClass]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments, refreshTrigger]);

  // Filtered classes in sidebar
  const filteredClasses = classes.filter(cls =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.classCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Students NOT already enrolled (for the enroll panel)
  const enrolledStudentIds = new Set(enrollments.map(e => e.studentId));
  const availableStudents = students.filter(s =>
    !enrolledStudentIds.has(s.id) &&
    (s.status === 'ACTIVE' || s.status === 'HOAT_DONG') &&
    (`${s.lastName} ${s.firstName}`.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearchTerm.toLowerCase()))
  );

  const handleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === availableStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(availableStudents.map(s => s.id)));
    }
  };

  const handleBulkEnroll = async () => {
    if (!selectedClass || selectedStudentIds.size === 0) return;
    setEnrollLoading(true);

    let successCount = 0;
    let failCount = 0;
    const ids = Array.from(selectedStudentIds);

    for (const studentId of ids) {
      try {
        await classService.enrollStudent(selectedClass.id, studentId);
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error(`Failed to enroll student ${studentId}:`, err);
      }
    }

    if (successCount > 0) {
      toast.success(`✅ Đã ghi danh thành công ${successCount} sinh viên vào lớp "${selectedClass.className}"!`);
    }
    if (failCount > 0) {
      toast.error(`⚠️ ${failCount} sinh viên ghi danh thất bại (có thể đã tồn tại hoặc lớp đầy).`);
    }

    setSelectedStudentIds(new Set());
    setShowEnrollPanel(false);
    setRefreshTrigger(prev => prev + 1);
    setEnrollLoading(false);
  };

  const handleDropStudent = (enrollment: EnrollmentWithStudent) => {
    setConfirmDrop({ open: true, enrollment });
  };

  const executeDropStudent = async () => {
    const enrollment = confirmDrop.enrollment;
    if (!enrollment || !selectedClass) return;
    const studentName = enrollment.studentProfile
      ? `${enrollment.studentProfile.lastName} ${enrollment.studentProfile.firstName}`
      : 'sinh viên này';
    setConfirmDrop({ open: false, enrollment: null });
    try {
      await classService.dropStudent(selectedClass.id, enrollment.studentId);
      toast.success(`Đã rút ${studentName} khỏi lớp học.`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rút học phần thất bại.');
    }
  };

  const handleExportExcel = () => {
    if (!selectedClass || enrollments.length === 0) {
      toast.error('Không có dữ liệu để xuất.');
      return;
    }
    try {
      const rows = enrollments.map((e, idx) => ({
        'STT': idx + 1,
        'MSSV': e.studentProfile?.studentCode || e.studentCode || '',
        'Họ và tên': e.studentProfile ? `${e.studentProfile.lastName} ${e.studentProfile.firstName}` : (e.studentName || ''),
        'Email': e.studentProfile?.email || '',
        'Ngày ghi danh': e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString('vi-VN') : '',
        'TP1': e.componentGrade1 ?? '',
        'TP2': e.componentGrade2 ?? '',
        'Thi cuối kỳ': e.finalExamGrade ?? '',
        'Tổng (10)': e.totalGrade10 ?? '',
        'Tổng (4)': e.totalGrade4 ?? '',
        'Xếp loại': e.letterGrade || e.grade || '',
        'Chuyên cần (%)': e.attendanceRate ?? '',
        'Trạng thái': e.status === 'ACTIVE' || e.status === 'HOAT_DONG' ? 'Đang học'
          : e.status === 'COMPLETED' || e.status === 'DA_HOAN_THANH' ? 'Hoàn thành'
          : e.status === 'DROPPED' || e.status === 'DA_BO_HOC' ? 'Đã rút'
          : e.status,
        'Ghi chú': e.notes || ''
      }));

      const cleanClassCode = selectedClass.classCode.replace(/[\/\\?%*:|"<>\s]+/g, '_');
      const cleanClassName = selectedClass.className.replace(/[\/\\?%*:|"<>\s]+/g, '_');
      const fileName = `${cleanClassCode}_${cleanClassName}.xlsx`;

      // Always use Blob-based download for browser compatibility
      const xlsxModule: any = XLSX;
      const xUtils = xlsxModule.utils ?? xlsxModule.default?.utils ?? XLSX.utils;
      const xWrite = xlsxModule.write ?? xlsxModule.default?.write ?? XLSX.write;

      const ws = xUtils.json_to_sheet(rows);
      const wb = xUtils.book_new();
      xUtils.book_append_sheet(wb, ws, 'Danh sach SV');

      const wbout: ArrayBuffer = xWrite(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toast.success(`Đã xuất file "${fileName}" thành công!`);
    } catch (err: any) {
      console.error('Lỗi khi xuất file Excel:', err);
      toast.error(`Lỗi khi xuất file Excel: ${err.message || err}`);
    }
  };

  const gradeColors: Record<string, string> = {
    A: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    B: 'text-blue-700 bg-blue-50 border-blue-200',
    C: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    D: 'text-orange-700 bg-orange-50 border-orange-200',
    F: 'text-rose-700 bg-rose-50 border-rose-200',
  };

  return (
    <>
    <div className="page-container space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">Quản lý Ghi danh</h1>
            <p className="text-sm text-slate-600 font-medium mt-0.5">
              Ghi danh sinh viên vào lớp học · Quản lý Enrollment
            </p>
          </div>
        </div>
        <button
          onClick={() => setRefreshTrigger(p => p + 1)}
          disabled={loading}
          className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all text-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Main layout: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT: Class list sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Chọn lớp học ({classes.length})
            </h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm lớp..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-3 w-3/4 bg-slate-100 rounded mb-2" />
                  <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
                </div>
              ))
            ) : filteredClasses.map(cls => (
              <button
                key={cls.id}
                onClick={() => { setSelectedClass(cls); setShowEnrollPanel(false); setSelectedStudentIds(new Set()); }}
                className={`w-full text-left p-4 transition-all ${selectedClass?.id === cls.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-indigo-500'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/20 border-l-4 border-transparent'
                  }`}
              >
                <p className={`text-xs font-bold font-mono mb-0.5 ${selectedClass?.id === cls.id ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {cls.classCode}
                </p>
                <p className={`text-sm font-bold leading-snug ${selectedClass?.id === cls.id ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-white'}`}>
                  {cls.className}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">{cls.subject}</span>
                  <span className="ml-auto text-[10px] font-bold text-slate-500">
                    {cls.currentStudents || 0}/{cls.maxStudents} SV
                  </span>
                </div>
              </button>
            ))}

            {filteredClasses.length === 0 && !loading && (
              <div className="p-6 text-center text-slate-400 text-sm">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Không tìm thấy lớp
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Enrollment content */}
        <div className="lg:col-span-3 space-y-5">
          {selectedClass ? (
            <>
              {/* Selected class info banner */}
              <div className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Lớp học đang xem</p>
                    <h2 className="text-xl font-extrabold">{selectedClass.className}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-indigo-200 font-semibold">
                      <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded-lg">{selectedClass.classCode}</span>
                      <span>Môn: {selectedClass.subject}</span>
                      <span>Phòng: {selectedClass.room || 'Tự do'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="bg-white/15 rounded-2xl px-4 py-3 text-center">
                      <p className="text-2xl font-extrabold">{enrollments.length}</p>
                      <p className="text-xs font-bold text-indigo-200 mt-0.5">Đã ghi danh</p>
                    </div>
                    <div className="bg-white/15 rounded-2xl px-4 py-3 text-center">
                      <p className="text-2xl font-extrabold">{selectedClass.maxStudents - enrollments.length}</p>
                      <p className="text-xs font-bold text-indigo-200 mt-0.5">Còn trống</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative z-10 mt-5">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-200 mb-1.5">
                    <span>Tỷ lệ lấp đầy lớp</span>
                    <span>{Math.round((enrollments.length / selectedClass.maxStudents) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (enrollments.length / selectedClass.maxStudents) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action toolbar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Danh sách sinh viên ghi danh ({enrollments.length} SV)
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Quản lý danh sách sinh viên trong lớp học phần này
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {enrollments.length > 0 && (
                      <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        Xuất Excel
                      </button>
                    )}
                    <button
                      onClick={() => { setShowEnrollPanel(!showEnrollPanel); setSelectedStudentIds(new Set()); }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${showEnrollPanel
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200'
                        }`}
                    >
                      {showEnrollPanel ? <><X className="w-4 h-4" /> Đóng</> : <><UserPlus className="w-4 h-4" /> Ghi danh sinh viên</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Enroll Panel (slide-in style) */}
              {showEnrollPanel && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200/50 dark:border-indigo-900/30 shadow-lg overflow-hidden">
                  {/* Panel header */}
                  <div className="flex items-center justify-between p-5 border-b border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/10">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">
                        Chọn sinh viên để ghi danh vào lớp "{selectedClass.className}"
                      </h3>
                    </div>
                    {selectedStudentIds.size > 0 && (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-200">
                        {selectedStudentIds.size} đã chọn
                      </span>
                    )}
                  </div>

                  {/* Search + select all */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm sinh viên theo tên, MSSV, email..."
                        value={studentSearchTerm}
                        onChange={e => setStudentSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      {selectedStudentIds.size === availableStudents.length && availableStudents.length > 0
                        ? <><CheckSquare className="w-4 h-4 text-indigo-600" /> Bỏ chọn tất cả</>
                        : <><Square className="w-4 h-4" /> Chọn tất cả ({availableStudents.length})</>
                      }
                    </button>
                  </div>

                  {/* Students grid */}
                  <div className="p-4 max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableStudents.length === 0 ? (
                      <div className="col-span-2 text-center py-10 text-slate-400">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold">Tất cả sinh viên đang hoạt động đều đã ghi danh</p>
                        <p className="text-xs mt-1">hoặc không có kết quả tìm kiếm</p>
                      </div>
                    ) : availableStudents.map(student => {
                      const isSelected = selectedStudentIds.has(student.id);
                      return (
                        <button
                          key={student.id}
                          onClick={() => handleSelectStudent(student.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSelected
                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:bg-indigo-50/30'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <img src={studentIcon} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-white flex-shrink-0" />
                          <div className="min-w-0">
                            <p className={`text-sm font-bold leading-tight truncate ${isSelected ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-800 dark:text-white'}`}>
                              {student.lastName} {student.firstName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{student.studentCode} · {student.email}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit bar */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedStudentIds.size > 0
                        ? `Sẽ ghi danh ${selectedStudentIds.size} sinh viên vào lớp này`
                        : 'Chọn sinh viên ở trên để ghi danh'}
                    </p>
                    <button
                      onClick={handleBulkEnroll}
                      disabled={selectedStudentIds.size === 0 || enrollLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:cursor-not-allowed"
                    >
                      {enrollLoading ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Đang ghi danh...</>
                      ) : (
                        <><ArrowRight className="w-4 h-4" /> Ghi danh {selectedStudentIds.size > 0 ? `(${selectedStudentIds.size} SV)` : ''}</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Enrolled students table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-5">Sinh viên</th>
                        <th className="py-4 px-5">MSSV</th>
                        <th className="py-4 px-5">Ngày ghi danh</th>
                        <th className="py-4 px-5">Điểm học tập</th>
                        <th className="py-4 px-5">Chuyên cần</th>
                        <th className="py-4 px-5">Trạng thái</th>
                        <th className="py-4 px-5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {enrollments.map(enroll => {
                        const student = enroll.studentProfile;
                        const gradeClass = enroll.grade ? (gradeColors[enroll.grade] || 'text-slate-500 bg-slate-50 border-slate-200') : '';

                        return (
                          <tr key={enroll.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <img src={studentIcon} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-white flex-shrink-0" />
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                                    {student ? `${student.lastName} ${student.firstName}` : enroll.studentName || 'Đang tải...'}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">{student?.email || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5 font-mono text-slate-600 dark:text-slate-400 text-xs">
                              {student?.studentCode || '—'}
                            </td>
                            <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-xs">
                              {enroll.enrollmentDate
                                ? new Date(enroll.enrollmentDate).toLocaleDateString('vi-VN')
                                : '—'}
                            </td>
                            <td className="py-4 px-5">
                              {enroll.grade ? (
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-xs border ${gradeClass}`}>
                                  {enroll.grade}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Chưa có</span>
                              )}
                            </td>
                            <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">
                              {enroll.attendanceRate !== null && enroll.attendanceRate !== undefined
                                ? `${enroll.attendanceRate}%`
                                : <span className="text-slate-400 text-xs italic">N/A</span>}
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${enroll.status === 'ACTIVE' || enroll.status === 'HOAT_DONG' || enroll.status === 'DA_DANG_KY'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : enroll.status === 'COMPLETED' || enroll.status === 'DA_HOAN_THANH'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : enroll.status === 'DROPPED' || enroll.status === 'DA_BO_HOC'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${enroll.status === 'ACTIVE' || enroll.status === 'HOAT_DONG' || enroll.status === 'DA_DANG_KY' ? 'bg-emerald-500' : enroll.status === 'COMPLETED' || enroll.status === 'DA_HOAN_THANH' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                                {enroll.status === 'ACTIVE' || enroll.status === 'HOAT_DONG' || enroll.status === 'DA_DANG_KY' ? 'Đang học'
                                  : enroll.status === 'COMPLETED' || enroll.status === 'DA_HOAN_THANH' ? 'Hoàn thành'
                                    : enroll.status === 'DROPPED' || enroll.status === 'DA_BO_HOC' ? 'Đã rút'
                                      : enroll.status}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button
                                onClick={() => handleDropStudent(enroll)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                                title="Rút học phần"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {enrollments.length === 0 && (
                    <div className="text-center py-16">
                      <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-semibold text-sm">Chưa có sinh viên nào ghi danh lớp học phần này</p>
                      <p className="text-slate-400 text-xs mt-1">Nhấn "Ghi danh sinh viên" để thêm sinh viên vào lớp</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-16 text-center shadow-sm">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-base font-extrabold text-slate-700 dark:text-white mb-2">Chọn một lớp học để bắt đầu</h3>
              <p className="text-sm text-slate-400 font-medium">Vui lòng chọn lớp học phần từ danh sách bên trái</p>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Confirm Drop Modal */}
      <ConfirmModal
        open={confirmDrop.open}
        title="Rút sinh viên khỏi lớp"
        message={confirmDrop.enrollment
          ? `Bạn có chắc muốn rút "${confirmDrop.enrollment.studentProfile
              ? `${confirmDrop.enrollment.studentProfile.lastName} ${confirmDrop.enrollment.studentProfile.firstName}`
              : (confirmDrop.enrollment.studentName || 'sinh viên này')
            }" khỏi lớp "${selectedClass?.className}"? Hành động này không thể hoàn tác.`
          : ''}
        confirmLabel="Xác nhận rút"
        cancelLabel="Hủy"
        variant="danger"
        icon="ban"
        onConfirm={executeDropStudent}
        onCancel={() => setConfirmDrop({ open: false, enrollment: null })}
      />
    </>
  );
}

export default Enrollments;
