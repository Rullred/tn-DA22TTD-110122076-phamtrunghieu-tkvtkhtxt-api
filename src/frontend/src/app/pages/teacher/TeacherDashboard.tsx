import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { classService, ClassDto, EnrollmentDto } from '../../../services/classService';
import { teacherService, TeacherDto } from '../../../services/teacherService';
import { studentService, StudentDto } from '../../../services/studentService';
import {
  BookOpen, GraduationCap, TrendingUp, Award, RefreshCw, Star,
  Edit3, Check, X, ShieldAlert, CheckCircle2, UserCog, FileSpreadsheet, PlusCircle, Download
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line, Cell
} from 'recharts';
import teacherIcon from '../../../assets/teacher-icon.png';

export function TeacherDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<TeacherDto | null>(null);
  const [myClasses, setMyClasses] = useState<ClassDto[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassDto | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [advisedStudents, setAdvisedStudents] = useState<StudentDto[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const location = useLocation();

  // Tab state: 'stats' | 'grading' | 'advisor' | 'register-class' | 'schedule'
  const [activeTab, setActiveTab] = useState<'stats' | 'grading' | 'advisor' | 'register-class' | 'schedule'>(
    location.pathname.includes('/classes') ? 'grading' : 'stats'
  );

  useEffect(() => {
    if (location.pathname.includes('/classes')) {
      setActiveTab('grading');
    } else {
      setActiveTab('stats');
    }
  }, [location.pathname]);

  // Timeline semesters list for Teachers
  const semestersTimeline = [
    { label: 'HK 1-2022', year: 2022, month: 8 },
    { label: 'HK 2-2022', year: 2023, month: 0 },
    { label: 'HK 3-2022', year: 2023, month: 4 },
    { label: 'HK 1-2023', year: 2023, month: 8 },
    { label: 'HK 2-2023', year: 2024, month: 0 },
    { label: 'HK 3-2023', year: 2024, month: 4 },
    { label: 'HK 1-2024', year: 2024, month: 8 },
    { label: 'HK 2-2024', year: 2025, month: 0 },
    { label: 'HK 3-2024', year: 2025, month: 4 },
    { label: 'HK 1-2025', year: 2025, month: 8 },
    { label: 'HK 2-2025', year: 2026, month: 0 },
    { label: 'HK 3-2025', year: 2026, month: 5 }, // June 2026
    { label: 'HK 1-2026', year: 2026, month: 8 },
    { label: 'HK 2-2026', year: 2027, month: 0 },
  ];

  // Calendar states
  const [currentCalendarYear, setCurrentCalendarYear] = useState(2026);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(5); // June
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 27));
  const [selectedSemesterLabel, setSelectedSemesterLabel] = useState('HK 3-2025');

  const handlePrevMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear(prev => prev - 1);
    } else {
      setCurrentCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear(prev => prev + 1);
    } else {
      setCurrentCalendarMonth(prev => prev + 1);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 7 : day;
  };

  const generateCalendarCells = () => {
    const totalDays = getDaysInMonth(currentCalendarYear, currentCalendarMonth);
    const firstDay = getFirstDayOfMonth(currentCalendarYear, currentCalendarMonth); // 1 = Mon, 7 = Sun
    
    const cells: { date: Date; isCurrentMonth: boolean; dayNumber: number }[] = [];
    
    // Previous month padding
    const prevYear = currentCalendarMonth === 0 ? currentCalendarYear - 1 : currentCalendarYear;
    const prevMonth = currentCalendarMonth === 0 ? 11 : currentCalendarMonth - 1;
    const prevDaysLimit = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i > 0; i--) {
      const dNum = prevDaysLimit - i + 1;
      cells.push({
        date: new Date(prevYear, prevMonth, dNum),
        isCurrentMonth: false,
        dayNumber: dNum
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        date: new Date(currentCalendarYear, currentCalendarMonth, i),
        isCurrentMonth: true,
        dayNumber: i
      });
    }
    
    // Next month padding to keep grid consistent (42 cells)
    const nextYear = currentCalendarMonth === 11 ? currentCalendarYear + 1 : currentCalendarYear;
    const nextMonth = currentCalendarMonth === 11 ? 0 : currentCalendarMonth + 1;
    let padCellCount = 42 - cells.length;
    if (padCellCount < 0) padCellCount = 35 - cells.length;
    for (let i = 1; i <= padCellCount; i++) {
      cells.push({
        date: new Date(nextYear, nextMonth, i),
        isCurrentMonth: false,
        dayNumber: i
      });
    }
    return cells;
  };

  const calendarCells = generateCalendarCells();

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const getWeekDays = (monday: Date) => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      days.push(next);
    }
    return days;
  };

  const activeMonday = getMonday(selectedDate);
  const weekDays = getWeekDays(activeMonday);

  const scheduleSlots: { day: number; start: number; end: number; cls: ClassDto }[] = [];
  myClasses.forEach(cls => {
    if (cls.schedule) {
      const dayMap: Record<string, number> = {
        'thứ 2': 1, 'thứ hai': 1, 't2': 1,
        'thứ 3': 2, 'thứ ba': 2, 't3': 2,
        'thứ 4': 3, 'thứ tư': 3, 't4': 3,
        'thứ 5': 4, 'thứ năm': 4, 't5': 4,
        'thứ 6': 5, 'thứ sáu': 5, 't6': 5,
        'thứ 7': 6, 'thứ bảy': 6, 't7': 6,
        'chủ nhật': 7, 'cn': 7
      };
      
      const parts = cls.schedule.split(/[;|]/);
      parts.forEach(part => {
        const cleanPart = part.toLowerCase().trim();
        let matchedDay = -1;
        for (const [dayStr, idx] of Object.entries(dayMap)) {
          if (cleanPart.includes(dayStr)) {
            matchedDay = idx;
            break;
          }
        }
        if (matchedDay === -1) return;

        const periodRegex = /tiết\s*(\d+)(?:\s*(?:->|-)\s*(\d+))?/;
        const match = cleanPart.match(periodRegex);
        if (match) {
          const start = parseInt(match[1]);
          const end = match[2] ? parseInt(match[2]) : start;
          scheduleSlots.push({
            day: matchedDay,
            start,
            end,
            cls
          });
        }
      });
    }
  });

  const getSlotAt = (day: number, period: number) => {
    return scheduleSlots.find(s => s.day === day && period >= s.start && period <= s.end);
  };

  // Grading states
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);
  const [creditsInput, setCreditsInput] = useState(3);
  const [comp1Input, setComp1Input] = useState<number>(10);
  const [comp2Input, setComp2Input] = useState<number>(10);
  const [finalInput, setFinalInput] = useState<number>(10);
  const [notesInput, setNotesInput] = useState('');
  const [attendanceInput, setAttendanceInput] = useState<number>(100);

  // Conduct/Training score states
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [conductScoreInput, setConductScoreInput] = useState<number>(80);

  // Create class form state
  const [newClass, setNewClass] = useState({
    classCode: '',
    className: '',
    description: '',
    subject: '',
    room: '',
    maxStudents: 40,
    schedule: '',
    academicYear: '2025-2026',
    semester: 3,
    startDate: '2026-06-01',
    endDate: '2026-09-30'
  });
  // 'proposal' = gửi đề xuất cho Admin duyệt | 'direct' = tạo lớp thẳng vào DB
  const [submitMode, setSubmitMode] = useState<'proposal' | 'direct'>('proposal');


  // Load teacher profile, classes and advised students
  useEffect(() => {
    if (!user) return;
    async function loadTeacherData() {
      setLoading(true);
      try {
        const teachersPage = await teacherService.getAll(0, 100);
        const currentTeacher = teachersPage.content.find(t => t.email === user.email);

        if (currentTeacher) {
          setTeacher(currentTeacher);

          // Fetch teaching classes
          const classesPage = await classService.getByTeacher(currentTeacher.id, 0, 100);
          const classesList = classesPage.content || [];
          setMyClasses(classesList);

          if (classesList.length > 0) {
            setSelectedClass(prev => prev || classesList[0]);
          }

          // Fetch students advised by this teacher
          const advisedPage = await studentService.getByAdvisor(currentTeacher.id, 0, 100);
          setAdvisedStudents(advisedPage.content || []);
        } else {
          toast.warning("Hồ sơ giảng viên chưa được cấu hình tại cơ sở dữ liệu Nhân sự HR.");
        }
      } catch (err) {
        console.error("Error loading teacher data", err);
        toast.error("Không thể kết nối đến backend.");
      } finally {
        setLoading(false);
      }
    }
    loadTeacherData();
  }, [user, refreshTrigger]);

  // Load enrollments for selected class
  useEffect(() => {
    if (!selectedClass) return;
    async function loadEnrollments() {
      try {
        const res = await classService.getClassEnrollments(selectedClass.id, 0, 200);
        setEnrollments(res.content || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadEnrollments();
  }, [selectedClass, refreshTrigger]);

  const handleStartGrading = (enroll: EnrollmentDto) => {
    setEditingEnrollmentId(enroll.id);
    setCreditsInput(enroll.credits || 3);
    setComp1Input(enroll.componentGrade1 !== null && enroll.componentGrade1 !== undefined ? enroll.componentGrade1 : 0);
    setComp2Input(enroll.componentGrade2 !== null && enroll.componentGrade2 !== undefined ? enroll.componentGrade2 : 0);
    setFinalInput(enroll.finalExamGrade !== null && enroll.finalExamGrade !== undefined ? enroll.finalExamGrade : 0);
    setNotesInput(enroll.notes || '');
    setAttendanceInput(enroll.attendanceRate !== null && enroll.attendanceRate !== undefined ? enroll.attendanceRate : 100);
  };

  // Submit direct grading down to database
  const handleSaveGrade = async (enrollId: string) => {
    try {
      if (comp1Input < 0 || comp1Input > 10) {
        toast.error("Điểm thành phần 1 phải từ 0 đến 10");
        return;
      }
      if (comp2Input < 0 || comp2Input > 10) {
        toast.error("Điểm thành phần 2 phải từ 0 đến 10");
        return;
      }
      if (finalInput < 0 || finalInput > 10) {
        toast.error("Điểm thi cuối kỳ phải từ 0 đến 10");
        return;
      }

      await classService.updateEnrollment(enrollId, {
        status: 'DA_HOAN_THANH',
        credits: creditsInput,
        componentGrade1: comp1Input,
        componentGrade2: comp2Input,
        finalExamGrade: finalInput,
        attendanceRate: attendanceInput,
        notes: notesInput
      });

      toast.success("Đã lưu kết quả học tập của sinh viên vào cơ sở dữ liệu!");
      setEditingEnrollmentId(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật điểm học tập.");
    }
  };

  // Save conduct score directly to DB
  const handleSaveConductScore = async (studentId: string) => {
    try {
      if (conductScoreInput < 0 || conductScoreInput > 100) {
        toast.error("Điểm rèn luyện phải từ 0 đến 100!");
        return;
      }

      await studentService.updateConductScore(studentId, conductScoreInput);
      toast.success("Đã cập nhật điểm rèn luyện của sinh viên thành công!");
      setEditingStudentId(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu điểm rèn luyện.");
    }
  };

  // Export grading data to Excel
  const handleExportGradingExcel = () => {
    if (!selectedClass || enrollments.length === 0) {
      toast.error('Không có dữ liệu để xuất.');
      return;
    }
    try {
      const rows = enrollments.map((e, idx) => ({
        'STT': idx + 1,
        'Mã SV': e.studentCode || '',
        'Họ và tên': e.studentName || '',
        'Tín chỉ': e.credits || 3,
        'Điểm TP1': e.componentGrade1 ?? '',
        'Điểm TP2': e.componentGrade2 ?? '',
        'Điểm Thi': e.finalExamGrade ?? '',
        'Tổng (Hệ 10)': e.totalGrade10 ?? '',
        'Tổng (Hệ 4)': e.totalGrade4 ?? '',
        'Xếp loại chữ': e.letterGrade || e.grade || '',
        'Chuyên cần (%)': e.attendanceRate ?? '',
        'Ghi chú': e.notes || '',
        'Trạng thái': e.status === 'ACTIVE' || e.status === 'HOAT_DONG' ? 'Đang học'
          : e.status === 'DA_HOAN_THANH' || e.status === 'COMPLETED' ? 'Hoàn thành'
          : e.status === 'DROPPED' || e.status === 'DA_BO_HOC' ? 'Đã rút'
          : e.status || ''
      }));

      // Always use Blob-based download for browser compatibility
      const xlsxModule: any = XLSX;
      const xUtils = xlsxModule.utils ?? xlsxModule.default?.utils ?? XLSX.utils;
      const xWrite = xlsxModule.write ?? xlsxModule.default?.write ?? XLSX.write;

      const ws = xUtils.json_to_sheet(rows);
      // Set column widths
      ws['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 8 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 14 }
      ];

      const cleanClassCode = selectedClass.classCode.replace(/[\/\\?%*:|"<>\s]+/g, '_');
      const cleanClassName = selectedClass.className.replace(/[\/\\?%*:|"<>\s]+/g, '_');
      const sheetName = `Bang diem ${cleanClassCode}`.substring(0, 31);
      const fileName = `Bang_diem_${cleanClassCode}_${cleanClassName}.xlsx`;

      const wb = xUtils.book_new();
      xUtils.book_append_sheet(wb, ws, sheetName);

      const wbout: ArrayBuffer = xWrite(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toast.success(`Đã xuất bảng điểm "${fileName}" thành công!`);
    } catch (err: any) {
      console.error('Lỗi khi xuất file Excel:', err);
      toast.error(`Lỗi khi xuất file Excel: ${err.message || err}`);
    }
  };

  // Create a new class (Register teaching subject) - Proposal or Direct mode
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    const resetForm = () => setNewClass({
      classCode: '',
      className: '',
      description: '',
      subject: '',
      room: '',
      maxStudents: 40,
      schedule: '',
      academicYear: '2025-2026',
      semester: 3,
      startDate: '2026-06-01',
      endDate: '2026-09-30'
    });

    if (submitMode === 'proposal') {
      // === PROPOSAL MODE: save to localStorage for Admin approval ===
      const proposal = {
        id: `prop_${Date.now()}`,
        teacherId: teacher.id,
        teacherName: teacher.fullName || `${teacher.lastName} ${teacher.firstName}`,
        subjectName: newClass.subject,
        className: newClass.className,
        classCode: newClass.classCode,
        description: newClass.description,
        room: newClass.room,
        maxStudents: newClass.maxStudents,
        schedule: newClass.schedule,
        academicYear: newClass.academicYear,
        semester: newClass.semester,
        startDate: newClass.startDate,
        endDate: newClass.endDate,
        notes: newClass.description || '',
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('teacher_proposals') || '[]');
      existing.push(proposal);
      localStorage.setItem('teacher_proposals', JSON.stringify(existing));
      toast.success('✅ Đã gửi đề xuất đăng ký dạy môn học thành công! Admin sẽ xét duyệt và tạo lớp.');
      resetForm();
    } else {
      // === DIRECT MODE: create class directly in DB ===
      try {
        await classService.create({
          classCode: newClass.classCode || ('CLS-' + Math.random().toString(36).substr(2, 6).toUpperCase()),
          className: newClass.className,
          description: newClass.description,
          teacherId: teacher.id,
          subject: newClass.subject,
          room: newClass.room || 'Phòng lý thuyết',
          maxStudents: newClass.maxStudents,
          schedule: newClass.schedule,
          academicYear: newClass.academicYear,
          semester: newClass.semester,
          startDate: newClass.startDate,
          endDate: newClass.endDate
        });
        toast.success('Đăng ký môn học giảng dạy thành công! Lớp học đã được mở dưới database.');
        setActiveTab('grading');
        setRefreshTrigger(prev => prev + 1);
        resetForm();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi đăng ký mở môn dạy học phần.');
      }
    }
  };


  // Statistics Computations
  const getGradePoint = (letter: string) => {
    switch (letter?.toUpperCase()) {
      case 'A': return 4.0;
      case 'B': return 3.0;
      case 'C': return 2.0;
      case 'D': return 1.0;
      case 'F': return 0.0;
      default: return 0.0;
    }
  };

  const classAvgGPA = enrollments.length > 0
    ? (enrollments.reduce((sum, e) => sum + (e.totalGrade4 || getGradePoint(e.grade || '')), 0) / enrollments.length).toFixed(2)
    : '0.00';

  const averageAttendance = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.attendanceRate || 0), 0) / enrollments.length)
    : 0;

  // Grade distributions: count occurrences of letterGrade
  const distCounts: Record<string, number> = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0, 'Chưa có': 0 };
  enrollments.forEach(e => {
    const lGrade = e.letterGrade || e.grade;
    if (lGrade) {
      const char = lGrade.charAt(0).toUpperCase();
      if (distCounts[char] !== undefined) distCounts[char]++;
    } else {
      distCounts['Chưa có']++;
    }
  });

  const gradeDistData = Object.entries(distCounts).map(([key, val]) => ({
    name: key,
    'Số lượng': val
  }));

  // GPA trends over classes taught by this teacher - computed from real enrollment data per class
  // Since we only load enrollments for the selected class, we use available data and estimate others
  const classGpaTrends = myClasses.map(c => {
    if (c.id === selectedClass?.id && enrollments.length > 0) {
      const avg = enrollments.reduce((sum, e) => sum + (e.totalGrade4 || getGradePoint(e.letterGrade || e.grade || '')), 0) / enrollments.length;
      return { name: c.className.substring(0, 12), 'GPA Trung bình': parseFloat(avg.toFixed(2)) };
    }
    // For classes without loaded enrollments, use currentStudents as a rough proxy or 0
    return { name: c.className.substring(0, 12), 'GPA Trung bình': 0 };
  });


  if (loading && refreshTrigger === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-750 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <RefreshCw className="w-7 h-7 text-white animate-spin" />
        </div>
        <p className="text-slate-700 font-bold text-sm">Đang tải cổng thông tin giáo viên...</p>
        <p className="text-slate-400 text-xs font-medium">Đại học Trà Vinh Portal</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6">
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-black text-slate-800">Không tìm thấy Hồ sơ Giảng viên</h2>
          <p className="text-sm text-slate-500 mt-2 px-6">
            Hồ sơ nhân sự cho giáo viên <strong>{user?.email}</strong> chưa được cấu hình tại cơ sở dữ liệu HR. Vui lòng liên hệ Admin để tạo hồ sơ Giảng viên thích hợp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden px-6 py-8 text-white"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #1e1b4b 50%, #0f172a 100%)' }}>
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 page-container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-br from-blue-500 to-amber-500">
                <img
                  src={teacherIcon}
                  alt={teacher.fullName}
                  className="w-full h-full rounded-2xl object-cover bg-white"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-450 rounded-full border-2 border-[#1e1b4b]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-blue-400/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full uppercase tracking-wider">
                  Giảng viên {teacher.department || 'Khoa CNTT'}
                </span>
                <span className="text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full">Hoạt động</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                {teacher.fullName}
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1.5">{teacher.teacherCode || 'GV00248'}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tải lại dữ liệu
            </button>
          </div>
        </div>
      </div>

      <div className="page-container p-6 space-y-6">
        {/* Navigation Tabs — Tổng quan (/teacher) */}
        {!location.pathname.includes('/classes') && (
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'stats'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4.5 h-4.5" />
              Thống kê &amp; Đánh giá lớp học
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'schedule'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              Thời khóa biểu &amp; Lịch dạy
            </button>
            <button
              onClick={() => setActiveTab('advisor')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'advisor'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCog className="w-4.5 h-4.5" />
              Lớp Cố vấn học tập ({advisedStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('register-class')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'register-class'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4.5 h-4.5" />
              Đăng ký giảng dạy
            </button>
          </div>
        )}

        {/* Navigation Tabs — Lớp học phần (/teacher/classes) */}
        {location.pathname.includes('/classes') && (
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('grading')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'grading'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
              Lớp học phần &amp; Chấm điểm
            </button>
            <button
              onClick={() => setActiveTab('register-class')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'register-class'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4.5 h-4.5" />
              Đăng ký giảng dạy
            </button>
          </div>
        )}

        {/* Tab 1: Class Stats */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Lớp đang dạy</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{myClasses.length} học phần</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Sinh viên đang phụ trách</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">
                    {myClasses.reduce((sum, c) => sum + (c.currentStudents || 0), 0)} học viên
                  </h3>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">GPA lớp đang chọn</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{classAvgGPA} / 4.00</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Chuyên cần trung bình</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{averageAttendance}%</h3>
                </div>
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grade Distribution Bar Chart */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm">Phân phối xếp loại học viên (Lớp đang chọn)</h3>
                  <p className="text-slate-400 text-xs mt-1">Xếp loại của các học viên được chấm điểm trong lớp.</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} />
                      <Tooltip />
                      <Bar dataKey="Số lượng" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                        {gradeDistData.map((entry, index) => {
                          let color = '#3b82f6';
                          if (entry.name === 'A') color = '#10b981';
                          if (entry.name === 'B') color = '#60a5fa';
                          if (entry.name === 'F') color = '#ef4444';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Class GPA Trends Line Chart */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm">Xu hướng kết quả lớp học phần</h3>
                  <p className="text-slate-400 text-xs mt-1">GPA Trung bình của các lớp học phần bạn đảm nhận giảng dạy.</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={classGpaTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                      <YAxis stroke="#94a3b8" domain={[0, 4.0]} ticks={[1.0, 2.0, 3.0, 4.0]} fontSize={11} fontWeight={600} />
                      <Tooltip />
                      <Line type="monotone" dataKey="GPA Trung bình" stroke="#8b5cf6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Teaching & Grading */}
        {activeTab === 'grading' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar classes list */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Danh sách lớp giảng dạy</h4>
              <div className="space-y-2">
                {myClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`w-full text-left p-4 border-2 rounded-2xl transition-all ${
                      selectedClass?.id === cls.id
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <p className="text-sm font-bold leading-snug">{cls.className}</p>
                    <p className="text-xs font-mono text-slate-500 mt-1.5">Mã: {cls.classCode}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Phòng: {cls.room}</p>
                  </button>
                ))}

                {myClasses.length === 0 && (
                  <div className="text-center py-8 text-slate-400 font-semibold text-sm bg-slate-50 rounded-2xl">
                    Chưa có lớp giảng dạy.
                  </div>
                )}
              </div>
            </div>

            {/* Grading board */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              {selectedClass ? (
                <>
                  <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">{selectedClass.className}</h3>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Môn học: <strong>{selectedClass.subject}</strong>&nbsp;•&nbsp; Sĩ số: <strong>{enrollments.length} sinh viên</strong>&nbsp;•&nbsp; HK{selectedClass.semester} ({selectedClass.academicYear})
                      </p>
                    </div>
                    {enrollments.length > 0 && (
                      <button
                        onClick={handleExportGradingExcel}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all active:scale-95 flex-shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        Xuất Excel
                      </button>
                    )}
                  </div>


                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wide text-xs">
                          <th className="py-3 px-3">Mã SV</th>
                          <th className="py-3 px-3">Họ tên</th>
                          <th className="py-3 px-3 text-center">TC</th>
                          <th className="py-3 px-3 text-center">Điểm TP1</th>
                          <th className="py-3 px-3 text-center">Điểm TP2</th>
                          <th className="py-3 px-3 text-center">Điểm Thi</th>
                          <th className="py-3 px-3 text-center">Hệ 10</th>
                          <th className="py-3 px-3 text-center">Hệ 4</th>
                          <th className="py-3 px-3 text-center">Điểm Chữ</th>
                          <th className="py-3 px-3">Ghi chú</th>
                          <th className="py-3 px-3 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {enrollments.map((enroll) => {
                          const isEditing = editingEnrollmentId === enroll.id;
                          return (
                            <tr key={enroll.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-3 font-mono text-slate-500">{enroll.studentCode || 'N/A'}</td>
                              <td className="py-3.5 px-3 font-bold text-slate-900">{enroll.studentName || 'Học viên'}</td>
                              <td className="py-3.5 px-3 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={creditsInput}
                                    onChange={(e) => setCreditsInput(Math.max(1, parseInt(e.target.value) || 3))}
                                    className="w-12 px-2 py-1 text-center bg-white border border-slate-350 rounded font-bold"
                                  />
                                ) : (
                                  enroll.credits || 3
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={comp1Input}
                                    onChange={(e) => setComp1Input(parseFloat(e.target.value) || 0)}
                                    className="w-14 px-2 py-1 text-center bg-white border border-slate-350 rounded font-bold"
                                  />
                                ) : (
                                  enroll.componentGrade1 !== null && enroll.componentGrade1 !== undefined ? enroll.componentGrade1.toFixed(1) : '—'
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={comp2Input}
                                    onChange={(e) => setComp2Input(parseFloat(e.target.value) || 0)}
                                    className="w-14 px-2 py-1 text-center bg-white border border-slate-350 rounded font-bold"
                                  />
                                ) : (
                                  enroll.componentGrade2 !== null && enroll.componentGrade2 !== undefined ? enroll.componentGrade2.toFixed(1) : '—'
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={finalInput}
                                    onChange={(e) => setFinalInput(parseFloat(e.target.value) || 0)}
                                    className="w-14 px-2 py-1 text-center bg-white border border-slate-350 rounded font-bold"
                                  />
                                ) : (
                                  enroll.finalExamGrade !== null && enroll.finalExamGrade !== undefined ? enroll.finalExamGrade.toFixed(1) : '—'
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                                {enroll.totalGrade10 !== null && enroll.totalGrade10 !== undefined ? enroll.totalGrade10.toFixed(1) : '—'}
                              </td>
                              <td className="py-3.5 px-3 text-center font-bold text-blue-700">
                                {enroll.totalGrade4 !== null && enroll.totalGrade4 !== undefined ? enroll.totalGrade4.toFixed(2) : '—'}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                  enroll.letterGrade?.startsWith('A') ? 'bg-green-50 text-green-700 border-green-200' :
                                  enroll.letterGrade?.startsWith('B') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  enroll.letterGrade?.startsWith('C') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  enroll.letterGrade?.startsWith('D') ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  enroll.letterGrade === 'F' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                  {enroll.letterGrade || enroll.grade || '—'}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-slate-500">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={notesInput}
                                    onChange={(e) => setNotesInput(e.target.value)}
                                    className="w-full px-2 py-1 bg-white border border-slate-350 rounded"
                                    placeholder="Ghi chú..."
                                  />
                                ) : (
                                  enroll.notes || '—'
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                {isEditing ? (
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handleSaveGrade(enroll.id)}
                                      className="p-1 text-green-600 bg-green-50 border border-green-200 rounded-lg"
                                      title="Lưu kết quả"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingEnrollmentId(null)}
                                      className="p-1 text-red-650 bg-red-50 border border-red-200 rounded-lg"
                                      title="Hủy bỏ"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleStartGrading(enroll)}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors font-bold flex items-center gap-1 ml-auto"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Chấm điểm
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {enrollments.length === 0 && (
                          <tr>
                            <td colSpan={11} className="text-center py-10 text-slate-400">
                              Chưa có sinh viên đăng ký học phần này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-slate-400">
                  Vui lòng chọn một lớp học phần bên trái để thực hiện quản lý điểm số.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Advisor Panel */}
        {activeTab === 'advisor' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Danh sách lớp sinh viên Cố vấn học tập</h3>
              <p className="text-xs text-slate-500 mt-1">Giảng viên trực tiếp nhập và lưu Điểm rèn luyện của sinh viên cố vấn xuống cơ sở dữ liệu.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wide text-xs">
                    <th className="py-3 px-4">Mã SV</th>
                    <th className="py-3 px-4">Họ tên</th>
                    <th className="py-3 px-4">Chuyên ngành</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-center">Điểm rèn luyện</th>
                    <th className="py-3 px-4 text-right">Cập nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {advisedStudents.map((stud) => {
                    const isEditing = editingStudentId === stud.id;
                    return (
                      <tr key={stud.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500">{stud.studentCode}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{stud.lastName} {stud.firstName}</td>
                        <td className="py-3.5 px-4 text-slate-700">{stud.major || 'Công nghệ thông tin'}</td>
                        <td className="py-3.5 px-4 text-blue-600 font-mono">{stud.email}</td>
                        <td className="py-3.5 px-4 text-center font-black text-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={conductScoreInput}
                              onChange={(e) => setConductScoreInput(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-16 px-2 py-1 text-center bg-white border border-slate-350 rounded font-bold"
                            />
                          ) : (
                            stud.conductScore !== null && stud.conductScore !== undefined ? `${stud.conductScore}đ` : 'Chưa có'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveConductScore(stud.id)}
                                className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => setEditingStudentId(null)}
                                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStudentId(stud.id);
                                setConductScoreInput(stud.conductScore || 80);
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors font-bold"
                            >
                              Sửa điểm
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {advisedStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">
                        Bạn chưa được phân công cố vấn học tập cho sinh viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Register Class */}
        {activeTab === 'register-class' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Đăng ký dạy & Tạo lớp học phần mới</h3>
              <p className="text-xs text-slate-500 mt-1">Chọn hình thức gửi đề xuất (Admin duyệt) hoặc tạo lớp trực tiếp ngay lập tức.</p>
            </div>

            {/* Submit Mode Toggle */}
            <div className="flex gap-3 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setSubmitMode('proposal')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                  submitMode === 'proposal'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                📋 Gửi đề xuất (Admin duyệt)
              </button>
              <button
                type="button"
                onClick={() => setSubmitMode('direct')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                  submitMode === 'direct'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                ⚡ Tạo lớp trực tiếp
              </button>
            </div>

            {submitMode === 'proposal' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                📌 Đề xuất sẽ được gửi đến Admin để xét duyệt. Admin sẽ xem tại mục <strong>"Môn học Giảng viên đăng ký dạy"</strong> và tạo lớp chính thức.
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Tên lớp học phần</label>
                  <input
                    type="text"
                    required
                    placeholder="Lớp K22 Hệ thống thông tin B"
                    value={newClass.className}
                    onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Mã lớp (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Tự động tạo nếu bỏ trống"
                    value={newClass.classCode}
                    onChange={(e) => setNewClass({ ...newClass, classCode: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Môn học</label>
                  <input
                    type="text"
                    required
                    placeholder="Lập trình thiết bị di động"
                    value={newClass.subject}
                    onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Phòng học</label>
                  <input
                    type="text"
                    placeholder="Phòng G3.01"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Sĩ số tối đa</label>
                  <input
                    type="number"
                    required
                    value={newClass.maxStudents}
                    onChange={(e) => setNewClass({ ...newClass, maxStudents: parseInt(e.target.value) || 40 })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Học kỳ</label>
                  <select
                    value={newClass.semester}
                    onChange={(e) => setNewClass({ ...newClass, semester: parseInt(e.target.value) || 3 })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
                  >
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                    <option value={3}>Học kỳ 3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase">Năm học</label>
                  <input
                    type="text"
                    required
                    value={newClass.academicYear}
                    onChange={(e) => setNewClass({ ...newClass, academicYear: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">Lịch học</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thứ 2 (Tiết 1-3) hoặc Thứ 4: Tiết 7->9/Ph G3.01"
                  value={newClass.schedule}
                  onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">Mô tả học phần</label>
                <textarea
                  placeholder="Nội dung, tài liệu của học phần..."
                  rows={3}
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 mt-2 ${
                  submitMode === 'proposal'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700'
                }`}
              >
                {submitMode === 'proposal' ? '📋 Gửi đề xuất cho Admin duyệt' : '⚡ Tạo lớp học phần ngay'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 5: Teacher Weekly Schedule & Calendar */}
        {activeTab === 'schedule' && (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Timeline Semesters */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
              <div className="flex items-center gap-3 min-w-[900px] justify-between relative py-4">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 -z-10" />
                {semestersTimeline.map((timelineSem) => {
                  const isSelected = selectedSemesterLabel === timelineSem.label;
                  return (
                    <button
                      key={timelineSem.label}
                      onClick={() => {
                        setSelectedSemesterLabel(timelineSem.label);
                        setCurrentCalendarYear(timelineSem.year);
                        setCurrentCalendarMonth(timelineSem.month);
                        const newD = new Date(timelineSem.year, timelineSem.month, 27);
                        setSelectedDate(newD);
                      }}
                      className={`flex flex-col items-center gap-2 bg-white px-3 relative z-10 hover:scale-105 transition-transform`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border-2 transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-110' 
                          : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
                      }`}>
                        ✓
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        isSelected ? 'text-blue-600 font-extrabold' : 'text-slate-500'
                      }`}>
                        {timelineSem.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout Column Calendar & Weekly Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Solar calendar picker */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 font-extrabold">
                      &lt;
                    </button>
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      Tháng {currentCalendarMonth + 1} &nbsp; {currentCalendarYear}
                    </h4>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 font-extrabold">
                      &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500 mb-2">
                    <span>T2</span>
                    <span>T3</span>
                    <span>T4</span>
                    <span>T5</span>
                    <span>T6</span>
                    <span>T7</span>
                    <span className="text-red-500">CN</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((cell, idx) => {
                      const isSelected = selectedDate &&
                        cell.date.getDate() === selectedDate.getDate() &&
                        cell.date.getMonth() === selectedDate.getMonth() &&
                        cell.date.getFullYear() === selectedDate.getFullYear();
                      
                      const isToday = cell.date.getDate() === 27 && 
                                      cell.date.getMonth() === 5 && 
                                      cell.date.getFullYear() === 2026;

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDate(cell.date)}
                          className={`h-9 w-full flex flex-col items-center justify-center rounded-xl relative text-[11px] font-bold transition-all ${
                            !cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-700 hover:bg-slate-100'
                          } ${isSelected ? 'bg-blue-600 text-white font-extrabold shadow-sm' : ''} ${
                            isToday && !isSelected ? 'bg-green-600 text-white font-extrabold rounded-full' : ''
                          }`}
                        >
                          <span>{cell.dayNumber}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status Box */}
                <div className="bg-blue-50/50 rounded-3xl border border-blue-100 p-5 space-y-2 text-xs font-bold text-blue-900 leading-relaxed">
                  <p>Hệ thống tự động hiển thị lịch giảng dạy các lớp học phần bạn phụ trách.</p>
                </div>
              </div>

              {/* Dynamic weekly grid */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-4 mb-5">
                    <h3 className="font-extrabold text-slate-800 text-base">
                      Lịch dạy học trong tuần từ ngày {String(weekDays[0].getDate()).padStart(2, '0')}/{String(weekDays[0].getMonth() + 1).padStart(2, '0')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Lưới lịch trình tự động cập nhật dựa trên ngày chọn trên bộ lịch.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-200/50 text-center min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-250 text-slate-700 font-bold text-sm">
                          <th className="py-4 border border-slate-200/50 w-20">Tiết</th>
                          {weekDays.map((date, idx) => {
                            const dayLabel = idx === 6 ? 'Chủ Nhật' : `Thứ ${idx + 2}`;
                            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                            const isSelected = selectedDate &&
                              date.getDate() === selectedDate.getDate() &&
                              date.getMonth() === selectedDate.getMonth() &&
                              date.getFullYear() === selectedDate.getFullYear();

                            return (
                              <th key={idx} className={`py-3 border border-slate-200/50 ${isSelected ? 'bg-blue-100/60 text-blue-900 font-black' : ''}`}>
                                <div className="flex flex-col items-center">
                                  <span>{dayLabel}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({formattedDate})</span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 16 }, (_, i) => i + 1).map(period => {
                          return (
                            <tr key={period} className="hover:bg-slate-50/20 text-xs font-semibold text-slate-700">
                              <td className="py-3 border border-slate-200/50 bg-slate-50 font-bold text-slate-500">
                                Tiết {period}
                              </td>
                              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                                const slot = getSlotAt(day, period);
                                if (!slot) {
                                  return <td key={day} className="border border-slate-200/50" />;
                                }

                                if (slot.start === period) {
                                  const rowSpan = slot.end - slot.start + 1;
                                  return (
                                    <td
                                      key={day}
                                      rowSpan={rowSpan}
                                      className="border border-slate-200 p-2 text-left align-top"
                                      style={{
                                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                        borderLeft: '4px solid #22c55e'
                                      }}
                                    >
                                      <p className="font-extrabold text-green-900 leading-snug">{slot.cls.className}</p>
                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Lớp: {slot.cls.classCode}</p>
                                      <p className="text-[10px] text-green-700 font-medium mt-0.5">Phòng: {slot.cls.room || 'Tự do'}</p>
                                      <p className="text-[10px] text-indigo-900 font-bold mt-0.5">Môn học: {slot.cls.subject}</p>
                                    </td>
                                  );
                                }
                                return null;
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
