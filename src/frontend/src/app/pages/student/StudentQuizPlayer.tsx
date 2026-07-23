import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../../services/studentService';
import {
  quizService, StartAttemptResponse, AttemptResultDto, StudentQuizDto,
} from '../../../services/quizService';
import {
  ArrowLeft, Loader2, Clock, Play, Send, CheckCircle, RotateCcw, Award, FileQuestion, Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

type Phase = 'loading' | 'intro' | 'playing' | 'result' | 'error';

export function StudentQuizPlayer() {
  const { quizId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [studentId, setStudentId] = useState('');
  const [meta, setMeta] = useState<StudentQuizDto | null>(null);
  const [attempt, setAttempt] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttemptResultDto | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  const answersRef = useRef<Record<string, string>>({});
  const attemptRef = useRef<StartAttemptResponse | null>(null);
  answersRef.current = answers;
  attemptRef.current = attempt;

  // Resolve student + quiz meta
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const page = await studentService.getAll(0, 1000);
        const me = page.content.find(s => s.email === user.email);
        if (!me) { setPhase('error'); return; }
        setStudentId(me.id);
        const quizzes = await quizService.getStudentQuizzes(me.id);
        const found = quizzes.find(q => q.quizId === quizId) || null;
        if (!found) { setPhase('error'); return; }
        setMeta(found);
        setPhase('intro');
      } catch (e) {
        console.error(e);
        setPhase('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, quizId]);

  const doSubmit = useCallback(async () => {
    const at = attemptRef.current;
    if (!at) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: at.questions.map(q => ({
          questionId: q.id!, choiceId: answersRef.current[q.id!] || null,
        })),
      };
      const res = await quizService.submitAttempt(at.attemptId, payload);
      setResult(res);
      setSecondsLeft(null);
      setPhase('result');
      // Cập nhật điểm cao nhất hiển thị ở intro
      setMeta(m => (m ? { ...m, bestScore: res.bestScore ?? m.bestScore, attemptCount: (m.attemptCount || 0) + 1 } : m));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing' || secondsLeft === null) return;
    if (secondsLeft <= 0) { doSubmit(); return; }
    const t = setTimeout(() => setSecondsLeft(s => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft, doSubmit]);

  const startAttempt = async () => {
    if (!studentId) return;
    setStarting(true);
    try {
      const res = await quizService.startAttempt(quizId, studentId);
      setAttempt(res);
      setAnswers({});
      setResult(null);
      setSecondsLeft(res.timeLimitMinutes ? res.timeLimitMinutes * 60 : null);
      setPhase('playing');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không bắt đầu được bài làm.');
    } finally {
      setStarting(false);
    }
  };

  const pick = (questionId: string, choiceId: string) =>
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }));

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const answeredCount = attempt ? attempt.questions.filter(q => answers[q.id!]).length : 0;

  // ---------- RENDER ----------
  if (phase === 'loading') {
    return <div className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>;
  }

  if (phase === 'error') {
    return (
      <div className="p-6">
        <div className="bg-white rounded-3xl p-12 border border-slate-200/60 text-center max-w-lg mx-auto">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-bold">Không tìm thấy bài trắc nghiệm</p>
          <p className="text-xs text-slate-400 mt-1">Bài có thể chưa xuất bản hoặc bạn chưa đăng ký lớp này.</p>
          <button onClick={() => navigate('/student')} className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
            <ArrowLeft className="w-4 h-4" /> Về trang chính
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 shadow-xl text-white">
        <button onClick={() => navigate('/student')} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4" /> Về trang chính
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl"><FileQuestion className="w-6 h-6 text-amber-300" /></div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{meta?.title}</h1>
            <p className="text-blue-200 text-xs font-medium">{meta?.className}</p>
          </div>
        </div>
      </div>

      {/* INTRO */}
      {phase === 'intro' && meta && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-5">
          {meta.description && <p className="text-sm text-slate-600">{meta.description}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Số câu</p>
              <p className="text-lg font-black text-slate-800">{meta.questionsPerAttempt || meta.enabledQuestions || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Thang điểm</p>
              <p className="text-lg font-black text-slate-800">{meta.maxScore ?? 10}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Thời gian</p>
              <p className="text-lg font-black text-slate-800">{meta.timeLimitMinutes ? `${meta.timeLimitMinutes}′` : '∞'}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-emerald-500 uppercase">Điểm cao nhất</p>
              <p className="text-lg font-black text-emerald-700">{meta.bestScore != null ? meta.bestScore.toFixed(2) : '—'}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 font-semibold">
            Bạn được làm nhiều lần, hệ thống lấy <b>điểm cao nhất</b>. Mỗi lượt câu hỏi được bốc ngẫu nhiên.
            {(meta.attemptCount || 0) > 0 && <> Đã làm {meta.attemptCount} lần.</>}
          </div>
          <button onClick={startAttempt} disabled={starting} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md disabled:opacity-50">
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {(meta.attemptCount || 0) > 0 ? 'Làm lại' : 'Bắt đầu làm bài'}
          </button>
        </div>
      )}

      {/* PLAYING */}
      {phase === 'playing' && attempt && (
        <div className="space-y-4">
          <div className="sticky top-2 z-10 bg-white/95 backdrop-blur rounded-2xl px-4 py-3 border border-slate-200/60 shadow-sm flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600">Đã trả lời <span className="text-blue-700">{answeredCount}</span>/{attempt.questions.length}</p>
            {secondsLeft !== null && (
              <p className={`inline-flex items-center gap-1.5 text-sm font-black ${secondsLeft <= 30 ? 'text-rose-600' : 'text-slate-700'}`}>
                <Clock className="w-4 h-4" /> {fmtTime(secondsLeft)}
              </p>
            )}
          </div>

          {attempt.questions.map((q, qi) => (
            <div key={q.id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <p className="font-bold text-slate-800 mb-3"><span className="text-blue-600">Câu {qi + 1}.</span> {q.content}</p>
              <div className="space-y-2">
                {q.choices.map((c, ci) => {
                  const selected = answers[q.id!] === c.id;
                  return (
                    <button key={c.id} onClick={() => pick(q.id!, c.id!)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${
                        selected ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold' : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                      }`}>
                      <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-black shrink-0 ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {String.fromCharCode(65 + ci)}
                      </span>
                      {c.content}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button onClick={doSubmit} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md disabled:opacity-50">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Nộp bài
          </button>
        </div>
      )}

      {/* RESULT */}
      {phase === 'result' && result && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-100 grid place-items-center mx-auto">
            <Trophy className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Điểm lượt này</p>
            <p className="text-5xl font-black text-emerald-600 mt-1">{result.score.toFixed(2)}<span className="text-2xl text-slate-400">/{result.maxScore}</span></p>
            <p className="text-sm text-slate-500 mt-2 inline-flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Đúng {result.correctCount}/{result.questionCount} câu
            </p>
          </div>
          {result.bestScore != null && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
              <Award className="w-4 h-4" /> Điểm cao nhất của bạn: {result.bestScore.toFixed(2)}
            </div>
          )}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button onClick={() => setPhase('intro')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
              <RotateCcw className="w-4 h-4" /> Làm lại
            </button>
            <button onClick={() => navigate('/student')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" /> Về trang chính
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentQuizPlayer;
