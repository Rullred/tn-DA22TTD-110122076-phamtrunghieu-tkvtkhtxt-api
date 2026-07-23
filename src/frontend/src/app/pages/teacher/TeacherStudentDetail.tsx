import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Mail, Phone, MapPin, Save, GraduationCap, Calendar, RefreshCw, BookOpen, CheckCircle, AlertCircle, User } from 'lucide-react';
import { studentService, StudentDto } from '../../../services/studentService';
import { classService, EnrollmentDto, ClassDto } from '../../../services/classService';
import { curriculumService, AcademicProgressDto } from '../../../services/curriculumService';
import { toast } from 'sonner';
import studentIcon from '../../../assets/student-icon.png';

interface EnrollmentWithClass extends EnrollmentDto {
  classDetails?: ClassDto;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'A' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'B+': 'text-blue-700 bg-blue-50 border-blue-200',
  'B' : 'text-blue-700 bg-blue-50 border-blue-200',
  'C+': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  'C' : 'text-yellow-700 bg-yellow-50 border-yellow-200',
  'D+': 'text-orange-700 bg-orange-50 border-orange-200',
  'D' : 'text-orange-700 bg-orange-50 border-orange-200',
  'F' : 'text-rose-700 bg-rose-50 border-rose-200',
};

const GRADE_POINTS: Record<string, number> = { 'A+': 4.0, 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0 };

const PROGRESS_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  DA_HOC: { label: 'Đạt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  DANG_HOC: { label: 'Đang học', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  ROT_F: { label: 'Rớt (F)', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  NO_MON: { label: 'Nợ môn', cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
};

const conductLabel = (score: number | null | undefined): { text: string; cls: string } => {
  if (score == null) return { text: 'Chưa chấm', cls: 'text-slate-400' };
  if (score >= 90) return { text: 'Xuất sắc', cls: 'text-emerald-400' };
  if (score >= 80) return { text: 'Tốt', cls: 'text-blue-400' };
  if (score >= 65) return { text: 'Khá', cls: 'text-sky-300' };
  if (score >= 50) return { text: 'Trung bình', cls: 'text-amber-400' };
  return { text: 'Yếu', cls: 'text-rose-400' };
};

export function TeacherStudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState<StudentDto | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Tiến độ học tập (nợ môn / rớt) theo chương trình khung
  const [progress, setProgress] = useState<AcademicProgressDto | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [selectedSem, setSelectedSem] = useState<{ namHoc: string; hocKy: number } | null>(null);

  useEffect(() => {
    if (id) loadStudentData();
  }, [id]);

  // Chọn học kỳ mặc định từ danh sách enrollment đã nạp
  useEffect(() => {
    const seen = new Map<string, { namHoc: string; hocKy: number }>();
    enrollments.forEach(e => {
      const yr = e.classDetails?.academicYear;
      const sem = e.classDetails?.semester;
      if (yr && sem != null) seen.set(`${yr}||${sem}`, { namHoc: yr, hocKy: sem });
    });
    const list = Array.from(seen.values());
    if (list.length && (!selectedSem || !seen.has(`${selectedSem.namHoc}||${selectedSem.hocKy}`))) {
      setSelectedSem(list[0]);
    }
  }, [enrollments]);

  // Nạp tiến độ học tập cho học kỳ đang chọn
  useEffect(() => {
    if (!id || !selectedSem) { setProgress(null); return; }
    let cancelled = false;
    setProgressLoading(true);
    curriculumService.getAcademicProgress(id, selectedSem.namHoc, selectedSem.hocKy)
      .then(p => { if (!cancelled) setProgress(p); })
      .catch(err => { console.error(err); if (!cancelled) setProgress(null); })
      .finally(() => { if (!cancelled) setProgressLoading(false); });
    return () => { cancelled = true; };
  }, [id, selectedSem]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentData = await studentService.getById(id!);
      setStudent(studentData);

      const enrollmentsPage = await classService.getStudentEnrollments(id!);
      const enrollList = enrollmentsPage.content || [];

      const enrichedEnrollments = await Promise.all(
        enrollList.map(async (enrollment) => {
          try {
            const classDetails = await classService.getById(enrollment.classId);
            return { ...enrollment, classDetails };
          } catch (err) {
            console.error(`Failed to load class ${enrollment.classId}:`, err);
            return enrollment;
          }
        })
      );
      setEnrollments(enrichedEnrollments);
    } catch (err: any) {
      console.error('Failed to load student data:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentChange = (enrollmentId: string, field: string, value: any) => {
    setEnrollments(prev => prev.map(enroll =>
      enroll.id === enrollmentId ? { ...enroll, [field]: value } : enroll
    ));
  };

  const handleSaveEnrollment = async (enrollment: EnrollmentWithClass) => {
    try {
      const c1 = enrollment.componentGrade1 !== null && enrollment.componentGrade1 !== undefined && enrollment.componentGrade1 !== '' ? Number(enrollment.componentGrade1) : null;
      const c2 = enrollment.componentGrade2 !== null && enrollment.componentGrade2 !== undefined && enrollment.componentGrade2 !== '' ? Number(enrollment.componentGrade2) : null;
      const fe = enrollment.finalExamGrade !== null && enrollment.finalExamGrade !== undefined && enrollment.finalExamGrade !== '' ? Number(enrollment.finalExamGrade) : null;
      const att = enrollment.attendanceRate !== null && enrollment.attendanceRate !== undefined && enrollment.attendanceRate !== '' ? Number(enrollment.attendanceRate) : null;
      const cr = enrollment.credits !== null && enrollment.credits !== undefined && enrollment.credits !== '' ? Number(enrollment.credits) : 3;

      if (c1 !== null && (c1 < 0 || c1 > 10)) {
        toast.error("Điểm thành phần 1 phải từ 0 đến 10");
        return;
      }
      if (c2 !== null && (c2 < 0 || c2 > 10)) {
        toast.error("Điểm thành phần 2 phải từ 0 đến 10");
        return;
      }
      if (fe !== null && (fe < 0 || fe > 10)) {
        toast.error("Điểm thi cuối kỳ phải từ 0 đến 10");
        return;
      }
      if (att !== null && (att < 0 || att > 100)) {
        toast.error("Tỷ lệ chuyên cần phải từ 0 đến 100");
        return;
      }
      if (cr !== null && (cr < 1 || cr > 10)) {
        toast.error("Số tín chỉ phải từ 1 đến 10");
        return;
      }

      setSaving(prev => ({ ...prev, [enrollment.id]: true }));
      await classService.updateEnrollment(enrollment.id, {
        status: enrollment.status,
        credits: cr,
        componentGrade1: c1 !== null ? c1 : undefined,
        componentGrade2: c2 !== null ? c2 : undefined,
        finalExamGrade: fe !== null ? fe : undefined,
        attendanceRate: att !== null ? att : undefined,
        notes: enrollment.notes || undefined,
      });
      toast.success(`Đã cập nhật điểm cho lớp ${enrollment.classDetails?.className || enrollment.classId}`);
      await loadStudentData();
      setSavedIds(prev => new Set(prev).add(enrollment.id));
      setTimeout(() => {
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(enrollment.id);
          return next;
        });
      }, 2500);
    } catch (err: any) {
      console.error('Failed to update enrollment:', err);
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(prev => ({ ...prev, [enrollment.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải hồ sơ sinh viên...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-semibold mb-4">{error || 'Không tìm thấy sinh viên'}</p>
          <Link to="/teacher/advisor" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const gpaCalc = (() => {
    const gradeMap: Record<string, number> = { 'A+': 4.0, 'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0 };
    const validEnrollments = enrollments.filter(e => 
      e.totalGrade4 !== null && e.totalGrade4 !== undefined || 
      (e.letterGrade && gradeMap[e.letterGrade] !== undefined) ||
      (e.grade && gradeMap[e.grade] !== undefined)
    );
    if (!validEnrollments.length) return 0;
    const sum = validEnrollments.reduce((acc, e) => {
      if (e.totalGrade4 !== null && e.totalGrade4 !== undefined) return acc + e.totalGrade4;
      const key = e.letterGrade || e.grade || '';
      return acc + (gradeMap[key] ?? 0);
    }, 0);
    return sum / validEnrollments.length;
  })();

  // Kết quả tổng kết theo từng học kỳ (điểm học tập)
  const semesterSummary = (() => {
    const groups: Record<string, { academicYear: string; semester: any; items: EnrollmentWithClass[] }> = {};
    enrollments.forEach(e => {
      const yr = e.classDetails?.academicYear || 'N/A';
      const sem = e.classDetails?.semester ?? '?';
      const key = `${yr}||${sem}`;
      if (!groups[key]) groups[key] = { academicYear: yr, semester: sem, items: [] };
      groups[key].items.push(e);
    });
    return Object.values(groups).map(g => {
      const graded = g.items.filter(e => (e.totalGrade4 !== null && e.totalGrade4 !== undefined) || GRADE_POINTS[e.letterGrade || e.grade || ''] !== undefined);
      const gpa = graded.length
        ? graded.reduce((a, e) => a + (e.totalGrade4 !== null && e.totalGrade4 !== undefined ? e.totalGrade4 : (GRADE_POINTS[e.letterGrade || e.grade || ''] ?? 0)), 0) / graded.length
        : null;
      const credits = g.items.reduce((a, e) => a + (Number(e.credits) || 0), 0);
      const failed = g.items.filter(e => (e.letterGrade || e.grade) === 'F').length;
      return { ...g, gpa, credits, failed, count: g.items.length, gradedCount: graded.length };
    }).sort((a, b) => String(a.academicYear).localeCompare(String(b.academicYear)) || Number(a.semester) - Number(b.semester));
  })();

  return (
    <div className="p-6 space-y-6">
      {/* Back header */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <Link
          to="/teacher/advisor"
          className="relative z-10 p-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60 rounded-xl transition-all shadow-sm text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="relative z-10">
          <h1 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">Hồ sơ sinh viên cố vấn</h1>
          <p className="text-xs text-slate-500 font-medium">Tiến độ học tập, điểm tổng kết học kỳ và điểm rèn luyện</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-700" />
            <img
              src={studentIcon}
              alt={`${student.lastName} ${student.firstName}`}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-50 dark:border-slate-800 object-cover shadow-sm bg-white"
            />
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white leading-tight">
              {student.lastName} {student.firstName}
            </h2>
            <p className="text-xs font-bold font-mono text-slate-500 dark:text-slate-500 mt-1.5 uppercase tracking-wider">
              {student.studentCode}
            </p>
             <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-4 border ${
              student.status === 'ACTIVE' || student.status === 'HOAT_DONG'
                ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200/50'
                : 'bg-slate-550/10 text-slate-650 border-slate-200/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'bg-green-500' : 'bg-slate-400'}`} />
              {student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'Đang học' : 'Nghỉ học'}
            </span>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-850 text-left space-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate" title={student.email}>{student.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{student.phoneNumber || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate" title={student.address}>{student.address || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Ngày sinh: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
              </div>
            </div>
          </div>

          {/* GPA mini card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-2 relative z-10">GPA (Hệ 4.0)</p>
            <p className="text-5xl font-black text-amber-400 relative z-10">{gpaCalc.toFixed(2)}</p>
            <div className="w-full bg-blue-950/50 rounded-full h-2 mt-3 relative z-10">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full"
                style={{ width: `${(gpaCalc / 4.0) * 100}%` }}
              />
            </div>
            <p className="text-xs text-blue-300 mt-2.5 relative z-10 font-semibold">{enrollments.length} học phần đã đăng ký</p>
          </div>

          {/* Điểm rèn luyện */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider mb-2 relative z-10">Điểm rèn luyện</p>
            <div className="flex items-end gap-3 relative z-10">
              <p className="text-5xl font-black text-amber-300">{student.conductScore ?? '—'}</p>
              <p className={`text-sm font-bold pb-1.5 ${conductLabel(student.conductScore).cls}`}>{conductLabel(student.conductScore).text}</p>
            </div>
            <div className="w-full bg-emerald-950/50 rounded-full h-2 mt-3 relative z-10">
              <div className="bg-gradient-to-r from-amber-300 to-amber-400 h-2 rounded-full" style={{ width: `${Math.min(100, student.conductScore ?? 0)}%` }} />
            </div>
            <p className="text-xs text-emerald-300 mt-2.5 relative z-10 font-semibold">Thang điểm 100 · do giáo viên cố vấn chấm</p>
          </div>
        </div>

        {/* Right: Grades table */}
        <div className="lg:col-span-2 space-y-5">
          {/* Kết quả tổng kết theo học kỳ */}
          {semesterSummary.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Kết quả tổng kết theo học kỳ
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">Điểm trung bình (hệ 4) và tín chỉ đã đăng ký từng học kỳ</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                {semesterSummary.map((g, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-800/20">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">HK {String(g.semester)} · {g.academicYear}</p>
                      {g.failed > 0 && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">{g.failed} rớt</span>}
                    </div>
                    <div className="flex items-end gap-3 mt-2">
                      <p className="text-3xl font-black text-slate-900 dark:text-white">{g.gpa != null ? g.gpa.toFixed(2) : '—'}</p>
                      <p className="text-xs font-semibold text-slate-500 pb-1">GPA hệ 4</p>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-1">{g.count} học phần · {g.credits} tín chỉ · đã chấm {g.gradedCount}/{g.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tiến độ học tập & Nợ môn (đối chiếu chương trình khung) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" /> Tiến độ học tập & Nợ môn
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">
                  Đối chiếu chương trình khung {progress?.nganh ? `ngành ${progress.nganh}` : ''}
                </p>
              </div>
              {semesterSummary.length > 0 && (
                <select
                  value={selectedSem ? `${selectedSem.namHoc}||${selectedSem.hocKy}` : ''}
                  onChange={(e) => { const [namHoc, hk] = e.target.value.split('||'); setSelectedSem({ namHoc, hocKy: Number(hk) }); }}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                >
                  {semesterSummary.map((g, i) => (
                    <option key={i} value={`${g.academicYear}||${g.semester}`}>HK {String(g.semester)} · {g.academicYear}</option>
                  ))}
                </select>
              )}
            </div>

            {progressLoading ? (
              <div className="text-center py-10"><RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" /></div>
            ) : progress ? (
              <div className="p-4 space-y-4">
                {/* Tổng hợp */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">TC đạt</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{progress.tinChiDat}</p>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50">
                    <p className="text-[10px] font-bold text-rose-600 uppercase">TC nợ/rớt</p>
                    <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{progress.tinChiNo}</p>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50">
                    <p className="text-[10px] font-bold text-orange-600 uppercase">Môn nợ</p>
                    <p className="text-2xl font-black text-orange-700 dark:text-orange-400">{progress.soMonNo}</p>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Môn rớt (F)</p>
                    <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{progress.soMonRot}</p>
                  </div>
                </div>

                {/* Danh sách môn */}
                <div className="space-y-2">
                  {progress.items.map((it, i) => {
                    const cfg = PROGRESS_STATUS[it.status] || PROGRESS_STATUS.DANG_HOC;
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-800/10">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {it.tenMonHoc}
                              {!it.batBuoc && <span className="ml-2 text-[10px] font-bold text-slate-400">(tự chọn)</span>}
                            </p>
                            <p className="text-xs text-slate-500 font-mono">{it.maMonHoc} · {it.soTinChi} TC{it.diemChu ? ` · ${it.diemChu}` : ''}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap ${cfg.cls}`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                  {progress.items.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-6">Chưa có dữ liệu chương trình khung cho ngành/học kỳ này.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-sm text-slate-400 font-semibold">Chưa có dữ liệu tiến độ học tập.</div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Bảng điểm học phần
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">
                Chấm điểm và tỷ lệ chuyên cần. Nhấn "Lưu" để gửi điểm chờ duyệt Admin.
              </p>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-semibold">Sinh viên chưa đăng ký học phần nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="p-5 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {enrollment.classDetails?.subject || enrollment.classDetails?.className || 'Học phần'}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {enrollment.classDetails?.classCode || 'N/A'} · {enrollment.classDetails?.room || 'Phòng N/A'}
                        </p>
                      </div>
                      
                      {/* Calculated result pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {enrollment.totalGrade10 !== null && enrollment.totalGrade10 !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200/50">
                            Hệ 10: {enrollment.totalGrade10.toFixed(2)}
                          </span>
                        )}
                        {enrollment.totalGrade4 !== null && enrollment.totalGrade4 !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50">
                            Hệ 4: {enrollment.totalGrade4.toFixed(2)}
                          </span>
                        )}
                        {(enrollment.letterGrade || enrollment.grade) && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${GRADE_COLORS[enrollment.letterGrade || enrollment.grade || ''] || 'text-slate-650 bg-slate-50 border-slate-200'}`}>
                            {enrollment.letterGrade || enrollment.grade}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tín chỉ</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={enrollment.credits !== undefined && enrollment.credits !== null ? enrollment.credits : 3}
                          onChange={(e) => handleEnrollmentChange(enrollment.id, 'credits', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ĐTK L1 (20%)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          placeholder="—"
                          value={enrollment.componentGrade1 !== undefined && enrollment.componentGrade1 !== null ? enrollment.componentGrade1 : ''}
                          onChange={(e) => handleEnrollmentChange(enrollment.id, 'componentGrade1', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">ĐTK L2 (30%)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          placeholder="—"
                          value={enrollment.componentGrade2 !== undefined && enrollment.componentGrade2 !== null ? enrollment.componentGrade2 : ''}
                          onChange={(e) => handleEnrollmentChange(enrollment.id, 'componentGrade2', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Thi T3 (50%)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          placeholder="—"
                          value={enrollment.finalExamGrade !== undefined && enrollment.finalExamGrade !== null ? enrollment.finalExamGrade : ''}
                          onChange={(e) => handleEnrollmentChange(enrollment.id, 'finalExamGrade', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Chuyên cần (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="—"
                          value={enrollment.attendanceRate !== undefined && enrollment.attendanceRate !== null ? enrollment.attendanceRate : ''}
                          onChange={(e) => handleEnrollmentChange(enrollment.id, 'attendanceRate', e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Ghi chú</label>
                        <input
                          type="text"
                          placeholder="Ghi chú..."
                          value={enrollment.notes || ''}
                          onChange={(e) => handleEnrollmentChange(enrollment.id, 'notes', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handleSaveEnrollment(enrollment)}
                        disabled={saving[enrollment.id]}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
                          savedIds.has(enrollment.id)
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {savedIds.has(enrollment.id) ? (
                          <><CheckCircle className="w-3.5 h-3.5" /> Đã lưu</>
                        ) : (
                          <><Save className="w-3.5 h-3.5" /> {saving[enrollment.id] ? 'Đang lưu...' : 'Lưu điểm'}</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default TeacherStudentDetail;
