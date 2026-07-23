import { useState, useEffect } from 'react';
import { forumService, ForumThreadDto } from '../../services/forumService';
import {
  MessageSquare, Plus, Loader2, Send, Trash2, ChevronDown, ChevronRight, CornerDownRight, X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  classId: string;
  authorId?: string;
  authorName: string;
  authorRole: 'GIANG_VIEN' | 'SINH_VIEN';
  canModerate?: boolean; // GV được xóa mọi bài
}

function fmt(s?: string | null) {
  if (!s) return '';
  return new Date(s).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function roleBadge(role?: string | null) {
  if (role === 'GIANG_VIEN') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Giảng viên</span>;
  if (role === 'SINH_VIEN') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Sinh viên</span>;
  return null;
}

export function CourseForum({ classId, authorId, authorName, authorRole, canModerate }: Props) {
  const [threads, setThreads] = useState<ForumThreadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ForumThreadDto | null>(null);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [nTitle, setNTitle] = useState('');
  const [nContent, setNContent] = useState('');

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [classId]);
  const reload = async () => {
    setLoading(true);
    try { setThreads(await forumService.listThreads(classId)); }
    finally { setLoading(false); }
  };

  const openThread = async (id: string) => {
    if (openId === id) { setOpenId(null); setDetail(null); return; }
    setOpenId(id); setDetail(null); setReplyText('');
    try { setDetail(await forumService.getThread(id)); }
    catch { toast.error('Không tải được thảo luận.'); }
  };

  const createThread = async () => {
    if (!nTitle.trim()) { toast.error('Nhập tiêu đề câu hỏi.'); return; }
    setBusy(true);
    try {
      await forumService.createThread(classId, { title: nTitle.trim(), content: nContent.trim() || undefined, authorId, authorName, authorRole });
      toast.success('Đã đăng chủ đề.');
      setShowNew(false); setNTitle(''); setNContent('');
      await reload();
    } catch { toast.error('Đăng chủ đề thất bại.'); }
    finally { setBusy(false); }
  };

  const sendReply = async () => {
    if (!openId || !replyText.trim()) return;
    setBusy(true);
    try {
      await forumService.addReply(openId, { content: replyText.trim(), authorId, authorName, authorRole });
      setReplyText('');
      setDetail(await forumService.getThread(openId));
      setThreads(prev => prev.map(t => t.id === openId ? { ...t, replyCount: (t.replyCount || 0) + 1 } : t));
    } catch { toast.error('Gửi trả lời thất bại.'); }
    finally { setBusy(false); }
  };

  const delThread = async (id: string) => {
    if (!window.confirm('Xóa chủ đề này cùng toàn bộ trả lời?')) return;
    try { await forumService.deleteThread(id); if (openId === id) { setOpenId(null); setDetail(null); } await reload(); }
    catch { toast.error('Xóa thất bại.'); }
  };
  const delReply = async (replyId: string) => {
    if (!openId) return;
    try { await forumService.deleteReply(replyId); setDetail(await forumService.getThread(openId)); }
    catch { toast.error('Xóa thất bại.'); }
  };
  const mine = (aId?: string | null) => canModerate || (!!authorId && aId === authorId);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Diễn đàn thảo luận ({threads.length})
        </h2>
        <button onClick={() => setShowNew(v => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow">
          <Plus className="w-4 h-4" /> Đặt câu hỏi
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm mb-3">
          <input value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="Tiêu đề câu hỏi / chủ đề..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500/20" />
          <textarea value={nContent} onChange={e => setNContent(e.target.value)} rows={3} placeholder="Nội dung (tùy chọn)..."
            className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-rose-500/20" />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowNew(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">Hủy</button>
            <button onClick={createThread} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Đăng
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-rose-600 mx-auto" /></div>
      ) : threads.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 text-center text-sm text-slate-400 font-semibold">Chưa có thảo luận nào. Hãy đặt câu hỏi đầu tiên!</div>
      ) : (
        <div className="space-y-2">
          {threads.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="p-4 flex items-start justify-between gap-3">
                <button onClick={() => openThread(t.id)} className="flex items-start gap-2 text-left min-w-0 flex-1">
                  {openId === t.id ? <ChevronDown className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {t.authorName || 'Ẩn danh'} {roleBadge(t.authorRole)} · {fmt(t.createdAt)}
                      <span className="inline-flex items-center gap-1 text-rose-600 font-semibold"><MessageSquare className="w-3 h-3" /> {t.replyCount ?? 0}</span>
                    </p>
                  </div>
                </button>
                {mine(t.authorId) && (
                  <button onClick={() => delThread(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>

              {openId === t.id && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  {t.content && <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{t.content}</p>}
                  {!detail ? (
                    <div className="text-center py-3"><Loader2 className="w-5 h-5 animate-spin text-rose-600 mx-auto" /></div>
                  ) : (
                    <>
                      {(detail.replies || []).map(r => (
                        <div key={r.id} className="flex items-start gap-2 pl-2">
                          <CornerDownRight className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                          <div className="flex-1 bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-700">{r.authorName || 'Ẩn danh'}</span> {roleBadge(r.authorRole)} · {fmt(r.createdAt)}
                              {mine(r.authorId) && <button onClick={() => delReply(r.id)} className="ml-auto text-slate-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>}
                            </p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.content}</p>
                          </div>
                        </div>
                      ))}
                      {(detail.replies || []).length === 0 && <p className="text-xs text-slate-400 text-center py-2">Chưa có trả lời.</p>}
                      <div className="flex items-center gap-2 pt-1">
                        <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Viết trả lời..."
                          onKeyDown={e => { if (e.key === 'Enter') sendReply(); }}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-rose-500/20" />
                        <button onClick={sendReply} disabled={busy || !replyText.trim()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50">
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CourseForum;
