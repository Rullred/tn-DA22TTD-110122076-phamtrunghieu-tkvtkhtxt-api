import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService } from '../../../services/teacherService';
import { classService, ClassDto, EnrollmentDto } from '../../../services/classService';
import {
  BookOpen, RefreshCw, Save, CheckCircle, Loader2, FileSpreadsheet, Lock, Users, AlertTriangle, FileQuestion, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'A': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'B+': 'text-blue-700 bg-blue-50 border-blue-200',
  'B': 'text-blue-700 bg-blue-50 border-blue-200',
  'C+': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  'C': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  'D+': 'text-orange-700 bg-orange-50 border-orange-200',
  'D': 'text-orange-700 bg-orange-50 border-orange-200',
  'F': 'text-rose-700 bg-rose-50 border-rose-200',
};

/**
 * Chấm điểm học phần (course-section grading).
 * Giáo viên chọn lớp mình DẠY (lop_hoc.giang_vien_id) → chấm điểm SV đăng ký.
 * "Chốt học kỳ": SV chưa được chấm sẽ bị điểm F.
 */
export function TeacherGrading() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState('');
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [finalizing, setFinalizing] = useState(false);

  const selectedClass = classes.find(c => c.id === selectedClassId) || null;
  const isFinalized = selectedClass?.status === 'DA_HOAN_THANH' || selectedClass?.status === 'COMPLETED';

  useEffect(() => {
    if (!user) return;
    async function init() {
      setLoading(true);
      try {
        const me = await teacherService.getMe(user!.email);
        setTeacherId(me.id);
        const clsPage = await classService.getByTeacher(me.id, 0, 100);
        const list = clsPage.content || [];
        setClasses(list);
        setSelectedClassId(prev => prev || list[0]?.id || '');
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách lớp học phần.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  const loadEnrollments = async (classId: string) => {
    if (!classId) { setEnrollments([]); return; }
    setLoadingRows(true);
    try {
      const page = await classService.getClassEnrollments(classId, 0, 200);
      setEnrollments(page.content || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách sinh viên của lớp.');
      setEnrollments([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => { if (selectedClassId) loadEnrollments(selectedClassId); }, [selectedClassId]);

  const onChange = (id: string, field: keyof EnrollmentDto, value: any) => {
    setEnrollments(prev => prev.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const num = (v: any): number | undefined => (v === '' || v === null || v === undefined ? undefined : Number(v));

  const saveRow = async (e: EnrollmentDto) => {
    const c1 = num(e.componentGrade1), c2 = num(e.componentGrade2), fe = num(e.finalExamGrade);
    const cr = num(e.credits) ?? 3;
    for (const [v, label] of [[c1, 'ĐTK L1'], [c2, 'ĐTK L2'], [fe, 'Thi cuối kỳ']] as [number | undefined, string][]) {
      if (v !== undefined && (v < 0 || v > 10)) { toast.error(`${label} phải từ 0 đến 10`); return; }
    }
    setSaving(prev => ({ ...prev, [e.id]: true }));
    try {
      await classService.updateEnrollment(e.id, {
        credits: cr,
        componentGrade1: c1,
        componentGrade2: c2,
        finalExamGrade: fe,
        notes: e.notes || undefined,
      });
      await loadEnrollments(selectedClassId);
      setSavedIds(prev => new Set(prev).add(e.id));
      setTimeout(() => setSavedIds(prev => { const n = new Set(prev); n.delete(e.id); return n; }), 2000);
      toast.success(`Đã lưu điểm cho ${e.studentName || e.studentCode || 'sinh viên'}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lưu điểm thất bại');
    } finally {
      setSaving(prev => ({ ...prev, [e.id]: false }));
    }
  };

  const handleFinalize = async () => {
    if (!selectedClass) return;
    const ungraded = enrollments.filter(e => e.totalGrade10 == null && e.status !== 'THAT_BAI').length;
    if (!window.confirm(
      `Chốt học kỳ cho lớp "${selectedClass.className}"?\n\n${ungraded} sinh viên chưa được chấm sẽ bị điểm F (rớt môn). Thao tác này khóa lớp lại.`
    )) return;
    setFinalizing(true);
    try {
      const failed = await classService.finalizeClass(selectedClass.id);
      toast.success(`Đã chốt học kỳ. ${failed} sinh viên bị điểm F.`);
      // Cập nhật trạng thái lớp cục bộ + tải lại điểm
      setClasses(prev => prev.map(c => (c.id === selectedClass.id ? { ...c, status: 'DA_HOAN_THANH' } : c)));
      await loadEnrollments(selectedClass.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Chốt học kỳ thất bại');
    } finally {
      setFinalizing(false);
    }
  };

  const exportExcel = () => {
    if (!selectedClass || enrollments.length === 0) { toast.warning('Không có dữ liệu để xuất.'); return; }
    const rows = enrollments.map((e, i) => ({
      'STT': i + 1,
      'MSSV': e.studentCode || '',
      'Họ tên': e.studentName || '',
      'Tín chỉ': e.credits ?? '',
      'ĐTK L1 (20%)': e.componentGrade1 ?? '',
      'ĐTK L2 (30%)': e.componentGrade2 ?? '',
      'Thi (50%)': e.finalExamGrade ?? '',
      'Tổng kết (10)': e.totalGrade10 ?? '',
      'Hệ 4': e.totalGrade4 ?? '',
      'Điểm chữ': e.letterGrade ?? '',
      'Kết quả': e.letterGrade === 'F' ? 'Rớt' : (e.totalGrade10 != null ? 'Đạt' : 'Chưa chấm'),
      'Ghi chú': e.notes ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BangDiem');
    XLSX.writeFile(wb, `BangDiem_${selectedClass.classCode || selectedClass.className}.xlsx`);
  };

  const statusPill = (e: EnrollmentDto) => {
    if (e.letterGrade) {
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${GRADE_COLORS[e.letterGrade] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
          {e.letterGrade}{e.letterGrade === 'F' && ' · Rớt'}
        </span>
      );
    }
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-800">Chưa chấm</span>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl"><BookOpen className="w-6 h-6 text-amber-300" /></div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Lớp học phần & Chấm điểm</h1>
            <p className="text-blue-200 text-xs font-medium">Chấm điểm sinh viên các môn bạn giảng dạy học kỳ này</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Đang tải lớp học phần...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/50 dark:border-slate-800/50 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-semibold">Bạn chưa được phân công giảng dạy lớp học phần nào</p>
          <p className="text-xs text-slate-400 mt-1">Liên hệ Admin để được phân công môn học</p>
        </div>
      ) : (
        <>
          {/* Class chips */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Lớp học phần đang giảng dạy ({classes.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {classes.map(cls => {
                const done = cls.status === 'DA_HOAN_THANH' || cls.status === 'COMPLETED';
                return (
                  <button
                    key={cls.id} type="button" onClick={() => setSelectedClassId(cls.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-left transition-all ${
                      selectedClassId === cls.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30 hover:border-blue-400'
                    }`}
                  >
                    <span className={`text-sm font-bold ${selectedClassId === cls.id ? 'text-white' : 'text-blue-800 dark:text-blue-300'}`}>{cls.subject || cls.className}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-lg ${selectedClassId === cls.id ? 'bg-white/15 text-white' : 'text-blue-500 bg-blue-100 dark:bg-blue-900/40'}`}>{cls.classCode}</span>
                    {done && <Lock className={`w-3.5 h-3.5 ${selectedClassId === cls.id ? 'text-amber-200' : 'text-amber-500'}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedClass && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedClass.subject || selectedClass.className}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã lớp <span className="font-mono font-bold">{selectedClass.classCode}</span> · HK{selectedClass.semester} {selectedClass.academicYear} ·
                    <span className="inline-flex items-center gap-1 ml-1"><Users className="w-3.5 h-3.5" />{enrollments.length} SV</span>
                    {isFinalized && <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-bold"><Lock className="w-3.5 h-3.5" /> Đã chốt</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/teacher/course/${selectedClass.id}`)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-900/40 bg-white dark:bg-slate-950 text-sky-700 dark:text-sky-400 text-xs font-bold hover:border-sky-400 transition-colors">
                    <FileText className="w-4 h-4" /> Nội dung học tập
                  </button>
                  <button onClick={() => navigate(`/teacher/quiz/${selectedClass.id}`)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-slate-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold hover:border-indigo-400 transition-colors">
                    <FileQuestion className="w-4 h-4" /> Trắc nghiệm
                  </button>
                  <button onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:border-emerald-400 transition-colors">
                    <FileSpreadsheet className="w-4 h-4" /> Xuất Excel
                  </button>
                  <button
                    onClick={handleFinalize} disabled={finalizing || isFinalized}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {isFinalized ? 'Đã chốt học kỳ' : 'Chốt học kỳ'}
                  </button>
                </div>
              </div>

              {isFinalized && (
                <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" /> Lớp đã chốt học kỳ. Các sinh viên chưa chấm đã bị điểm F. Không thể sửa điểm.
                </div>
              )}

              {/* Grade table */}
              {loadingRows ? (
                <div className="text-center py-14"><Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" /></div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-14">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-semibold">Chưa có sinh viên đăng ký lớp này</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/70 dark:bg-slate-800/20">
                        <th className="py-3 px-4">Sinh viên</th>
                        <th className="py-3 px-2 text-center">TC</th>
                        <th className="py-3 px-2 text-center">TP1 (20%)</th>
                        <th className="py-3 px-2 text-center">TP2 (30%)</th>
                        <th className="py-3 px-2 text-center">Thi (50%)</th>
                        <th className="py-3 px-2 text-center">Tổng 10</th>
                        <th className="py-3 px-2 text-center">Trạng thái</th>
                        <th className="py-3 px-2">Ghi chú</th>
                        <th className="py-3 px-3 text-right">Lưu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                      {enrollments.map((e) => {
                        const cellCls = "w-16 px-1.5 py-1.5 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold disabled:bg-slate-100 disabled:text-slate-400";
                        return (
                          <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                            <td className="py-2.5 px-4">
                              <p className="font-bold text-slate-900 dark:text-white">{e.studentName || '—'}</p>
                              <p className="font-mono text-slate-500">{e.studentCode}</p>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <input type="number" min={1} max={10} disabled={isFinalized}
                                value={e.credits ?? 3} onChange={(ev) => onChange(e.id, 'credits', ev.target.value === '' ? '' : parseInt(ev.target.value))}
                                className={cellCls} />
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <input type="number" min={0} max={10} step={0.1} placeholder="—" disabled={isFinalized}
                                value={e.componentGrade1 ?? ''} onChange={(ev) => onChange(e.id, 'componentGrade1', ev.target.value === '' ? '' : parseFloat(ev.target.value))}
                                className={cellCls} />
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <input type="number" min={0} max={10} step={0.1} placeholder="—" disabled={isFinalized}
                                value={e.componentGrade2 ?? ''} onChange={(ev) => onChange(e.id, 'componentGrade2', ev.target.value === '' ? '' : parseFloat(ev.target.value))}
                                className={cellCls} />
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <input type="number" min={0} max={10} step={0.1} placeholder="—" disabled={isFinalized}
                                value={e.finalExamGrade ?? ''} onChange={(ev) => onChange(e.id, 'finalExamGrade', ev.target.value === '' ? '' : parseFloat(ev.target.value))}
                                className={cellCls} />
                            </td>
                            <td className="py-2.5 px-2 text-center font-black text-slate-900 dark:text-white">
                              {e.totalGrade10 != null ? e.totalGrade10.toFixed(2) : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-center">{statusPill(e)}</td>
                            <td className="py-2.5 px-2">
                              <input type="text" placeholder="Ghi chú..." disabled={isFinalized}
                                value={e.notes || ''} onChange={(ev) => onChange(e.id, 'notes', ev.target.value)}
                                className="w-full min-w-[110px] px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold disabled:bg-slate-100" />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button onClick={() => saveRow(e)} disabled={saving[e.id] || isFinalized}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-50 ${savedIds.has(e.id) ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {savedIds.has(e.id) ? <><CheckCircle className="w-3.5 h-3.5" /> Đã lưu</> : saving[e.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Lưu</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TeacherGrading;
