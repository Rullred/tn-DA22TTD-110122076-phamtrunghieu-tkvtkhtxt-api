import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../../services/studentService';
import { classService, ClassDto } from '../../../services/classService';
import { quizService, StudentQuizDto } from '../../../services/quizService';
import { learningService, LearningItemDto, ProgressDto } from '../../../services/learningService';
import { CourseForum } from '../../components/CourseForum';
import {
  ArrowLeft, Loader2, FileText, ClipboardList, FileQuestion, Download, Upload,
  Clock, CheckCircle, Award, Play, AlertTriangle, Link2, MessageSquare, Circle,
} from 'lucide-react';
import { toast } from 'sonner';

function fmtDate(s?: string | null) {
  if (!s) return '';
  return new Date(s).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function StudentCourse() {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [classInfo, setClassInfo] = useState<ClassDto | null>(null);
  const [items, setItems] = useState<LearningItemDto[]>([]);
  const [quizzes, setQuizzes] = useState<StudentQuizDto[]>([]);
  const [progress, setProgress] = useState<ProgressDto | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const submitTargetRef = useRef<string>('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const page = await studentService.getAll(0, 1000);
        const me = page.content.find(s => s.email === user.email);
        if (!me) { setLoading(false); return; }
        setStudentId(me.id);
        setStudentName(me.fullName || `${me.lastName || ''} ${me.firstName || ''}`.trim() || (user.name || ''));
        setClassInfo(await classService.getById(classId).catch(() => null));
        await reload(me.id);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, classId]);

  const reload = async (sid: string) => {
    const [its, qz, pg] = await Promise.all([
      learningService.studentItems(sid, classId).catch(() => []),
      quizService.getStudentQuizzes(sid).catch(() => []),
      learningService.getProgress(sid, classId).catch(() => null),
    ]);
    setItems(its);
    setQuizzes(qz.filter(q => q.classId === classId));
    setProgress(pg);
  };

  const toggleComplete = async (it: LearningItemDto) => {
    if (!studentId) return;
    try {
      if (it.completed) await learningService.unmarkComplete(it.id, studentId);
      else await learningService.markComplete(it.id, studentId);
      await reload(studentId);
    } catch { toast.error('Cập nhật tiến độ thất bại.'); }
  };

  const triggerSubmit = (itemId: string) => {
    submitTargetRef.current = itemId;
    fileInputRef.current?.click();
  };
  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !submitTargetRef.current || !studentId) return;
    setSubmitting(submitTargetRef.current);
    try {
      await learningService.submit(submitTargetRef.current, studentId, file);
      toast.success('Đã nộp bài.');
      await reload(studentId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Nộp bài thất bại.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>;

  const materials = items.filter(i => i.type === 'TAI_LIEU');
  const assignments = items.filter(i => i.type === 'BAI_TAP');

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFilePicked}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.png,.jpg,.jpeg,.gif,.webp" />

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 shadow-xl text-white">
        <button onClick={() => navigate('/student')} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4" /> Về trang chính
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl"><FileText className="w-6 h-6 text-amber-300" /></div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{classInfo?.subject || classInfo?.className || 'Khóa học'}</h1>
            <p className="text-blue-200 text-xs font-medium">Mã lớp <span className="font-mono font-bold">{classInfo?.classCode}</span></p>
          </div>
        </div>
        {classInfo?.description && <p className="text-sm text-blue-100/90 mt-3">{classInfo.description}</p>}
      </div>

      {/* Tiến độ */}
      {progress && progress.total > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-700">Tiến độ hoàn thành khóa học</p>
            <p className="text-lg font-black text-blue-700">{progress.percent}%</p>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Tài liệu {progress.materialsDone}/{progress.materialsTotal} · Bài tập {progress.assignmentsDone}/{progress.assignmentsTotal} · Trắc nghiệm {progress.quizzesDone}/{progress.quizzesTotal}
          </p>
        </div>
      )}

      {/* Tài liệu */}
      <section>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4" /> Tài liệu học tập ({materials.length})
        </h2>
        {materials.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 text-center text-sm text-slate-400 font-semibold">Chưa có tài liệu.</div>
        ) : (
          <div className="space-y-3">
            {materials.map(it => (
              <div key={it.id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-slate-800">{it.title}</h3>
                  {it.completed && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0"><CheckCircle className="w-3 h-3" /> Đã xem</span>}
                </div>
                {it.description && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{it.description}</p>}
                {(it.files && it.files.length > 0) && (
                  <div className="mt-3 space-y-1.5">
                    {it.files.map(f => (
                      <button key={f.id} onClick={() => learningService.downloadFile(f)} className="flex items-center gap-2 text-sm bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 w-full text-left">
                        {f.link ? <Link2 className="w-4 h-4 text-sky-600 shrink-0" /> : <Download className="w-4 h-4 text-blue-600 shrink-0" />}
                        <span className="font-semibold text-blue-700 truncate">{f.fileName}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => toggleComplete(it)} className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${it.completed ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {it.completed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />} {it.completed ? 'Bỏ đánh dấu' : 'Đánh dấu đã xem'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bài tập */}
      <section>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4" /> Bài tập ({assignments.length})
        </h2>
        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 text-center text-sm text-slate-400 font-semibold">Chưa có bài tập.</div>
        ) : (
          <div className="space-y-3">
            {assignments.map(it => {
              const sub = it.mySubmission;
              const overdue = it.dueDate && !sub && new Date(it.dueDate) < new Date();
              return (
                <div key={it.id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-800">{it.title}</h3>
                      {it.description && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{it.description}</p>}
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        {it.dueDate && <span className={`inline-flex items-center gap-1 ${overdue ? 'text-rose-600 font-bold' : ''}`}><Clock className="w-3.5 h-3.5" /> Hạn: {fmtDate(it.dueDate)}</span>}
                        <span className="inline-flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Thang {it.maxScore ?? 10}đ</span>
                      </p>
                    </div>
                    <button onClick={() => triggerSubmit(it.id)} disabled={submitting === it.id}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow disabled:opacity-50 shrink-0">
                      {submitting === it.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {sub ? 'Nộp lại' : 'Nộp bài'}
                    </button>
                  </div>

                  {/* instruction files */}
                  {(it.files && it.files.length > 0) && (
                    <div className="mt-3 space-y-1.5">
                      {it.files.map(f => (
                        <button key={f.id} onClick={() => learningService.downloadFile(f)} className="flex items-center gap-2 text-sm bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 w-full text-left">
                          {f.link ? <Link2 className="w-4 h-4 text-sky-600 shrink-0" /> : <Download className="w-4 h-4 text-blue-600 shrink-0" />}
                          <span className="font-semibold text-blue-700 truncate">{f.fileName}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* submission status */}
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    {sub ? (
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-emerald-700 inline-flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Đã nộp: <button onClick={() => learningService.downloadSubmission(sub)} className="text-blue-700 hover:underline">{sub.fileName}</button>
                        </p>
                        <p className="text-xs text-slate-500">
                          {fmtDate(sub.submittedAt)} {sub.late && <span className="text-rose-600 font-bold">· nộp trễ</span>}
                        </p>
                        {sub.grade != null ? (
                          <p className="text-sm font-bold text-slate-800 inline-flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-500" /> Điểm: <span className="text-blue-700">{sub.grade}</span>/{it.maxScore ?? 10}
                          </p>
                        ) : <p className="text-xs text-slate-400 font-semibold">Chưa chấm điểm</p>}
                        {sub.feedback && (
                          <p className="text-xs text-slate-600 inline-flex items-start gap-1.5"><MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {sub.feedback}</p>
                        )}
                      </div>
                    ) : overdue ? (
                      <p className="text-sm font-semibold text-rose-600 inline-flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Đã quá hạn — nộp bây giờ sẽ bị đánh dấu "nộp trễ".</p>
                    ) : (
                      <p className="text-sm text-slate-500 font-semibold">Bạn chưa nộp bài.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trắc nghiệm */}
      <section>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
          <FileQuestion className="w-4 h-4" /> Bài trắc nghiệm ({quizzes.length})
        </h2>
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 text-center text-sm text-slate-400 font-semibold">Chưa có bài trắc nghiệm.</div>
        ) : (
          <div className="space-y-3">
            {quizzes.map(q => (
              <div key={q.quizId} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-800">{q.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {q.questionsPerAttempt || q.enabledQuestions || 0} câu · Thang {q.maxScore ?? 10}đ
                    {q.bestScore != null ? ` · Điểm cao nhất ${q.bestScore.toFixed(2)}` : ''}
                  </p>
                </div>
                <button onClick={() => navigate(`/student/quiz/${q.quizId}`)} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow">
                  <Play className="w-4 h-4" /> {(q.attemptCount || 0) > 0 ? 'Làm lại' : 'Làm bài'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Diễn đàn */}
      {studentId && <CourseForum classId={classId} authorId={studentId} authorName={studentName} authorRole="SINH_VIEN" />}
    </div>
  );
}

export default StudentCourse;
