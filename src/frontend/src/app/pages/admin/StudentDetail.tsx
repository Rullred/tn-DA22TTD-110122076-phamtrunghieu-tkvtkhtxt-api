import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { studentService, StudentDto } from '../../../services/studentService';
import { classService, ClassDto, EnrollmentDto } from '../../../services/classService';
import { teacherService, TeacherDto } from '../../../services/teacherService';
import { ArrowLeft, Mail, Phone, MapPin, TrendingUp, Calendar, Award, BookOpen, Trash2, Plus, RefreshCw, Star, User, GraduationCap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import studentIcon from '../../../assets/student-icon.png';
import teacherIcon from '../../../assets/teacher-icon.png';

export function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentDto | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [classesDetail, setClassesDetail] = useState<Record<string, ClassDto>>({});
  const [advisor, setAdvisor] = useState<TeacherDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [allClasses, setAllClasses] = useState<ClassDto[]>([]);
  const [selectedClassToEnroll, setSelectedClassToEnroll] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!id) return;
    async function loadStudentData() {
      setLoading(true);
      try {
        // Fetch student profile
        const studentProfile = await studentService.getById(id);
        setStudent(studentProfile);

        // Fetch enrollments
        const enrollmentsPage = await classService.getStudentEnrollments(id);
        const enrollList = enrollmentsPage.content || [];
        setEnrollments(enrollList);

        // Fetch details of classes
        const classesMap: Record<string, ClassDto> = {};
        for (const enroll of enrollList) {
          try {
            const cls = await classService.getById(enroll.classId);
            classesMap[enroll.classId] = cls;
          } catch (err) {
            console.error("Could not fetch class details for " + enroll.classId, err);
          }
        }
        setClassesDetail(classesMap);

        // Try to fetch teacher advisor
        if (enrollList.length > 0) {
          const firstClassId = enrollList[0].classId;
          const firstClass = classesMap[firstClassId];
          if (firstClass && firstClass.teacherId) {
            try {
              const adviserTeacher = await teacherService.getById(firstClass.teacherId);
              setAdvisor(adviserTeacher);
            } catch (e) {
              console.warn(e);
            }
          }
        }

        // Fetch all classes for new enrollment dropdown
        const allClassesPage = await classService.getAll(0, 100);
        setAllClasses(allClassesPage.content || []);
      } catch (err) {
        console.error("Error loading student detail", err);
        toast.error("Không thể tải thông tin sinh viên từ máy chủ.");
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    }
    loadStudentData();
  }, [id, refreshTrigger]);

  const handleEnroll = async () => {
    if (!id || !selectedClassToEnroll) return;
    try {
      await classService.enrollStudent(selectedClassToEnroll, id);
      toast.success("Đăng ký lớp học thành công!");
      setSelectedClassToEnroll('');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đăng ký lớp học thất bại.");
    }
  };

  const handleDropClass = async (classId: string) => {
    if (!id) return;
    if (!window.confirm("Bạn có chắc chắn muốn rút tên sinh viên này khỏi lớp học?")) return;
    try {
      await classService.dropStudent(classId, id);
      toast.success("Đã rút tên sinh viên khỏi lớp học.");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Rút học phần thất bại.");
    }
  };

  const calculateGPA = () => {
    if (enrollments.length === 0) return 0;
    let totalPoints = 0;
    let gradedCount = 0;

    enrollments.forEach(e => {
      if (e.grade) {
        gradedCount++;
        switch (e.grade.toUpperCase()) {
          case 'A': totalPoints += 4.0; break;
          case 'B': totalPoints += 3.0; break;
          case 'C': totalPoints += 2.0; break;
          case 'D': totalPoints += 1.0; break;
          case 'F': totalPoints += 0.0; break;
          default: gradedCount--; break;
        }
      }
    });

    return gradedCount > 0 ? (totalPoints / gradedCount) : 0;
  };

  const gpaVal = calculateGPA();

  const getGpaTier = (gpa: number) => {
    if (gpa >= 3.6) return { label: 'Xuất sắc', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    if (gpa >= 3.2) return { label: 'Giỏi', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (gpa >= 2.5) return { label: 'Khá', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    if (gpa >= 2.0) return { label: 'Trung bình', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Yếu / Kém', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  };

  const gpaTier = getGpaTier(gpaVal);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải hồ sơ chi tiết sinh viên...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
          <p className="text-slate-500 font-semibold mb-4">Không tìm thấy hồ sơ sinh viên này</p>
          <Link to="/admin/students" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <Link
          to="/admin/students"
          className="relative z-10 p-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60 rounded-xl transition-all shadow-sm text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="relative z-10">
          <h1 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">Chi tiết hồ sơ học viên</h1>
          <p className="text-xs text-slate-500 font-medium">Quản lý kết quả học tập và lớp chuyên môn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Profile card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm text-center relative overflow-hidden">
            {/* Top gradient accent */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

            <img
              src={studentIcon}
              alt={student.lastName}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-50 dark:border-slate-800 object-cover shadow-sm bg-white"
            />
            
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white leading-tight">{student.lastName} {student.firstName}</h2>
            <p className="text-xs font-bold font-mono text-slate-500 dark:text-slate-500 mt-1.5 uppercase tracking-wider">{student.studentCode}</p>
            
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-4 border ${
              student.status === 'ACTIVE' || student.status === 'HOAT_DONG'
                ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200/50'
                : 'bg-slate-550/10 text-slate-650'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'bg-green-500' : 'bg-slate-400'}`} />
              {student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'Đang học' : 'Nghỉ học'}
            </span>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-850 text-left space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate" title={student.email}>{student.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{student.phoneNumber || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate" title={student.address}>{student.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Ngày sinh: {student.dateOfBirth}</span>
              </div>
            </div>
          </div>

          {/* Academic advisor */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Cố vấn học tập</h3>
            {advisor ? (
              <div className="flex items-center gap-3.5">
                <img
                  src={teacherIcon}
                  alt={advisor.lastName}
                  className="w-11 h-11 rounded-full border border-slate-250/50 dark:border-slate-800 object-cover flex-shrink-0 bg-white"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{advisor.lastName} {advisor.firstName}</p>
                  <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">{advisor.department}</p>
                  <p className="text-xs text-blue-600 font-mono mt-0.5 truncate">{advisor.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 italic text-slate-400 text-[11px] font-semibold">
                Chưa đăng ký cố vấn lớp học
              </div>
            )}
          </div>
        </div>

        {/* Right column: Details, Transcripts and Course registration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* GPA and Performance summary */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
            {/* Ambient pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            <h3 className="mb-5 flex items-center gap-2 font-bold text-[10px] text-blue-200 uppercase tracking-widest relative z-10">
              <TrendingUp className="w-4.5 h-4.5 text-amber-400 animate-bounce" />
              Tổng kết Học lực & GPA
            </h3>
            
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wide">GPA Hệ 4.0</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-4xl font-black text-amber-400 tracking-tight">{gpaVal.toFixed(2)}</h2>
                  <span className="text-xs text-blue-200 font-bold">/ 4.0</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${gpaTier.color}`}>
                    {gpaTier.label}
                  </span>
                </div>
                <div className="w-full bg-blue-950/50 rounded-full h-1.5 mt-4">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-1.5 rounded-full shadow-lg"
                    style={{ width: `${(gpaVal / 4.0) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wide">Tín chỉ tích lũy</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-4xl font-black text-white tracking-tight">
                    {enrollments.length * 3}
                  </h2>
                  <span className="text-xs text-blue-200 font-bold">Tín chỉ (TC)</span>
                </div>
                <p className="text-[10px] text-blue-300 mt-4.5 font-semibold">
                  Tương đương {enrollments.length} học phần đăng ký
                </p>
              </div>
            </div>
          </div>

          {/* Academic Transcripts */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Chương trình đào tạo & Điểm số
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    <th className="pb-3 px-2">Mã HP</th>
                    <th className="pb-3 px-2">Tên học phần</th>
                    <th className="pb-3 px-2">Điểm chữ</th>
                    <th className="pb-3 px-2">Chuyên cần</th>
                    <th className="pb-3 px-2">Phòng học</th>
                    <th className="pb-3 px-2 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm font-semibold text-slate-700 dark:text-slate-350">
                  {enrollments.map((enroll) => {
                    const cls = classesDetail[enroll.classId];
                    const gradeColor =
                      enroll.grade === 'A' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' :
                      enroll.grade === 'B' ? 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30' :
                      enroll.grade === 'C' ? 'text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900/30' :
                      enroll.grade === 'D' ? 'text-orange-700 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30' :
                      enroll.grade === 'F' ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' : 'text-slate-400 bg-slate-50 dark:bg-slate-800';

                    return (
                      <tr key={enroll.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/5 transition-colors">
                        <td className="py-3 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">{cls?.classCode || '220099'}</td>
                        <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">{cls?.className || 'Chưa đồng bộ'}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border ${gradeColor}`}>
                            {enroll.grade || 'Chưa có'}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-bold">{enroll.attendanceRate ? `${enroll.attendanceRate}%` : 'N/A'}</td>
                        <td className="py-3 px-2 font-medium text-slate-500">{cls?.room || 'Tự do'}</td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => handleDropClass(enroll.classId)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Rút học phần"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {enrollments.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8 italic bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 mt-2">
                Học viên chưa ghi danh vào lớp học phần nào trong học kỳ này.
              </p>
            )}
          </div>

          {/* Quick Enrollment */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Đăng ký thêm Học phần TVU CET
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mb-5">Ghi danh trực tiếp học viên vào lớp học học kỳ hiện tại</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedClassToEnroll}
                onChange={(e) => setSelectedClassToEnroll(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="">Chọn lớp học phần...</option>
                {allClasses
                  .filter(c => !enrollments.some(e => e.classId === c.id)) // filter out already enrolled
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.className} ({c.classCode}) — {c.subject}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleEnroll}
                disabled={!selectedClassToEnroll}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Đăng ký học
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default StudentDetail;
