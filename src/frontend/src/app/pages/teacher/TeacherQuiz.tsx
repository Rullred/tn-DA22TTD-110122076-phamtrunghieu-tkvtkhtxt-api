import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService } from '../../../services/teacherService';
import { classService, ClassDto } from '../../../services/classService';
import {
  quizService, QuizDto, QuizQuestionDto, QuizResultRowDto,
} from '../../../services/quizService';
import {
  ArrowLeft, Plus, Trash2, Save, Loader2, Wand2, Send, Lock, ListChecks,
  FileQuestion, Award, RefreshCw, CheckCircle, AlertTriangle, Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// Mô hình câu hỏi có thể chỉnh sửa cục bộ trước khi lưu về server.
interface EditQuestion {
  id?: string;
  content: string;
  enabled: boolean;
  needsReview?: boolean;
  choices: { id?: string; content: string; correct: boolean }[];
}

const PLACEHOLDER = `Dán đề vào đây. Ví dụ:

Câu 1: Thủ đô của Việt Nam là?
A. Hà Nội
B. Đà Nẵng
C. TP. Hồ Chí Minh
D. Huế
Đáp án: A

Câu 2: 2 + 3 = ?
A. 4
B. 5
C. 6
Đáp án: B`;

export function TeacherQuiz() {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState('');
  const [classInfo, setClassInfo] = useState<ClassDto | null>(null);
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);

  const [view, setView] = useState<'list' | 'editor' | 'results'>('list');
  const [current, setCurrent] = useState<QuizDto | null>(null);
  const [questions, setQuestions] = useState<EditQuestion[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<QuizResultRowDto[]>([]);

  // Form tạo bài mới
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPaste, setNewPaste] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const me = await teacherService.getMe(user.email).catch(() => null);
        if (me) setTeacherId(me.id);
        const cls = await classService.getById(classId).catch(() => null);
        setClassInfo(cls);
        await reloadQuizzes();
      } catch (e) {
        console.error(e);
        toast.error('Không tải được dữ liệu lớp học phần.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, classId]);

  const reloadQuizzes = async () => {
    const list = await quizService.listByClass(classId).catch(() => []);
    setQuizzes(list);
  };

  const toEdit = (qs: QuizQuestionDto[] = []): EditQuestion[] =>
    qs.map(q => ({
      id: q.id,
      content: q.content,
      enabled: q.enabled ?? true,
      needsReview: q.needsReview,
      choices: (q.choices || []).map(c => ({ id: c.id, content: c.content, correct: !!c.correct })),
    }));

  const openEditor = async (quizId: string) => {
    setBusy(true);
    try {
      const detail = await quizService.get(quizId);
      setCurrent(detail);
      setQuestions(toEdit(detail.questions));
      setPasteText('');
      setView('editor');
    } catch {
      toast.error('Không mở được bài trắc nghiệm.');
    } finally {
      setBusy(false);
    }
  };

  const openResults = async (quiz: QuizDto) => {
    setBusy(true);
    try {
      setCurrent(quiz);
      const rows = await quizService.getResults(quiz.id);
      setResults(rows);
      setView('results');
    } catch {
      toast.error('Không tải được bảng điểm.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Nhập tiêu đề bài trắc nghiệm.'); return; }
    setBusy(true);
    try {
      const quiz = await quizService.create({
        classId, teacherId: teacherId || undefined,
        title: newTitle.trim(), description: newDesc.trim() || undefined,
      });
      // Nếu GV đã dán đề ngay ở bước tạo -> tách câu hỏi luôn.
      if (newPaste.trim()) {
        try {
          const detail = await quizService.parseQuestions(quiz.id, newPaste, true);
          const review = (detail.questions || []).filter(q => q.needsReview).length;
          toast.success(`Đã tạo bài và tách ${detail.questions?.length || 0} câu hỏi.` +
            (review ? ` (${review} câu chưa rõ đáp án — hãy chọn lại)` : ''));
        } catch (pe: any) {
          toast.warning('Đã tạo bài, nhưng chưa tách được câu hỏi — hãy dán lại ở khung "Tách câu hỏi".');
        }
      } else {
        toast.success('Đã tạo bài trắc nghiệm.');
      }
      setShowCreate(false); setNewTitle(''); setNewDesc(''); setNewPaste('');
      await reloadQuizzes();
      openEditor(quiz.id);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Tạo bài thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteQuiz = async (quiz: QuizDto) => {
    if (!window.confirm(`Xóa bài "${quiz.title}" cùng toàn bộ câu hỏi và bài làm?`)) return;
    try {
      await quizService.remove(quiz.id);
      toast.success('Đã xóa bài trắc nghiệm.');
      if (current?.id === quiz.id) { setView('list'); setCurrent(null); }
      await reloadQuizzes();
    } catch {
      toast.error('Xóa thất bại.');
    }
  };

  const handleParse = async () => {
    if (!current) return;
    if (!pasteText.trim()) { toast.error('Dán nội dung câu hỏi trước.'); return; }
    setParsing(true);
    try {
      const detail = await quizService.parseQuestions(current.id, pasteText, true);
      setQuestions(toEdit(detail.questions));
      setCurrent(detail);
      setPasteText('');
      const review = (detail.questions || []).filter(q => q.needsReview).length;
      toast.success(`Đã tách ${detail.questions?.length || 0} câu hỏi.` +
        (review ? ` (${review} câu chưa rõ đáp án — hãy chọn lại)` : ''));
      await reloadQuizzes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Tách câu hỏi thất bại.');
    } finally {
      setParsing(false);
    }
  };

  // --- chỉnh sửa cục bộ ---
  const setQ = (i: number, patch: Partial<EditQuestion>) =>
    setQuestions(prev => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const setChoice = (qi: number, ci: number, patch: Partial<EditQuestion['choices'][number]>) =>
    setQuestions(prev => prev.map((q, idx) => idx !== qi ? q :
      { ...q, choices: q.choices.map((c, j) => (j === ci ? { ...c, ...patch } : c)) }));
  const setCorrect = (qi: number, ci: number) =>
    setQuestions(prev => prev.map((q, idx) => idx !== qi ? q :
      { ...q, needsReview: false, choices: q.choices.map((c, j) => ({ ...c, correct: j === ci })) }));
  const addChoice = (qi: number) =>
    setQuestions(prev => prev.map((q, idx) => idx !== qi ? q :
      { ...q, choices: [...q.choices, { content: '', correct: false }] }));
  const removeChoice = (qi: number, ci: number) =>
    setQuestions(prev => prev.map((q, idx) => idx !== qi ? q :
      { ...q, choices: q.choices.filter((_, j) => j !== ci) }));

  const addQuestion = () =>
    setQuestions(prev => [...prev, {
      content: '', enabled: true,
      choices: [{ content: '', correct: true }, { content: '', correct: false }],
    }]);

  const saveQuestion = async (i: number) => {
    if (!current) return;
    const q = questions[i];
    if (!q.content.trim()) { toast.error('Nội dung câu hỏi trống.'); return; }
    if (q.choices.length < 2) { toast.error('Cần ít nhất 2 lựa chọn.'); return; }
    if (!q.choices.some(c => c.correct)) { toast.error('Chọn 1 đáp án đúng.'); return; }
    if (q.choices.some(c => !c.content.trim())) { toast.error('Có lựa chọn để trống.'); return; }
    setBusy(true);
    try {
      const payload = {
        content: q.content.trim(), enabled: q.enabled,
        choices: q.choices.map(c => ({ content: c.content.trim(), correct: c.correct })),
      };
      if (q.id) await quizService.updateQuestion(q.id, payload);
      else await quizService.addQuestion(current.id, payload);
      toast.success('Đã lưu câu hỏi.');
      await refreshEditor();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lưu câu hỏi thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const deleteQuestion = async (i: number) => {
    const q = questions[i];
    if (q.id) {
      if (!window.confirm('Xóa câu hỏi này?')) return;
      try { await quizService.deleteQuestion(q.id); toast.success('Đã xóa câu hỏi.'); await refreshEditor(); }
      catch { toast.error('Xóa thất bại.'); }
    } else {
      setQuestions(prev => prev.filter((_, idx) => idx !== i));
    }
  };

  const toggleEnabled = async (i: number) => {
    const q = questions[i];
    setQ(i, { enabled: !q.enabled });
    if (q.id) {
      try {
        await quizService.updateQuestion(q.id, {
          content: q.content.trim(), enabled: !q.enabled,
          choices: q.choices.map(c => ({ content: c.content.trim(), correct: c.correct })),
        });
        await reloadQuizzes();
      } catch { toast.error('Cập nhật trạng thái câu hỏi thất bại.'); }
    }
  };

  const refreshEditor = async () => {
    if (!current) return;
    const detail = await quizService.get(current.id);
    setCurrent(detail);
    setQuestions(toEdit(detail.questions));
    await reloadQuizzes();
  };

  const saveSettings = async (patch: { questionsPerAttempt?: number | null; timeLimitMinutes?: number | null; maxScore?: number | null }) => {
    if (!current) return;
    try {
      const updated = await quizService.update(current.id, patch);
      setCurrent(c => (c ? { ...c, ...updated } : updated));
      toast.success('Đã lưu thiết lập.');
    } catch { toast.error('Lưu thiết lập thất bại.'); }
  };

  const changeStatus = async (status: QuizDto['status']) => {
    if (!current) return;
    const enabledCount = questions.filter(q => q.enabled && q.id).length;
    if (status === 'DA_XUAT_BAN' && enabledCount === 0) {
      toast.error('Cần ít nhất 1 câu hỏi đã lưu để xuất bản.'); return;
    }
    try {
      const updated = await quizService.update(current.id, { status });
      setCurrent(c => (c ? { ...c, status: updated.status } : updated));
      await reloadQuizzes();
      toast.success(status === 'DA_XUAT_BAN' ? 'Đã xuất bản — sinh viên có thể làm bài.'
        : status === 'DONG' ? 'Đã đóng bài trắc nghiệm.' : 'Đã chuyển về nháp.');
    } catch { toast.error('Đổi trạng thái thất bại.'); }
  };

  const handleExport = async () => {
    if (!current) return;
    if (!window.confirm('Xuất điểm cao nhất của mỗi SV vào "Điểm thành phần 1 (điểm quá trình)" của lớp? Thao tác này ghi đè điểm thành phần 1 hiện có.')) return;
    setBusy(true);
    try {
      const n = await quizService.exportGrades(current.id);
      toast.success(`Đã xuất điểm quá trình cho ${n} sinh viên.`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xuất điểm thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const statusPill = (s?: string) => {
    const map: Record<string, string> = {
      NHAP: 'bg-slate-100 text-slate-600 border-slate-200',
      DA_XUAT_BAN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      DONG: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    const label: Record<string, string> = { NHAP: 'Nháp', DA_XUAT_BAN: 'Đã xuất bản', DONG: 'Đã đóng' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${map[s || 'NHAP']}`}>{label[s || 'NHAP']}</span>;
  };

  if (loading) {
    return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-violet-950 rounded-3xl p-6 shadow-xl text-white">
        <button onClick={() => navigate('/teacher/classes')} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-200 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4" /> Về Lớp học phần
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl"><FileQuestion className="w-6 h-6 text-amber-300" /></div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Trắc nghiệm — {classInfo?.subject || classInfo?.className || 'Lớp học phần'}</h1>
            <p className="text-indigo-200 text-xs font-medium">
              Mã lớp <span className="font-mono font-bold">{classInfo?.classCode}</span> · Tạo bài, dán đề tự tách câu hỏi, cho SV làm và xuất điểm quá trình
            </p>
          </div>
        </div>
      </div>

      {/* ---------- LIST ---------- */}
      {view === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Danh sách bài trắc nghiệm ({quizzes.length})
            </h2>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md">
              <Plus className="w-4 h-4" /> Tạo bài mới
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/60 text-center">
              <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-semibold">Chưa có bài trắc nghiệm nào cho lớp này</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {quizzes.map(q => (
                <div key={q.id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-800">{q.title}</h3>
                      {statusPill(q.status)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {q.enabledQuestions ?? 0}/{q.totalQuestions ?? 0} câu đang bật ·
                      Bốc {q.questionsPerAttempt || 'tất cả'} câu/lượt · Thang {q.maxScore ?? 10}đ
                      {q.timeLimitMinutes ? ` · ${q.timeLimitMinutes} phút` : ''}
                    </p>
                    {q.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{q.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openResults(q)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-700 text-xs font-bold hover:border-amber-400">
                      <Award className="w-4 h-4" /> Kết quả
                    </button>
                    <button onClick={() => openEditor(q.id)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                      <FileQuestion className="w-4 h-4" /> Soạn câu hỏi
                    </button>
                    <button onClick={() => handleDeleteQuiz(q)} className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- EDITOR ---------- */}
      {view === 'editor' && current && (
        <div className="space-y-5">
          <button onClick={() => { setView('list'); reloadQuizzes(); }} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> Về danh sách bài
          </button>

          {/* Settings + status bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-800">{current.title}</h2>
                {statusPill(current.status)}
              </div>
              <div className="flex items-center gap-2">
                {current.status !== 'DA_XUAT_BAN' ? (
                  <button onClick={() => changeStatus('DA_XUAT_BAN')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow">
                    <Send className="w-4 h-4" /> Xuất bản
                  </button>
                ) : (
                  <button onClick={() => changeStatus('DONG')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow">
                    <Lock className="w-4 h-4" /> Đóng bài
                  </button>
                )}
                <button onClick={() => openResults(current)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-200 bg-white text-amber-700 text-xs font-bold hover:border-amber-400">
                  <Award className="w-4 h-4" /> Kết quả
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs font-semibold text-slate-600">
                Số câu bốc mỗi lượt (để trống = tất cả)
                <input type="number" min={1} defaultValue={current.questionsPerAttempt ?? ''} placeholder="Tất cả"
                  onBlur={(e) => saveSettings({ questionsPerAttempt: e.target.value === '' ? null : parseInt(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Giới hạn thời gian (phút, trống = không)
                <input type="number" min={1} defaultValue={current.timeLimitMinutes ?? ''} placeholder="Không giới hạn"
                  onBlur={(e) => saveSettings({ timeLimitMinutes: e.target.value === '' ? null : parseInt(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Thang điểm
                <input type="number" min={1} step={0.5} defaultValue={current.maxScore ?? 10}
                  onBlur={(e) => saveSettings({ maxScore: e.target.value === '' ? 10 : parseFloat(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
              </label>
            </div>
          </div>

          {/* Paste-to-parse */}
          <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-200/60">
            <p className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-1"><Wand2 className="w-4 h-4" /> Tạo nhanh: dán đề rồi tách tự động</p>
            <p className="text-xs text-indigo-700/80 mb-3">Dán danh sách câu hỏi (kèm dòng "Đáp án: X" hoặc đánh dấu <b>*</b> trước đáp án đúng). Thao tác sẽ <b>thay toàn bộ</b> câu hỏi hiện có.</p>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={7} placeholder={PLACEHOLDER}
              className="w-full px-3 py-2.5 border border-indigo-200 rounded-xl text-sm font-mono text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500/20" />
            <div className="flex justify-end mt-3">
              <button onClick={handleParse} disabled={parsing} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow disabled:opacity-50">
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Tách câu hỏi
              </button>
            </div>
          </div>

          {/* Question list editor */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Câu hỏi ({questions.length})</h3>
            <button onClick={addQuestion} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-bold hover:border-blue-400">
              <Plus className="w-4 h-4" /> Thêm câu
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200/60 text-center text-sm text-slate-500 font-semibold">
              Chưa có câu hỏi. Dán đề ở trên để tách nhanh, hoặc bấm "Thêm câu".
            </div>
          ) : questions.map((q, qi) => (
            <div key={q.id || `new-${qi}`} className={`bg-white rounded-2xl p-5 border shadow-sm ${q.needsReview ? 'border-amber-300' : 'border-slate-200/60'} ${!q.enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="mt-2 text-xs font-black text-slate-400 shrink-0">#{qi + 1}</span>
                <textarea value={q.content} onChange={(e) => setQ(qi, { content: e.target.value })} rows={2}
                  placeholder="Nội dung câu hỏi..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
              </div>

              {q.needsReview && (
                <p className="text-[11px] font-bold text-amber-600 mt-2 ml-8 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Chưa rõ đáp án đúng — hãy chọn ô tròn bên đáp án đúng.
                </p>
              )}

              <div className="mt-3 ml-8 space-y-2">
                {q.choices.map((c, ci) => (
                  <div key={c.id || `c-${ci}`} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${qi}`} checked={c.correct} onChange={() => setCorrect(qi, ci)}
                      className="w-4 h-4 accent-emerald-600 shrink-0" title="Đáp án đúng" />
                    <input value={c.content} onChange={(e) => setChoice(qi, ci, { content: e.target.value })}
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + ci)}`}
                      className={`flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 ${c.correct ? 'border-emerald-300 bg-emerald-50/40 font-bold text-emerald-800' : 'border-slate-200 text-slate-700'}`} />
                    <button onClick={() => removeChoice(qi, ci)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Xóa lựa chọn">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addChoice(qi)} className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
                </button>
              </div>

              <div className="mt-4 ml-8 flex items-center gap-2 flex-wrap">
                <button onClick={() => saveQuestion(qi)} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" /> Lưu câu
                </button>
                <button onClick={() => toggleEnabled(qi)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border ${q.enabled ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                  {q.enabled ? <><CheckCircle className="w-3.5 h-3.5" /> Đang bật</> : <><Eye className="w-3.5 h-3.5" /> Đang tắt</>}
                </button>
                <button onClick={() => deleteQuestion(qi)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold">
                  <Trash2 className="w-3.5 h-3.5" /> Xóa câu
                </button>
                {q.id ? null : <span className="text-[11px] font-bold text-amber-600">• chưa lưu</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- RESULTS ---------- */}
      {view === 'results' && current && (
        <div className="space-y-4">
          <button onClick={() => setView('list')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> Về danh sách bài
          </button>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Kết quả — {current.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{results.length} sinh viên đã làm · điểm lấy cao nhất</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openResults(current)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">
                <RefreshCw className="w-4 h-4" /> Tải lại
              </button>
              <button onClick={handleExport} disabled={busy || results.length === 0} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />} Xuất điểm quá trình
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> "Xuất điểm quá trình" ghi điểm cao nhất của mỗi SV vào <b>Điểm thành phần 1</b> của lớp (ghi đè giá trị cũ).
          </div>

          {results.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200/60 text-center text-sm text-slate-500 font-semibold">Chưa có sinh viên nào làm bài.</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/70">
                    <th className="py-3 px-4">Sinh viên</th>
                    <th className="py-3 px-3 text-center">Số lần làm</th>
                    <th className="py-3 px-3 text-center">Điểm cao nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map(r => (
                    <tr key={r.studentId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4">
                        <p className="font-bold text-slate-800">{r.studentName || '—'}</p>
                        <p className="font-mono text-xs text-slate-500">{r.studentCode}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-600">{r.attemptCount}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-black text-lg text-blue-700">{r.bestScore != null ? r.bestScore.toFixed(2) : '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowCreate(false); setNewPaste(''); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-slate-800 mb-4">Tạo bài trắc nghiệm</h3>
            <label className="text-xs font-semibold text-slate-600">Tiêu đề *
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="VD: Kiểm tra chương 1"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <label className="text-xs font-semibold text-slate-600 block mt-3">Mô tả ngắn (tùy chọn)
              <input value={newDesc} maxLength={200} onChange={(e) => setNewDesc(e.target.value)} placeholder="VD: 15 phút, 10 câu"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <label className="text-xs font-semibold text-slate-600 block mt-3">Dán đề trắc nghiệm (tùy chọn) — sẽ tự tách câu hỏi
              <textarea value={newPaste} onChange={(e) => setNewPaste(e.target.value)} rows={6} placeholder={PLACEHOLDER}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20" />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">Bạn có thể để trống rồi dán đề ở bước soạn sau. <b>Đừng dán câu hỏi vào ô "Mô tả ngắn".</b></p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setShowCreate(false); setNewPaste(''); }} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">Hủy</button>
              <button onClick={handleCreate} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Tạo bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherQuiz;
