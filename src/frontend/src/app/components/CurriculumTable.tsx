import { useMemo, ReactNode } from 'react';
import { CurriculumDto } from '../../services/curriculumService';
import { GraduationCap, BookMarked } from 'lucide-react';

/**
 * Năm học suy ra từ học kỳ theo tiến độ (khóa 2022):
 * HK1,2 -> 2022-2023 ; HK3,4 -> 2023-2024 ; HK5,6 -> 2024-2025 ; HK7,8 -> 2025-2026 ...
 */
const COHORT_START_YEAR = 2022;
function namHocLabel(hocKy: number): string {
  const start = COHORT_START_YEAR + Math.floor((hocKy - 1) / 2);
  const term = ((hocKy - 1) % 2) + 1;
  return `Học kỳ ${term} - Năm học ${start} - ${start + 1}`;
}

export interface CurriculumTableProps {
  items: CurriculumDto[];
  /** Render các nút thao tác cho một môn (chỉ admin truyền vào). Bỏ trống => chế độ chỉ đọc. */
  renderActions?: (item: CurriculumDto) => ReactNode;
  loading?: boolean;
}

/** Bảng chương trình đào tạo nhóm theo học kỳ — dùng chung cho admin (có thao tác) và sinh viên (chỉ đọc). */
export function CurriculumTable({ items, renderActions, loading }: CurriculumTableProps) {
  const showActions = !!renderActions;

  const groups = useMemo(() => {
    const map = new Map<number, CurriculumDto[]>();
    for (const it of items) {
      if (!map.has(it.hocKy)) map.set(it.hocKy, []);
      map.get(it.hocKy)!.push(it);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hocKy, list]) => ({
        hocKy,
        list: list.sort((a, b) => (a.maMonHoc || '').localeCompare(b.maMonHoc || '')),
        tinChi: list.reduce((s, x) => s + (x.soTinChi || 0), 0),
      }));
  }, [items]);

  if (loading) {
    return (
      <div className="text-center py-16 text-xs text-slate-400 font-semibold">Đang tải chương trình đào tạo...</div>
    );
  }
  if (groups.length === 0) {
    return (
      <div className="text-center py-16">
        <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-semibold">Chưa có môn học trong chương trình đào tạo</p>
      </div>
    );
  }

  const th = 'py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap';
  const td = 'py-2.5 px-3 text-sm text-slate-700 dark:text-slate-300';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[900px]">
        <thead className="bg-slate-50/80 dark:bg-slate-800/30 sticky top-0">
          <tr className="border-b border-slate-100 dark:border-slate-800">
            <th className={`${th} text-center w-12`}>STT</th>
            <th className={`${th} w-24`}>Mã MH</th>
            <th className={th}>Tên môn học</th>
            <th className={`${th} text-center`}>Chuyên ngành</th>
            <th className={`${th} text-center`}>Số tín chỉ</th>
            <th className={`${th} text-center`}>Môn bắt buộc</th>
            <th className={`${th} text-center`}>Tổng tiết</th>
            <th className={`${th} text-center`}>Lý thuyết</th>
            <th className={`${th} text-center`}>Thực hành</th>
            {showActions && <th className={`${th} text-right`}>Hành động</th>}
          </tr>
        </thead>
        <tbody>
          {groups.map(group => (
            <>
              {/* Dòng tiêu đề học kỳ */}
              <tr key={`h-${group.hocKy}`} className="bg-indigo-50/70 dark:bg-indigo-950/20 border-y border-indigo-100 dark:border-indigo-900/30">
                <td colSpan={showActions ? 10 : 9} className="py-2.5 px-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-500" /> {namHocLabel(group.hocKy)}
                    </span>
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {group.list.length} môn · {group.tinChi} tín chỉ
                    </span>
                  </div>
                </td>
              </tr>
              {group.list.map((i, idx) => (
                <tr key={i.id} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className={`${td} text-center text-slate-400 font-semibold`}>{idx + 1}</td>
                  <td className={`${td} font-mono font-bold text-indigo-700 dark:text-indigo-300`}>{i.maMonHoc}</td>
                  <td className={`${td} font-bold text-slate-900 dark:text-white`}>{i.tenMonHoc}</td>
                  <td className={`${td} text-center text-slate-500`}>{i.chuyenNganh || ''}</td>
                  <td className={`${td} text-center font-black text-slate-900 dark:text-white`}>{i.soTinChi}</td>
                  <td className={`${td} text-center`}>
                    {i.monBatBuoc ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className={`${td} text-center font-semibold`}>{i.tongTiet ?? ''}</td>
                  <td className={`${td} text-center text-sky-600 dark:text-sky-400 font-semibold`}>{i.lyThuyet ?? ''}</td>
                  <td className={`${td} text-center text-emerald-600 dark:text-emerald-400 font-semibold`}>{i.thucHanh ?? ''}</td>
                  {showActions && (
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-end gap-1.5">{renderActions!(i)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CurriculumTable;
