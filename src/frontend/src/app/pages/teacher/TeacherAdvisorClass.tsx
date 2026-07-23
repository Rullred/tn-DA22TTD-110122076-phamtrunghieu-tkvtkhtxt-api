import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService } from '../../../services/teacherService';
import { studentService, StudentDto, UpdateStudentRequest } from '../../../services/studentService';
import {
  Search, GraduationCap, RefreshCw, Users, UserPlus, Pencil, UserMinus,
  ArrowRight, Mail, Phone, X, Check, Loader2, Star,
} from 'lucide-react';
import { toast } from 'sonner';
import studentIcon from '../../../assets/student-icon.png';

/**
 * Quản lý lớp cố vấn (advisor class).
 * Nguồn dữ liệu = quan hệ cố vấn thật: sinh viên có giao_vien_co_van_id = giáo viên này.
 * Chức năng: xem danh sách, gán/bỏ cố vấn, sửa hồ sơ, chấm điểm rèn luyện, xem hồ sơ chi tiết.
 */
export function TeacherAdvisorClass() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string>('');
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Inline conduct editing
  const [conductDraft, setConductDraft] = useState<Record<string, string>>({});
  const [savingConduct, setSavingConduct] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentDto | null>(null);

  const isActive = (s: StudentDto) => s.status === 'ACTIVE' || s.status === 'HOAT_DONG';

  const loadStudents = async (tid: string) => {
    try {
      const page = await studentService.getByAdvisor(tid, 0, 200);
      setStudents(page.content || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách sinh viên cố vấn.');
      setStudents([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    async function init() {
      setLoading(true);
      try {
        const me = await teacherService.getMe(user!.email);
        setTeacherId(me.id);
        await loadStudents(me.id);
      } catch (err) {
        console.error(err);
        toast.error('Không thể kết nối đến máy chủ.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  const filteredStudents = useMemo(() => students.filter(s => {
    const fullName = `${s.lastName} ${s.firstName}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      fullName.includes(term) ||
      s.studentCode.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term);
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [students, searchTerm, filterStatus]);

  const activeCount = students.filter(isActive).length;
  const avgConduct = useMemo(() => {
    const scored = students.filter(s => s.conductScore != null);
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((a, s) => a + (s.conductScore || 0), 0) / scored.length);
  }, [students]);

  const handleSaveConduct = async (student: StudentDto) => {
    const raw = conductDraft[student.id];
    if (raw === undefined) return;
    const score = Number(raw);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      toast.error('Điểm rèn luyện phải từ 0 đến 100.');
      return;
    }
    setSavingConduct(student.id);
    try {
      const updated = await studentService.updateConductScore(student.id, score);
      setStudents(prev => prev.map(s => (s.id === student.id ? { ...s, conductScore: updated.conductScore } : s)));
      setConductDraft(prev => { const n = { ...prev }; delete n[student.id]; return n; });
      toast.success(`Đã lưu điểm rèn luyện cho ${student.lastName} ${student.firstName}.`);
    } catch (err) {
      console.error(err);
      toast.error('Lưu điểm rèn luyện thất bại.');
    } finally {
      setSavingConduct('');
    }
  };

  const handleRemove = async (student: StudentDto) => {
    if (!window.confirm(`Bỏ ${student.lastName} ${student.firstName} khỏi lớp cố vấn? (Hồ sơ sinh viên vẫn được giữ trong hệ thống)`)) return;
    try {
      await studentService.updateAdvisor(student.id, null);
      setStudents(prev => prev.filter(s => s.id !== student.id));
      toast.success('Đã bỏ sinh viên khỏi lớp cố vấn.');
    } catch (err) {
      console.error(err);
      toast.error('Thao tác thất bại.');
    }
  };

  const conductBadge = (score: number | null | undefined) => {
    if (score == null) return 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/60 dark:border-slate-700/50';
    if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40';
    if (score >= 65) return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40';
    if (score >= 50) return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40';
    return 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <GraduationCap className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">Quản lý lớp cố vấn</h1>
                <p className="text-blue-200 text-xs font-medium">Sinh viên do bạn trực tiếp cố vấn học tập</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              disabled={!teacherId}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-800 text-sm font-bold shadow-md hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" /> Thêm sinh viên
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5">Tổng sinh viên</p>
              <p className="text-4xl font-black">{students.length}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5">Đang học</p>
              <p className="text-4xl font-black text-emerald-300">{activeCount}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5">Rèn luyện TB</p>
              <p className="text-4xl font-black text-amber-300">{avgConduct ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar + table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, MSSV hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-3.5 pr-8 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang học</option>
            <option value="INACTIVE">Nghỉ học</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Đang tải danh sách sinh viên cố vấn...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="py-3.5 px-5">Sinh viên</th>
                  <th className="py-3.5 px-4">MSSV</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Điểm rèn luyện</th>
                  <th className="py-3.5 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredStudents.map((s) => {
                  const draft = conductDraft[s.id];
                  const dirty = draft !== undefined && draft !== String(s.conductScore ?? '');
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                      <td className="py-4 px-5">
                        <button type="button" onClick={() => navigate(`/teacher/advisor/students/${s.id}`)} className="flex items-center gap-3.5 text-left">
                          <img src={studentIcon} alt={s.lastName} className="w-11 h-11 rounded-full object-cover border-2 border-slate-200/50 dark:border-slate-700/50 bg-white flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{s.lastName} {s.firstName}</p>
                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{s.major || 'Chưa cập nhật ngành'}</p>
                          </div>
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">{s.studentCode}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-400 font-semibold">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />{s.phoneNumber || 'Chưa có'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /><span className="truncate max-w-[160px]">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`relative inline-flex items-center rounded-lg border px-1 ${conductBadge(s.conductScore)}`}>
                            <Star className="w-3.5 h-3.5 ml-1" />
                            <input
                              type="number" min={0} max={100}
                              value={draft !== undefined ? draft : (s.conductScore ?? '')}
                              onChange={(e) => setConductDraft(prev => ({ ...prev, [s.id]: e.target.value }))}
                              placeholder="—"
                              className="w-14 bg-transparent px-1.5 py-1 text-sm font-black text-center focus:outline-none"
                            />
                          </div>
                          {dirty && (
                            <button
                              type="button"
                              onClick={() => handleSaveConduct(s)}
                              disabled={savingConduct === s.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold disabled:opacity-50"
                            >
                              {savingConduct === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Lưu
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={() => setEditStudent(s)} title="Sửa hồ sơ" className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleRemove(s)} title="Bỏ khỏi lớp cố vấn" className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                            <UserMinus className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => navigate(`/teacher/advisor/students/${s.id}`)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors">
                            Hồ sơ <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-semibold">Chưa có sinh viên nào trong lớp cố vấn của bạn</p>
                <p className="text-xs text-slate-400 mt-1">Bấm "Thêm sinh viên" để gán sinh viên vào lớp cố vấn</p>
              </div>
            )}
          </div>
        )}

        {!loading && filteredStudents.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/10">
            <p className="text-xs text-slate-500 font-semibold">
              Hiển thị <span className="text-blue-600 font-black">{filteredStudents.length}</span> / {students.length} sinh viên cố vấn
            </p>
          </div>
        )}
      </div>

      {showAddModal && teacherId && (
        <AddAdvisedStudentModal
          teacherId={teacherId}
          existingIds={new Set(students.map(s => s.id))}
          onClose={() => setShowAddModal(false)}
          onAdded={async () => { await loadStudents(teacherId); }}
        />
      )}

      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSaved={(updated) => {
            setStudents(prev => prev.map(s => (s.id === updated.id ? { ...s, ...updated } : s)));
            setEditStudent(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: thêm sinh viên vào lớp cố vấn (gán advisor)                   */
/* ------------------------------------------------------------------ */
function AddAdvisedStudentModal({ teacherId, existingIds, onClose, onAdded }: {
  teacherId: string;
  existingIds: Set<string>;
  onClose: () => void;
  onAdded: () => Promise<void>;
}) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<StudentDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState<string>('');

  const doSearch = async () => {
    if (!term.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const page = await studentService.searchByName(term.trim(), 0, 20);
      setResults(page.content || []);
    } catch (err) {
      console.error(err);
      toast.error('Tìm kiếm thất bại.');
    } finally {
      setSearching(false);
    }
  };

  const assign = async (s: StudentDto) => {
    setAssigning(s.id);
    try {
      await studentService.updateAdvisor(s.id, teacherId);
      toast.success(`Đã thêm ${s.lastName} ${s.firstName} vào lớp cố vấn.`);
      await onAdded();
      setResults(prev => prev.filter(r => r.id !== s.id));
    } catch (err) {
      console.error(err);
      toast.error('Không thể gán cố vấn.');
    } finally {
      setAssigning('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /> Thêm sinh viên cố vấn</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex gap-2">
            <input
              autoFocus value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Nhập tên sinh viên cần tìm..."
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
            />
            <button onClick={doSearch} disabled={searching} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
            </button>
          </div>

          <div className="space-y-2">
            {results.map(s => {
              const already = existingIds.has(s.id);
              const advisedElsewhere = !!s.advisorId && s.advisorId !== teacherId;
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{s.lastName} {s.firstName}</p>
                    <p className="text-xs text-slate-500 font-mono">{s.studentCode} · {s.major || 'N/A'}</p>
                  </div>
                  {already ? (
                    <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">Đã trong lớp</span>
                  ) : (
                    <button onClick={() => assign(s)} disabled={assigning === s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 whitespace-nowrap">
                      {assigning === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {advisedElsewhere ? 'Chuyển về lớp' : 'Thêm'}
                    </button>
                  )}
                </div>
              );
            })}
            {!searching && term && results.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">Không tìm thấy sinh viên phù hợp.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal: sửa hồ sơ sinh viên                                          */
/* ------------------------------------------------------------------ */
function EditStudentModal({ student, onClose, onSaved }: {
  student: StudentDto;
  onClose: () => void;
  onSaved: (s: StudentDto) => void;
}) {
  const [form, setForm] = useState<UpdateStudentRequest>({
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    email: student.email || '',
    phoneNumber: student.phoneNumber || '',
    dateOfBirth: student.dateOfBirth || '',
    gender: student.gender || 'MALE',
    address: student.address || '',
    status: student.status || 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const updated = await studentService.update(student.id, form);
      toast.success('Đã cập nhật hồ sơ sinh viên.');
      onSaved(updated);
    } catch (err) {
      console.error(err);
      toast.error('Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof UpdateStudentRequest, type = 'text') => (
    <div className="space-y-1">
      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">{label}</label>
      <input
        type={type} value={form[key] as string}
        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2"><Pencil className="w-5 h-5 text-blue-600" /> Sửa hồ sơ sinh viên</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 overflow-y-auto">
          {field('Họ', 'lastName')}
          {field('Tên', 'firstName')}
          {field('Email', 'email', 'email')}
          {field('Điện thoại', 'phoneNumber')}
          {field('Ngày sinh', 'dateOfBirth', 'date')}
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Giới tính</label>
            <select value={form.gender} onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/15">
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <div className="col-span-2">{field('Địa chỉ', 'address')}</div>
          <div className="space-y-1">
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Trạng thái</label>
            <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/15">
              <option value="ACTIVE">Đang học</option>
              <option value="INACTIVE">Nghỉ học</option>
            </select>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200">Hủy</button>
          <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherAdvisorClass;
