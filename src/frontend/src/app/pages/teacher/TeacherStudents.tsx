import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { classService, ClassDto } from '../../../services/classService';
import { teacherService } from '../../../services/teacherService';
import { studentService, StudentDto } from '../../../services/studentService';
import { Search, GraduationCap, RefreshCw, BookOpen, Users, ChevronDown, Mail, Phone, Calendar, Filter, MapPin, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import studentIcon from '../../../assets/student-icon.png';

export function TeacherStudents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<(StudentDto & { classIds: string[]; classNames: string[] })[]>([]);
  const [myClasses, setMyClasses] = useState<ClassDto[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setLoading(true);
      try {
        const teachersPage = await teacherService.getAll(0, 100);
        const currentTeacher = teachersPage.content.find(t => t.email === user.email);

        if (currentTeacher) {
          const classesPage = await classService.getByTeacher(currentTeacher.id);
          const classesList = classesPage.content || [];
          setMyClasses(classesList);
          setSelectedClassId(prev => prev || classesList[0]?.id || '');

          const allStudentsMap: Record<string, StudentDto & { classIds: string[]; classNames: string[] }> = {};

          for (const cls of classesList) {
            try {
              const classStudents = await classService.getActiveStudents(cls.id);
              classStudents.forEach(s => {
                if (allStudentsMap[s.id]) {
                  allStudentsMap[s.id].classIds.push(cls.id);
                  allStudentsMap[s.id].classNames.push(cls.className);
                } else {
                  allStudentsMap[s.id] = { ...s, classIds: [cls.id], classNames: [cls.className] };
                }
              });
            } catch (err) {
              console.warn(err);
            }
          }
          setStudents(Object.values(allStudentsMap));
        }
      } catch (err) {
        console.error(err);
        toast.error("Không thể kết nối đến backend. Đang sử dụng dữ liệu mô phỏng.");
        setStudents([
          { id: '1', studentCode: 'DA22TTD001', firstName: 'Nguyễn Văn', lastName: 'An', email: 'an.da22ttd@tvu.edu.vn', phoneNumber: '0987654321', dateOfBirth: '2004-05-15', gender: 'MALE', address: 'Trà Vinh', avatarUrl: null, status: 'ACTIVE', enrollmentDate: '2022-09-01', classIds: ['cls1'], classNames: ['DA22TTD'] },
          { id: '2', studentCode: 'DA22TTD002', firstName: 'Trần Thị', lastName: 'Bình', email: 'binh.da22ttd@tvu.edu.vn', phoneNumber: '0912345678', dateOfBirth: '2004-03-22', gender: 'FEMALE', address: 'Bến Tre', avatarUrl: null, status: 'ACTIVE', enrollmentDate: '2022-09-01', classIds: ['cls1'], classNames: ['DA22TTD'] },
        ]);
        setMyClasses([{ id: 'cls1', classCode: 'DA22TTD', className: 'DA22TTD - Lập trình Web', subject: 'Lập trình Web', teacherId: 'gv1', room: 'P101', schedule: 'T2, T4', status: 'ACTIVE', semester: 1, maxStudents: 40, description: '', currentStudents: 2, academicYear: '2024-2025', startDate: '2024-09-01', endDate: '2025-01-15', teacherName: null } as ClassDto]);

        setSelectedClassId('cls1');
        setSelectedStudentId('1');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentId('');
      return;
    }

    if (!selectedStudentId || !students.some(student => student.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const filteredStudents = students.filter(student => {
    const fullName = `${student.lastName} ${student.firstName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      student.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || student.classIds.includes(filterClass);
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const activeCount = students.filter(s => s.status === 'ACTIVE' || s.status === 'HOAT_DONG').length;
  const classStudentCounts = myClasses.reduce<Record<string, number>>((acc, cls) => {
    acc[cls.id] = students.filter(student => student.classIds.includes(cls.id)).length;
    return acc;
  }, {});
  const selectedClass = myClasses.find(cls => cls.id === selectedClassId) || myClasses[0] || null;
  const selectedClassStudentCount = selectedClass ? (classStudentCounts[selectedClass.id] || 0) : 0;
  const selectedClassStudents = selectedClass
    ? students.filter(student => student.classIds.includes(selectedClass.id))
    : [];
  const selectedStudent = students.find(student => student.id === selectedStudentId) || filteredStudents[0] || students[0] || null;

  return (
    <div className="p-6 space-y-6">

      {/* Header with stats */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-white/10 rounded-xl">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">Lớp cố vấn</h1>
              <p className="text-blue-200 text-xs font-medium">Toàn bộ sinh viên thuộc các lớp bạn đang cố vấn phụ trách</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5">Tổng sinh viên</p>
              <p className="text-4xl font-black text-white">{students.length}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5">Đang học</p>
              <p className="text-4xl font-black text-emerald-300">{activeCount}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1.5">Lớp cố vấn</p>
              <p className="text-4xl font-black text-amber-300">{myClasses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classes summary chips */}
      {myClasses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Các lớp cố vấn đang phụ trách
          </p>
          <div className="flex flex-wrap gap-2">
            {myClasses.map(cls => (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-left transition-all ${
                  selectedClass?.id === cls.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30 hover:border-blue-400'
                }`}
              >
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                <span className={`text-sm font-bold ${selectedClass?.id === cls.id ? 'text-white' : 'text-blue-800 dark:text-blue-300'}`}>{cls.className}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-lg ${selectedClass?.id === cls.id ? 'bg-white/15 text-white' : 'text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40'}`}>{cls.classCode}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${selectedClass?.id === cls.id ? 'bg-white/15 text-white border-white/20' : 'text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 border-blue-200/40 dark:border-blue-900/30'}`}>
                  {classStudentCounts[cls.id] || 0} SV
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedClass && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Chi tiết lớp cố vấn đang chọn</p>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedClass.className}</h2>
              <p className="text-sm text-slate-500 mt-1">Mã lớp: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedClass.classCode}</span> • Môn học: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedClass.subject}</span></p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Sĩ số</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedClassStudentCount}</p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Phòng</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedClass.room || 'N/A'}</p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Học kỳ</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">HK {selectedClass.semester}</p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Năm học</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedClass.academicYear}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30">{selectedClass.schedule || 'Chưa có lịch'}</span>
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">{selectedClass.status}</span>
            <span className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">{selectedClass.maxStudents} SV tối đa</span>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            <table className="w-full text-left bg-white dark:bg-slate-900">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/80 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Sinh viên</th>
                  <th className="py-3 px-4">MSSV</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {selectedClassStudents.slice(0, 5).map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{student.lastName} {student.firstName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{student.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">{student.studentCode}</span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-600 dark:text-slate-400">{student.classNames.join(', ') || selectedClass.classCode}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'bg-green-500' : 'bg-slate-400'}`} />
                        {student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'Đang học' : 'Nghỉ học'}
                      </span>
                    </td>
                  </tr>
                ))}
                {selectedClassStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500 text-sm font-semibold">Lớp này chưa có sinh viên trong dữ liệu hiện tại.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter/Search bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
                placeholder="Tìm sinh viên trong lớp cố vấn theo tên, MSSV hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400"
            />
          </div>
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer appearance-none"
            >
              <option value="all">Tất cả lớp cố vấn</option>
              {myClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.className}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-3.5 pr-8 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer appearance-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang học</option>
              <option value="INACTIVE">Nghỉ học</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {selectedStudent && (
          <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-r from-blue-50 via-white to-indigo-50 dark:from-blue-950/20 dark:via-slate-900 dark:to-indigo-950/20">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={studentIcon}
                  alt={selectedStudent.lastName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm bg-white flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Sinh viên đang chọn</p>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                    {selectedStudent.lastName} {selectedStudent.firstName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">{selectedStudent.studentCode}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${selectedStudent.status === 'ACTIVE' || selectedStudent.status === 'HOAT_DONG' ? 'bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-400 border-green-200/60 dark:border-green-900/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/50'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedStudent.status === 'ACTIVE' || selectedStudent.status === 'HOAT_DONG' ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {selectedStudent.status === 'ACTIVE' || selectedStudent.status === 'HOAT_DONG' ? 'Đang học' : 'Nghỉ học'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                      <BookOpen className="w-3.5 h-3.5" />
                      {selectedStudent.classNames.length} lớp cố vấn
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:${selectedStudent.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-white dark:bg-slate-950 text-blue-700 dark:text-blue-300 text-xs font-bold hover:border-blue-400 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Gửi email
                </a>
                <a
                  href={`tel:${selectedStudent.phoneNumber}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold hover:border-slate-400 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Gọi điện
                </a>
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/students/${selectedStudent.id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-colors"
                >
                  Xem hồ sơ đầy đủ
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Email</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">{selectedStudent.email}</p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Điện thoại</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{selectedStudent.phoneNumber || 'Chưa cập nhật'}</p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Ngày sinh</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{selectedStudent.dateOfBirth || 'N/A'}</p>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Địa chỉ</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">{selectedStudent.address || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {selectedStudent.classNames.map((className, index) => (
                <span
                  key={`${selectedStudent.id}-${className}-${index}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 text-xs font-bold"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {className}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50 text-xs font-bold">
                <User className="w-3.5 h-3.5" />
                {selectedStudent.gender === 'MALE' ? 'Nam' : selectedStudent.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/50 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5" />
                {selectedStudent.enrollmentDate || 'Chưa rõ ngày nhập học'}
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Đang tải danh sách sinh viên...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="py-3.5 px-5">Sinh viên</th>
                  <th className="py-3.5 px-4">MSSV</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Ngày sinh</th>
                    <th className="py-3.5 px-4">Lớp cố vấn</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`transition-colors group cursor-pointer ${selectedStudent?.id === student.id ? 'bg-blue-50/70 dark:bg-blue-950/15' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10'}`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={studentIcon}
                          alt={student.lastName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-200/50 dark:border-slate-700/50 bg-white flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {student.lastName} {student.firstName}
                          </p>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
                        {student.studentCode}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-400 font-semibold">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                          {student.phoneNumber || 'Chưa cập nhật'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 font-medium">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                          <span className="truncate max-w-[150px]">{student.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-400">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {student.dateOfBirth || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {student.classNames.map((cn, i) => (
                          <span key={i} className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/30">
                            {cn}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        student.status === 'ACTIVE' || student.status === 'HOAT_DONG'
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-900/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'bg-green-500' : 'bg-slate-400'}`} />
                        {student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'Đang học' : 'Nghỉ học'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-semibold">Không tìm thấy sinh viên nào trong lớp cố vấn này</p>
                <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
              </div>
            )}
          </div>
        )}

        {/* Footer count */}
        {!loading && filteredStudents.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/10">
            <p className="text-xs text-slate-500 font-semibold">
              Hiển thị <span className="text-blue-600 font-black">{filteredStudents.length}</span> / {students.length} sinh viên
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default TeacherStudents;
