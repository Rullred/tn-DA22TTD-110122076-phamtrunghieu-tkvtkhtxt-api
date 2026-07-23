import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService } from '../../../services/teacherService';
import { classService, ClassDto } from '../../../services/classService';
import { quizService, QuizDto } from '../../../services/quizService';
import {
  learningService, LearningItemDto, SubmissionDto,
} from '../../../services/learningService';
import { CourseForum } from '../../components/CourseForum';
import {
  ArrowLeft, Plus, Trash2, Loader2, Upload, Link2, FileText, ClipboardList,
  FileQuestion, Eye, EyeOff, Download, Save, Users, Award, Clock, Pencil, X, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

function fmtSize(n?: number | null) {
  if (!n) return '';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}
function fmtDate(s?: string | null) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function TeacherCourseContent() {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [classInfo, setClassInfo] = useState<ClassDto | null>(null);
  const [items, setItems] = useState<LearningItemDto[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [busy, setBusy] = useState(false);

  // submissions panel
  const [openSubItem, setOpenSubItem] = useState<string | null>(null);
  const [subs, setSubs] = useState<Record<string, SubmissionDto[]>>({});
  const [gradeEdit, setGradeEdit] = useState<Record<string, { grade: string; feedback: string }>>({});

  // create/edit modal
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; type: 'TAI_LIEU' | 'BAI_TAP'; id?: string } | null>(null);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mDue, setMDue] = useState('');
  const [mMax, setMMax] = useState<number>(10);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<string>('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const me = await teacherService.getMe(user.email).catch(() => null);
        if (me) {
          setTeacherId(me.id);
          setTeacherName(`${me.lastName || ''} ${me.firstName || ''}`.trim() || (user.name || ''));
        }
        setClassInfo(await classService.getById(classId).catch(() => null));
        await Promise.all([reloadItems(), reloadQuizzes()]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, classId]);

  const reloadItems = async () => setItems(await learningService.teacherItems(classId).catch(() => []));
  const reloadQuizzes = async () => setQuizzes(await quizService.listByClass(classId).catch(() => []));

  const openCreate = (type: 'TAI_LIEU' | 'BAI_TAP') => {
    setModal({ mode: 'create', type });
    setMTitle(''); setMDesc(''); setMDue(''); setMMax(10);
  };
  const openEdit = (it: LearningItemDto) => {
    setModal({ mode: 'edit', type: it.type, id: it.id });
    setMTitle(it.title); setMDesc(it.description || '');
    setMDue(it.dueDate ? it.dueDate.slice(0, 16) : '');
    setMMax(it.maxScore ?? 10);
  };

  const saveModal = async () => {
    if (!modal) return;
    if (!mTitle.trim()) { toast.error('Nhập tiêu đề.'); return; }
    setBusy(true);
    try {
      const payload = {
        title: mTitle.trim(),
        description: mDesc.trim() || undefined,
        dueDate: modal.type === 'BAI_TAP' ? (mDue ? mDue : null) : null,
        maxScore: modal.type === 'BAI_TAP' ? mMax : null,
      };
      if (modal.mode === 'create') {
        await learningService.createItem(classId, { type: modal.type, ...payload });
        toast.success(modal.type === 'BAI_TAP' ? 'Đã tạo bài tập.' : 'Đã tạo tài liệu.');
      } else {
        await learningService.updateItem(modal.id!, payload);
        toast.success('Đã cập nhật.');
      }
      setModal(null);
      await reloadItems();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const triggerUpload = (itemId: string) => {
    uploadTargetRef.current = itemId;
    fileInputRef.current?.click();
  };
  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadTargetRef.current) return;
    setBusy(true);
    try {
      await learningService.attachFile(uploadTargetRef.current, file);
      toast.success('Đã tải tệp lên.');
      await reloadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tải tệp thất bại.');
    } finally {
      setBusy(false);
    }
  };
  const addLink = async (itemId: string) => {
    const url = window.prompt('Dán liên kết (URL):');
    if (!url) return;
    const title = window.prompt('Tên hiển thị (tùy chọn):') || undefined;
    try {
      await learningService.attachLink(itemId, url, title);
      toast.success('Đã thêm liên kết.');
      await reloadItems();
    } catch { toast.error('Thêm liên kết thất bại.'); }
  };
  const removeFile = async (fileId: string) => {
    if (!window.confirm('Xóa tệp/liên kết này?')) return;
    try { await learningService.removeFile(fileId); await reloadItems(); }
    catch { toast.error('Xóa thất bại.'); }
  };

  const toggleVisible = async (it: LearningItemDto) => {
    try { await learningService.updateItem(it.id, { visible: !it.visible }); await reloadItems(); }
    catch { toast.error('Cập nhật hiển thị thất bại.'); }
  };
  const deleteItem = async (it: LearningItemDto) => {
    if (!window.confirm(`Xóa "${it.title}" cùng tệp và bài nộp?`)) return;
    try { await learningService.deleteItem(it.id); toast.success('Đã xóa.'); await reloadItems(); }
    catch { toast.error('Xóa thất bại.'); }
  };

  const openSubmissions = async (itemId: string) => {
    if (openSubItem === itemId) { setOpenSubItem(null); return; }
    setOpenSubItem(itemId);
    try {
      const list = await learningService.itemSubmissions(itemId);
      setSubs(prev => ({ ...prev, [itemId]: list }));
      const ge: Record<string, { grade: string; feedback: string }> = {};
      list.forEach(s => { ge[s.id] = { grade: s.grade != null ? String(s.grade) : '', feedback: s.feedback || '' }; });
      setGradeEdit(prev => ({ ...prev, ...ge }));
    } catch { toast.error('Không tải được bài nộp.'); }
  };
  const saveGrade = async (sub: SubmissionDto) => {
    const g = gradeEdit[sub.id];
    const grade = g.grade === '' ? null : Number(g.grade);
    if (grade != null && (grade < 0 || grade > 10)) { toast.error('Điểm phải từ 0 đến 10.'); return; }
    setBusy(true);
    try {
      await learningService.gradeSubmission(sub.id, { grade, feedback: g.feedback || undefined, teacherId: teacherId || undefined });
      toast.success(`Đã chấm cho ${sub.studentName || sub.studentCode}.`);
      const list = await learningService.itemSubmissions(sub.itemId);
      setSubs(prev => ({ ...prev, [sub.itemId]: list }));
      await reloadItems();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Chấm điểm thất bại.');
    } finally { setBusy(false); }
  };

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>;

  return (
    <div className="p-6 space-y-6">
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFilePicked}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.png,.jpg,.jpeg,.gif,.webp" />

      {/* Header */}
      <div className="bg-gradient-to-br from-sky-900 to-blue-950 rounded-3xl p-6 shadow-xl text-white">
        <button onClick={() => navigate('/teacher/classes')} className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-200 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4" /> Về Lớp học phần
        </button>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl"><FileText className="w-6 h-6 text-amber-300" /></div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Nội dung học tập — {classInfo?.subject || classInfo?.className || 'Lớp học phần'}</h1>
              <p className="text-sky-200 text-xs font-medium">Mã lớp <span className="font-mono font-bold">{classInfo?.classCode}</span> · Đăng tài liệu, ra bài tập cho sinh viên nộp</p>
            </div>
          </div>
          <button onClick={() => navigate(`/teacher/quiz/${classId}`)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold">
            <FileQuestion className="w-4 h-4" /> Trắc nghiệm
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => openCreate('TAI_LIEU')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow">
          <Plus className="w-4 h-4" /> Thêm Tài liệu
        </button>
        <button onClick={() => openCreate('BAI_TAP')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow">
          <Plus className="w-4 h-4" /> Thêm Bài tập
        </button>
        <button onClick={() => { reloadItems(); reloadQuizzes(); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/60 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-semibold">Chưa có nội dung nào. Bấm "Thêm Tài liệu" hoặc "Thêm Bài tập".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const isAssign = it.type === 'BAI_TAP';
            return (
              <div key={it.id} className={`bg-white rounded-2xl border shadow-sm ${it.visible ? 'border-slate-200/60' : 'border-slate-200/60 opacity-70'}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${isAssign ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {isAssign ? <ClipboardList className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {isAssign ? 'Bài tập' : 'Tài liệu'}
                        </span>
                        <h3 className="font-extrabold text-slate-800">{it.title}</h3>
                        {!it.visible && <span className="text-[11px] font-bold text-slate-400">(đang ẩn)</span>}
                      </div>
                      {it.description && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{it.description}</p>}
                      {isAssign && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                          {it.dueDate && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Hạn: {fmtDate(it.dueDate)}</span>}
                          <span className="inline-flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Thang {it.maxScore ?? 10}đ</span>
                          <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {it.submissionCount ?? 0} bài nộp</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toggleVisible(it)} title={it.visible ? 'Ẩn' : 'Hiện'} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
                        {it.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(it)} title="Sửa" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteItem(it)} title="Xóa" className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {/* Files */}
                  {(it.files && it.files.length > 0) && (
                    <div className="mt-3 space-y-1.5">
                      {it.files.map(f => (
                        <div key={f.id} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                          {f.link ? <Link2 className="w-4 h-4 text-sky-600 shrink-0" /> : <FileText className="w-4 h-4 text-slate-500 shrink-0" />}
                          <button onClick={() => learningService.downloadFile(f)} className="font-semibold text-blue-700 hover:underline truncate">{f.fileName}</button>
                          {!f.link && f.size ? <span className="text-xs text-slate-400">({fmtSize(f.size)})</span> : null}
                          <button onClick={() => removeFile(f.id)} className="ml-auto p-1 rounded text-slate-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attach + submissions actions */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button onClick={() => triggerUpload(it.id)} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 disabled:opacity-50">
                      <Upload className="w-3.5 h-3.5" /> Đính kèm tệp
                    </button>
                    <button onClick={() => addLink(it.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50">
                      <Link2 className="w-3.5 h-3.5" /> Đính kèm liên kết
                    </button>
                    {isAssign && (
                      <button onClick={() => openSubmissions(it.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold">
                        <Users className="w-3.5 h-3.5" /> {openSubItem === it.id ? 'Ẩn bài nộp' : 'Xem & chấm bài nộp'}
                      </button>
                    )}
                  </div>

                  {/* Submissions table */}
                  {isAssign && openSubItem === it.id && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      {(subs[it.id]?.length ?? 0) === 0 ? (
                        <p className="text-sm text-slate-500 font-semibold text-center py-4">Chưa có sinh viên nộp bài.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                <th className="py-2 pr-3">Sinh viên</th>
                                <th className="py-2 px-2">Bài nộp</th>
                                <th className="py-2 px-2 text-center">Điểm</th>
                                <th className="py-2 px-2">Nhận xét</th>
                                <th className="py-2 pl-2 text-right">Lưu</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {subs[it.id].map(s => (
                                <tr key={s.id}>
                                  <td className="py-2 pr-3">
                                    <p className="font-bold text-slate-800">{s.studentName || '—'}</p>
                                    <p className="font-mono text-slate-500">{s.studentCode}</p>
                                  </td>
                                  <td className="py-2 px-2">
                                    <button onClick={() => learningService.downloadSubmission(s)} className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline">
                                      <Download className="w-3.5 h-3.5" /> {s.fileName}
                                    </button>
                                    <p className="text-slate-400">{fmtDate(s.submittedAt)} {s.late && <span className="text-rose-600 font-bold">· nộp trễ</span>}</p>
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    <input type="number" min={0} max={10} step={0.1} value={gradeEdit[s.id]?.grade ?? ''} placeholder="—"
                                      onChange={(e) => setGradeEdit(p => ({ ...p, [s.id]: { ...p[s.id], grade: e.target.value } }))}
                                      className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input type="text" value={gradeEdit[s.id]?.feedback ?? ''} placeholder="Nhận xét..."
                                      onChange={(e) => setGradeEdit(p => ({ ...p, [s.id]: { ...p[s.id], feedback: e.target.value } }))}
                                      className="w-full min-w-[140px] px-2.5 py-1 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
                                  </td>
                                  <td className="py-2 pl-2 text-right">
                                    <button onClick={() => saveGrade(s)} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold disabled:opacity-50">
                                      <Save className="w-3.5 h-3.5" /> Lưu
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quizzes section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <FileQuestion className="w-4 h-4" /> Bài trắc nghiệm ({quizzes.length})
          </h3>
          <button onClick={() => navigate(`/teacher/quiz/${classId}`)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Quản lý trắc nghiệm →</button>
        </div>
        {quizzes.length === 0 ? (
          <p className="text-xs text-slate-400 mt-2">Chưa có bài trắc nghiệm. Vào "Quản lý trắc nghiệm" để tạo.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {quizzes.map(q => (
              <div key={q.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                <span className="font-semibold text-slate-700">{q.title}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${q.status === 'DA_XUAT_BAN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {q.status === 'DA_XUAT_BAN' ? 'Đã xuất bản' : q.status === 'DONG' ? 'Đã đóng' : 'Nháp'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diễn đàn */}
      {teacherId && <CourseForum classId={classId} authorId={teacherId} authorName={teacherName} authorRole="GIANG_VIEN" canModerate />}

      {/* Create/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">
              {modal.mode === 'create' ? 'Thêm' : 'Sửa'} {modal.type === 'BAI_TAP' ? 'Bài tập' : 'Tài liệu'}
            </h3>
            <label className="text-xs font-semibold text-slate-600">Tiêu đề *
              <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder={modal.type === 'BAI_TAP' ? 'VD: Thực hành buổi 1' : 'VD: Slide bài giảng chương 1'}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <label className="text-xs font-semibold text-slate-600 block mt-3">Mô tả / hướng dẫn (tùy chọn)
              <textarea value={mDesc} onChange={(e) => setMDesc(e.target.value)} rows={4}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
            </label>
            {modal.type === 'BAI_TAP' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="text-xs font-semibold text-slate-600">Hạn nộp (tùy chọn)
                  <input type="datetime-local" value={mDue} onChange={(e) => setMDue(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="text-xs font-semibold text-slate-600">Thang điểm
                  <input type="number" min={1} step={0.5} value={mMax} onChange={(e) => setMMax(parseFloat(e.target.value) || 10)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
                </label>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-3">Sau khi tạo, bấm "Đính kèm tệp" để tải PDF/Word/PPT… hoặc "Đính kèm liên kết".</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">Hủy</button>
              <button onClick={saveModal} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {modal.mode === 'create' ? 'Tạo' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherCourseContent;
