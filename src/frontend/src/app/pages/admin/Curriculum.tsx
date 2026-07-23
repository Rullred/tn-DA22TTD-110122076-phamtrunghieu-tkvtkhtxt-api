import { useState, useEffect, useMemo } from 'react';
import { curriculumService, CurriculumDto, CurriculumRequest } from '../../../services/curriculumService';
import { teacherService, TeacherDto } from '../../../services/teacherService';
import { classService, CreateClassRequest } from '../../../services/classService';
import { CurriculumTable } from '../../components/CurriculumTable';
import { BookMarked, Plus, Pencil, Trash2, RefreshCw, X, Check, Loader2, Search, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY: CurriculumRequest = {
  nganh: '', hocKy: 1, maMonHoc: '', tenMonHoc: '', soTinChi: 3,
  chuyenNganh: 'TT', monBatBuoc: true, tongTiet: 45, lyThuyet: 15, thucHanh: 30,
};

/** yyyy-mm-dd của hôm nay / hôm nay + số ngày (dùng cho input type=date). */
function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Năm học mặc định theo mốc hiện tại, VD "2025-2026". */
function defaultAcademicYear(): string {
  const now = new Date();
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // năm học bắt đầu ~ tháng 8
  return `${y}-${y + 1}`;
}

interface OpenClassForm {
  classCode: string;
  className: string;
  teacherId: string;
  academicYear: string;
  room: string;
  maxStudents: number;
  schedule: string;
  startDate: string;
  endDate: string;
  description: string;
}

export function Curriculum() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CurriculumDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [filterNganh, setFilterNganh] = useState('');
  const [filterHocKy, setFilterHocKy] = useState<number | ''>('');

  // Modal thêm/sửa môn (chương trình khung)
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CurriculumDto | null>(null);
  const [form, setForm] = useState<CurriculumRequest>(EMPTY);
  const [saving, setSaving] = useState(false);

  // Modal "Mở lớp" nhanh cho một môn
  const [openClassFor, setOpenClassFor] = useState<CurriculumDto | null>(null);
  const [ocForm, setOcForm] = useState<OpenClassForm | null>(null);
  const [opening, setOpening] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [list, teachersPage] = await Promise.all([
        curriculumService.getAll(),
        teacherService.getAll(0, 200).catch(() => ({ content: [] as TeacherDto[] } as any)),
      ]);
      setItems(list);
      setTeachers((teachersPage.content || []).filter((t: TeacherDto) => t.status !== 'INACTIVE'));
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải chương trình khung.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const nganhOptions = useMemo(() => Array.from(new Set(items.map(i => i.nganh))).sort(), [items]);

  const filtered = items.filter(i =>
    (!filterNganh || i.nganh === filterNganh) &&
    (filterHocKy === '' || i.hocKy === filterHocKy)
  );

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY, nganh: filterNganh || nganhOptions[0] || '' }); setModalOpen(true); };
  const openEdit = (i: CurriculumDto) => {
    setEditing(i);
    setForm({
      nganh: i.nganh, hocKy: i.hocKy, maMonHoc: i.maMonHoc, tenMonHoc: i.tenMonHoc, soTinChi: i.soTinChi,
      chuyenNganh: i.chuyenNganh ?? '', monBatBuoc: !!i.monBatBuoc,
      tongTiet: i.tongTiet ?? null, lyThuyet: i.lyThuyet ?? null, thucHanh: i.thucHanh ?? null,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.nganh.trim() || !form.maMonHoc.trim() || !form.tenMonHoc.trim()) {
      toast.error('Vui lòng nhập đầy đủ ngành, mã môn và tên môn.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await curriculumService.update(editing.id, form);
        setItems(prev => prev.map(i => (i.id === editing.id ? updated : i)));
        toast.success('Đã cập nhật môn học.');
      } else {
        const created = await curriculumService.create(form);
        setItems(prev => [...prev, created]);
        toast.success('Đã thêm môn vào chương trình khung.');
      }
      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (i: CurriculumDto) => {
    if (!window.confirm(`Xóa môn "${i.tenMonHoc}" (${i.maMonHoc}) khỏi chương trình khung?`)) return;
    try {
      await curriculumService.delete(i.id);
      setItems(prev => prev.filter(x => x.id !== i.id));
      toast.success('Đã xóa môn học.');
    } catch (err) {
      console.error(err);
      toast.error('Xóa thất bại.');
    }
  };

  // ===== Mở lớp nhanh =====
  const openClassModal = (i: CurriculumDto) => {
    setOpenClassFor(i);
    setOcForm({
      classCode: i.maMonHoc,
      className: `Lớp ${i.tenMonHoc}`,
      teacherId: '',
      academicYear: defaultAcademicYear(),
      room: '',
      maxStudents: 50,
      schedule: '',
      startDate: isoDate(0),
      endDate: isoDate(120),
    });
  };

  const submitOpenClass = async () => {
    if (!openClassFor || !ocForm) return;
    if (!ocForm.classCode.trim() || !ocForm.className.trim()) {
      toast.error('Vui lòng nhập mã lớp và tên lớp.');
      return;
    }
    if (!ocForm.teacherId) {
      toast.error('Vui lòng chọn giảng viên phụ trách.');
      return;
    }
    if (!ocForm.academicYear.trim() || !ocForm.startDate || !ocForm.endDate) {
      toast.error('Vui lòng nhập năm học và thời gian mở lớp.');
      return;
    }
    if (ocForm.endDate < ocForm.startDate) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    const payload: CreateClassRequest = {
      classCode: ocForm.classCode.trim(),
      className: ocForm.className.trim(),
      description: ocForm.description?.trim() || `Lớp mở từ chương trình khung — ${openClassFor.tenMonHoc}`,
      teacherId: ocForm.teacherId,
      subject: openClassFor.tenMonHoc,
      room: ocForm.room?.trim() || undefined,
      maxStudents: ocForm.maxStudents,
      schedule: ocForm.schedule?.trim() || undefined,
      academicYear: ocForm.academicYear.trim(),
      semester: openClassFor.hocKy,
      startDate: ocForm.startDate,
      endDate: ocForm.endDate,
    };
    setOpening(true);
    try {
      await classService.create(payload);
      toast.success(`Đã mở lớp "${payload.className}". Sinh viên có thể đăng ký ngay.`);
      setOpenClassFor(null);
      setOcForm(null);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Mở lớp thất bại.';
      toast.error(String(msg).includes('exist') || String(msg).toLowerCase().includes('unique')
        ? `Mã lớp "${payload.classCode}" đã tồn tại — hãy đổi mã lớp (VD thêm hậu tố nhóm).`
        : msg);
    } finally {
      setOpening(false);
    }
  };

  const teacherName = (t: TeacherDto) => `${t.lastName || ''} ${t.firstName || ''}`.trim() || t.email;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-950 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl"><BookMarked className="w-6 h-6 text-amber-300" /></div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Chương trình khung</h1>
              <p className="text-indigo-200 text-xs font-medium">Danh mục môn theo ngành và học kỳ — bấm <span className="font-bold text-amber-200">Mở lớp</span> để nhanh chóng tạo lớp cho sinh viên đăng ký</p>
            </div>
          </div>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-800 text-sm font-bold shadow-md hover:bg-indigo-50 transition-colors">
            <Plus className="w-4 h-4" /> Thêm môn
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select value={filterNganh} onChange={(e) => setFilterNganh(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15">
              <option value="">Tất cả ngành</option>
              {nganhOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <select value={filterHocKy} onChange={(e) => setFilterHocKy(e.target.value === '' ? '' : Number(e.target.value))}
            className="pl-3.5 pr-8 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15">
            <option value="">Tất cả học kỳ</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map(h => <option key={h} value={h}>Học kỳ {h}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Đang tải chương trình đào tạo...</p>
          </div>
        ) : (
          <CurriculumTable
            items={filtered}
            renderActions={(i) => (
              <>
                <button onClick={() => openClassModal(i)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm">
                  <CalendarPlus className="w-3.5 h-3.5" /> Mở lớp
                </button>
                <button onClick={() => openEdit(i)} className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(i)} className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          />
        )}
      </div>

      {/* Modal thêm/sửa môn */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600" /> {editing ? 'Sửa môn học' : 'Thêm môn học'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Ngành</label>
                <input value={form.nganh} onChange={(e) => setForm(f => ({ ...f, nganh: e.target.value }))} placeholder="VD: Công nghệ thông tin"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15" list="nganh-list" />
                <datalist id="nganh-list">{nganhOptions.map(n => <option key={n} value={n} />)}</datalist>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Mã môn</label>
                <input value={form.maMonHoc} onChange={(e) => setForm(f => ({ ...f, maMonHoc: e.target.value }))} placeholder="VD: OOP22"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Số tín chỉ</label>
                <input type="number" min={1} max={15} value={form.soTinChi} onChange={(e) => setForm(f => ({ ...f, soTinChi: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tên môn học</label>
                <input value={form.tenMonHoc} onChange={(e) => setForm(f => ({ ...f, tenMonHoc: e.target.value }))} placeholder="VD: Lập trình hướng đối tượng"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Học kỳ</label>
                <select value={form.hocKy} onChange={(e) => setForm(f => ({ ...f, hocKy: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15">
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(h => <option key={h} value={h}>Học kỳ {h}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Chuyên ngành</label>
                <input value={form.chuyenNganh ?? ''} onChange={(e) => setForm(f => ({ ...f, chuyenNganh: e.target.value }))} placeholder="VD: TT"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tổng tiết</label>
                <input type="number" min={0} max={500} value={form.tongTiet ?? ''} onChange={(e) => setForm(f => ({ ...f, tongTiet: e.target.value === '' ? null : Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Lý thuyết</label>
                <input type="number" min={0} max={500} value={form.lyThuyet ?? ''} onChange={(e) => setForm(f => ({ ...f, lyThuyet: e.target.value === '' ? null : Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Thực hành</label>
                <input type="number" min={0} max={500} value={form.thucHanh ?? ''} onChange={(e) => setForm(f => ({ ...f, thucHanh: e.target.value === '' ? null : Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
              </div>
              <div className="col-span-2 flex items-center gap-2 pt-1">
                <input id="mon-bat-buoc" type="checkbox" checked={!!form.monBatBuoc} onChange={(e) => setForm(f => ({ ...f, monBatBuoc: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30" />
                <label htmlFor="mon-bat-buoc" className="text-sm font-semibold text-slate-700 dark:text-slate-300 select-none">Môn bắt buộc</label>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200">Hủy</button>
              <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {editing ? 'Lưu' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mở lớp nhanh */}
      {openClassFor && ocForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpenClassFor(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-emerald-600" /> Mở lớp nhanh
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{openClassFor.tenMonHoc}</span>
                  <span className="mx-1.5 text-slate-300">·</span>{openClassFor.maMonHoc}
                  <span className="mx-1.5 text-slate-300">·</span>Học kỳ {openClassFor.hocKy}
                  <span className="mx-1.5 text-slate-300">·</span>{openClassFor.soTinChi} tín chỉ
                </p>
              </div>
              <button onClick={() => setOpenClassFor(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5 text-slate-500" /></button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-3 overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Mã lớp</label>
                <input value={ocForm.classCode} onChange={(e) => setOcForm(f => f && ({ ...f, classCode: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Năm học</label>
                <input value={ocForm.academicYear} onChange={(e) => setOcForm(f => f && ({ ...f, academicYear: e.target.value }))} placeholder="2025-2026"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tên lớp</label>
                <input value={ocForm.className} onChange={(e) => setOcForm(f => f && ({ ...f, className: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Giảng viên phụ trách <span className="text-rose-500">*</span></label>
                <select value={ocForm.teacherId} onChange={(e) => setOcForm(f => f && ({ ...f, teacherId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15">
                  <option value="">— Chọn giảng viên —</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{teacherName(t)}{t.department ? ` (${t.department})` : ''}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Phòng học</label>
                <input value={ocForm.room} onChange={(e) => setOcForm(f => f && ({ ...f, room: e.target.value }))} placeholder="VD: A101"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Sĩ số tối đa</label>
                <input type="number" min={1} max={100} value={ocForm.maxStudents} onChange={(e) => setOcForm(f => f && ({ ...f, maxStudents: Math.min(100, Number(e.target.value)) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Lịch học</label>
                <input value={ocForm.schedule} onChange={(e) => setOcForm(f => f && ({ ...f, schedule: e.target.value }))} placeholder="VD: Thứ 2 (tiết 1-3), Thứ 5 (tiết 7-9)"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Bắt đầu / mở đăng ký</label>
                <input type="date" value={ocForm.startDate} onChange={(e) => setOcForm(f => f && ({ ...f, startDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Kết thúc</label>
                <input type="date" value={ocForm.endDate} onChange={(e) => setOcForm(f => f && ({ ...f, endDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15" />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400 font-semibold hidden sm:block">Lớp mở xong sẽ hiển thị ngay ở trang đăng ký môn của sinh viên.</p>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setOpenClassFor(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200">Hủy</button>
                <button onClick={submitOpenClass} disabled={opening} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50">
                  {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />} Mở lớp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Curriculum;
