import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { curriculumService, CurriculumDto } from '../../../services/curriculumService';
import { studentService } from '../../../services/studentService';
import { CurriculumTable } from '../../components/CurriculumTable';
import { BookMarked, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Trang xem chương trình đào tạo cho sinh viên — CHỈ ĐỌC.
 * Sinh viên chỉ được xem (không mở lớp / sửa / xóa — đó là quyền của admin).
 */
export function StudentCurriculum() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CurriculumDto[]>([]);
  const [nganh, setNganh] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        // Xác định ngành của sinh viên hiện tại (theo email), rồi tải CTĐT của ngành đó.
        let major = '';
        try {
          const page = await studentService.getAll(0, 1000);
          const me = (page.content || []).find(s => s.email === user.email);
          major = me?.major || '';
        } catch { /* fallback: tải toàn bộ */ }

        const list = major
          ? await curriculumService.getAll(major)
          : await curriculumService.getAll();
        setNganh(major || (list[0]?.nganh ?? ''));
        setItems(list);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải chương trình đào tạo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const tongTinChi = items.reduce((s, x) => s + (x.soTinChi || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-950 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl"><BookMarked className="w-6 h-6 text-amber-300" /></div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Chương trình đào tạo</h1>
            <p className="text-indigo-200 text-xs font-medium">
              {nganh ? `Ngành ${nganh}` : 'Danh mục môn theo học kỳ'}
              {items.length > 0 && <span> · {items.length} môn · {tongTinChi} tín chỉ toàn khóa</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Đang tải chương trình đào tạo...</p>
          </div>
        ) : (
          <CurriculumTable items={items} />
        )}
      </div>
    </div>
  );
}

export default StudentCurriculum;
