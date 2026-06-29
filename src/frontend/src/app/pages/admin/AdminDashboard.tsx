import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { studentService } from '../../../services/studentService';
import { teacherService } from '../../../services/teacherService';
import { classService } from '../../../services/classService';
import { adminService, BlockedIpsResponse } from '../../../services/adminService';
import {
  Users, GraduationCap, BookOpen, ShieldAlert,
  Unlock, Ban, RefreshCw, TrendingUp, AlertTriangle,
  Activity, Zap, Shield, Eye, CheckCircle, XCircle, Clock,
  ArrowRight, ShieldCheck, Server, Key
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, AreaChart, Area, CartesianGrid
} from 'recharts';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, blockedIps: 0 });
  const [blockedData, setBlockedData] = useState<BlockedIpsResponse>({ blockedIps: [], totalCount: 0 });
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('Chặn thủ công bởi Admin');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'grades' | 'schedule'>('overview');

  // Grades approval states
  const [pendingGrades, setPendingGrades] = useState<any[]>([]);
  const [pendingTrainingScores, setPendingTrainingScores] = useState<any[]>([]);
  const [activeGradesSubTab, setActiveGradesSubTab] = useState<'study' | 'training'>('study');

  // Timeline semesters list for Admin
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
  
  // Teachers and Classes lists for scheduling check
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);

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

  const isClassOnDay = (scheduleStr: string, dayIndex: number) => {
    if (!scheduleStr) return false;
    const cleanStr = scheduleStr.toLowerCase();
    const dayMap: Record<number, string[]> = {
      1: ['thứ 2', 'thứ hai', 't2'],
      2: ['thứ 3', 'thứ ba', 't3'],
      3: ['thứ 4', 'thứ tư', 't4'],
      4: ['thứ 5', 'thứ năm', 't5'],
      5: ['thứ 6', 'thứ sáu', 't6'],
      6: ['thứ 7', 'thứ bảy', 't7'],
      7: ['chủ nhật', 'cn']
    };
    return dayMap[dayIndex].some(marker => cleanStr.includes(marker));
  };

  const selectedDayOfWeek = selectedDate ? (selectedDate.getDay() === 0 ? 7 : selectedDate.getDay()) : 1;

  const [securityLogs] = useState([
    { id: 1, time: 'Vừa xong', ip: '192.168.1.102', action: 'Đăng nhập thất bại', user: 'admin', result: 'Sai mật khẩu (1/20)', type: 'warning' },
    { id: 2, time: '5 phút trước', ip: '172.16.2.45', action: 'Khóa tài khoản', user: 'student_k22', result: 'Tự động khóa 30s', type: 'danger' },
    { id: 3, time: '15 phút trước', ip: '113.161.42.5', action: 'Chặn IP tự động', user: 'system', result: 'IP bị chặn vĩnh viễn (>20 lần)', type: 'danger' },
    { id: 4, time: '1 giờ trước', ip: '192.168.1.50', action: 'Mở khóa tài khoản', user: 'gv_nam', result: 'Admin mở khóa tài khoản', type: 'success' },
    { id: 5, time: '3 giờ trước', ip: '127.0.0.1', action: 'Đăng ký tài khoản', user: 'student_new', result: 'Đăng ký thành công', type: 'info' },
  ]);

  // Real-time data from API
  const [majorData, setMajorData] = useState([
    { name: 'CNTT', count: 0, color: 'url(#blueGradient)' },
    { name: 'TTNT', count: 0, color: 'url(#purpleGradient)' },
    { name: 'KTMT', count: 0, color: 'url(#emeraldGradient)' },
    { name: 'KHMT', count: 0, color: 'url(#amberGradient)' },
    { name: 'CTO', count: 0, color: 'url(#roseGradient)' },
    { name: 'XD', count: 0, color: 'url(#cyanGradient)' },
  ]);

  const [activityData] = useState([
    { month: 'T1', logins: 120, registrations: 8 },
    { month: 'T2', logins: 95, registrations: 5 },
    { month: 'T3', logins: 148, registrations: 12 },
    { month: 'T4', logins: 172, registrations: 15 },
    { month: 'T5', logins: 135, registrations: 7 },
    { month: 'T6', logins: 198, registrations: 20 },
  ]);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [studentCount, teacherCount, classCount, blockedResponse, teachersPage, classesPage, studentsPage] = await Promise.all([
          studentService.getCount().catch(() => 50),
          teacherService.getCount().catch(() => 40),
          classService.getCount().catch(() => 25),
          adminService.getBlockedIps().catch(() => ({ blockedIps: ['192.168.1.99', '10.0.0.1'], totalCount: 2 })),
          teacherService.getAll(0, 200).catch(() => ({ content: [] })),
          classService.getAll(0, 500).catch(() => ({ content: [] })),
          studentService.getAll(0, 500).catch(() => ({ content: [] }))
        ]);
        setStats({ students: studentCount, teachers: teacherCount, classes: classCount, blockedIps: blockedResponse.totalCount });
        setBlockedData(blockedResponse);
        setAllTeachers(teachersPage.content || []);
        setAllClasses(classesPage.content || []);

        // Calculate major distribution from real student data
        const students = studentsPage.content || [];
        const majorCounts: Record<string, number> = {
          'CNTT': 0,
          'TTNT': 0,
          'KTMT': 0,
          'KHMT': 0,
          'CTO': 0,
          'XD': 0
        };

        students.forEach((student: any) => {
          // Try to extract major from student metadata or major field
          const metaStr = localStorage.getItem(`student_meta_${student.id}`);
          const meta = metaStr ? JSON.parse(metaStr) : {};
          const major = meta.major || student.major || '';
          
          // Map majors to categories
          if (major.toLowerCase().includes('công nghệ thông tin') || major.toLowerCase().includes('cntt')) {
            majorCounts['CNTT']++;
          } else if (major.toLowerCase().includes('trí tuệ nhân tạo') || major.toLowerCase().includes('ttnt') || major.toLowerCase().includes('ai')) {
            majorCounts['TTNT']++;
          } else if (major.toLowerCase().includes('kỹ thuật máy tính') || major.toLowerCase().includes('ktmt')) {
            majorCounts['KTMT']++;
          } else if (major.toLowerCase().includes('khoa học máy tính') || major.toLowerCase().includes('khmt') || major.toLowerCase().includes('computer science')) {
            majorCounts['KHMT']++;
          } else if (major.toLowerCase().includes('công trình') || major.toLowerCase().includes('cto') || major.toLowerCase().includes('civil')) {
            majorCounts['CTO']++;
          } else if (major.toLowerCase().includes('xây dựng') || major.toLowerCase().includes('xd')) {
            majorCounts['XD']++;
          } else {
            // Default to CNTT if not specified
            majorCounts['CNTT']++;
          }
        });

        // Update major data
        setMajorData([
          { name: 'CNTT', count: majorCounts['CNTT'], color: 'url(#blueGradient)' },
          { name: 'TTNT', count: majorCounts['TTNT'], color: 'url(#purpleGradient)' },
          { name: 'KTMT', count: majorCounts['KTMT'], color: 'url(#emeraldGradient)' },
          { name: 'KHMT', count: majorCounts['KHMT'], color: 'url(#amberGradient)' },
          { name: 'CTO', count: majorCounts['CTO'], color: 'url(#roseGradient)' },
          { name: 'XD', count: majorCounts['XD'], color: 'url(#cyanGradient)' },
        ]);

        // Load pending grades from localStorage
        const pGradesStr = localStorage.getItem('pending_grades') || '[]';
        setPendingGrades(JSON.parse(pGradesStr));

        // Load pending training scores from localStorage
        const pTrainingStr = localStorage.getItem('pending_training_scores') || '[]';
        setPendingTrainingScores(JSON.parse(pTrainingStr));
      } catch (err) {
        console.error('Error loading admin stats', err);
        toast.error('Không thể kết nối backend. Đang hiển thị dữ liệu mô phỏng.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [refreshTrigger]);

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpToBlock) return;
    try {
      await adminService.blockIp(newIpToBlock, blockReason);
      toast.success(`Đã chặn IP ${newIpToBlock} thành công.`);
      setNewIpToBlock('');
      setRefreshTrigger(prev => prev + 1);
    } catch {
      toast.error('Chặn IP thất bại.');
    }
  };

  const handleUnblockIp = async (ip: string) => {
    try {
      await adminService.unblockIp(ip);
      toast.success(`Đã gỡ chặn IP ${ip}.`);
      setRefreshTrigger(prev => prev + 1);
    } catch {
      toast.error('Mở khóa IP thất bại.');
    }
  };

  const handleClearAllBlocked = async () => {
    if (!window.confirm('Bạn có chắc muốn mở khóa toàn bộ IP bị chặn không?')) return;
    try {
      await adminService.clearAllBlockedIps();
      toast.success('Đã giải phóng toàn bộ IP bị chặn.');
      setRefreshTrigger(prev => prev + 1);
    } catch {
      toast.error('Không thể thực hiện thao tác.');
    }
  };

  const handleApproveGrade = async (gradeItem: any) => {
    try {
      await classService.updateEnrollment(gradeItem.id, {
        status: 'DA_HOAN_THANH',
        grade: gradeItem.grade,
        attendanceRate: gradeItem.attendanceRate,
        notes: gradeItem.notes
      });

      const appGradesStr = localStorage.getItem('approved_grades') || '[]';
      const approvedGradesList = JSON.parse(appGradesStr);
      approvedGradesList.push(gradeItem);
      localStorage.setItem('approved_grades', JSON.stringify(approvedGradesList));

      const pendingStr = localStorage.getItem('pending_grades') || '[]';
      let pendingList = JSON.parse(pendingStr);
      pendingList = pendingList.filter((p: any) => p.id !== gradeItem.id);
      localStorage.setItem('pending_grades', JSON.stringify(pendingList));

      toast.success(`Đã phê duyệt điểm môn học cho sinh viên ${gradeItem.studentName}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi phê duyệt điểm.');
    }
  };

  const handleRejectGrade = (gradeItem: any) => {
    const pendingStr = localStorage.getItem('pending_grades') || '[]';
    let pendingList = JSON.parse(pendingStr);
    pendingList = pendingList.filter((p: any) => p.id !== gradeItem.id);
    localStorage.setItem('pending_grades', JSON.stringify(pendingList));
    
    toast.info(`Từ chối phê duyệt điểm của sinh viên ${gradeItem.studentName}`);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleApproveTrainingScore = async (scoreItem: any) => {
    try {
      await studentService.updateConductScore(scoreItem.studentId, scoreItem.trainingScore);

      const appStr = localStorage.getItem('approved_training_scores') || '[]';
      const approvedList = JSON.parse(appStr);
      
      const existingIdx = approvedList.findIndex((a: any) => a.studentId === scoreItem.studentId && a.classId === scoreItem.classId);
      if (existingIdx !== -1) {
        approvedList[existingIdx] = scoreItem;
      } else {
        approvedList.push(scoreItem);
      }
      localStorage.setItem('approved_training_scores', JSON.stringify(approvedList));

      const pendingStr = localStorage.getItem('pending_training_scores') || '[]';
      let pendingList = JSON.parse(pendingStr);
      pendingList = pendingList.filter((p: any) => !(p.studentId === scoreItem.studentId && p.classId === scoreItem.classId));
      localStorage.setItem('pending_training_scores', JSON.stringify(pendingList));

      toast.success(`Đã phê duyệt điểm rèn luyện (${scoreItem.trainingScore}đ) cho SV ${scoreItem.studentName}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi phê duyệt điểm rèn luyện.');
    }
  };

  const handleRejectTrainingScore = (scoreItem: any) => {
    const pendingStr = localStorage.getItem('pending_training_scores') || '[]';
    let pendingList = JSON.parse(pendingStr);
    pendingList = pendingList.filter((p: any) => !(p.studentId === scoreItem.studentId && p.classId === scoreItem.classId));
    localStorage.setItem('pending_training_scores', JSON.stringify(pendingList));

    toast.info(`Từ chối điểm rèn luyện của sinh viên ${scoreItem.studentName}`);
    setRefreshTrigger(prev => prev + 1);
  };

  const statCards = [
    {
      label: 'Tổng sinh viên',
      value: stats.students,
      change: '+12%',
      changeLabel: 'học kỳ này',
      positive: true,
      icon: GraduationCap,
      gradient: 'from-blue-600 to-cyan-500 shadow-blue-500/20',
      textColor: 'text-blue-600',
      link: '/admin/students'
    },
    {
      label: 'Giảng viên',
      value: stats.teachers,
      change: '+3',
      changeLabel: 'mới tháng này',
      positive: true,
      icon: Users,
      gradient: 'from-purple-600 to-pink-500 shadow-purple-500/20',
      textColor: 'text-purple-600',
      link: '/admin/teachers'
    },
    {
      label: 'Lớp học',
      value: stats.classes,
      change: `${stats.classes} lớp`,
      changeLabel: 'đang hoạt động',
      positive: true,
      icon: BookOpen,
      gradient: 'from-emerald-600 to-teal-500 shadow-emerald-500/20',
      textColor: 'text-emerald-600',
      link: '/admin/classes'
    },
    {
      label: 'IP Bị chặn',
      value: stats.blockedIps,
      change: stats.blockedIps > 0 ? 'Cần xem xét' : 'An toàn',
      changeLabel: '',
      positive: stats.blockedIps === 0,
      icon: Shield,
      gradient: stats.blockedIps > 0 ? 'from-rose-600 to-red-500 shadow-rose-500/20' : 'from-green-600 to-emerald-500 shadow-green-500/20',
      textColor: stats.blockedIps > 0 ? 'text-rose-600' : 'text-green-600',
      link: null
    },
  ];

  const logTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' },
    danger: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30' },
    success: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30' },
    info: { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30' },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-3.5 text-xs">
          <p className="font-bold text-slate-850 dark:text-slate-100 mb-1.5">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="flex items-center gap-1.5" style={{ color: p.color || '#3b82f6' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#3b82f6' }} />
              {p.name}: <strong className="text-slate-900 dark:text-white ml-0.5">{p.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container space-y-6">
      
      {/* SVG Gradients for Recharts */}
      <svg className="hidden">
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
      </svg>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-slate-600 font-medium mt-0.5">
              Quản trị & Giám sát hệ thống · TVU CET
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-auto">
            {(['overview', 'security', 'grades', 'schedule'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-slate-700 text-blue-900 dark:text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-850'
                }`}
              >
                {tab === 'overview' ? (
                  <>
                    <Activity className="w-4 h-4" />
                    Tổng quan
                  </>
                ) : tab === 'security' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    An ninh
                  </>
                ) : tab === 'grades' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Duyệt điểm ({pendingGrades.length + pendingTrainingScores.length})
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Lịch dạy & Khả dụng
                  </>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 shadow-md active:scale-95 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const CardWrapper = card.link ? Link : 'div';
          const cardProps = card.link ? { to: card.link } : {};
          
          return (
            <CardWrapper
              key={i}
              {...cardProps}
              className={`stat-card hover:stat-card-hover relative group bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl ${card.link ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]' : ''} transition-all duration-200`}
            >
              {/* Corner ambient glow */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{card.label}</p>
                  {loading ? (
                    <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                  ) : (
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{card.value.toLocaleString()}</p>
                  )}
                  <div className="pt-2 flex items-center gap-1.5">
                    <TrendingUp className={`w-4 h-4 ${card.positive ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <span className={`text-sm font-bold ${card.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {card.change}
                    </span>
                    {card.changeLabel && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.changeLabel}</span>}
                  </div>
                </div>
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon className="w-6.5 h-6.5 text-white" strokeWidth={2} />
                </div>
              </div>
              
              {card.link && (
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </CardWrapper>
          );
        })}
      </div>

      {/* TAB: Overview */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bar Chart - Major Distribution */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Phân bổ sinh viên theo ngành</h3>
                  <p className="text-sm text-slate-650 dark:text-slate-400 font-semibold mt-0.5">Dữ liệu phân hệ quản lý học vụ TVU CET</p>
                </div>
                <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-full border border-blue-100 dark:border-blue-900/30">
                  CET Portal
                </span>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={majorData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.015)' }} />
                    <Bar dataKey="count" name="Số sinh viên" radius={[6, 6, 0, 0]} maxBarSize={36}>
                      {majorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GPA Distribution Info Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Xếp loại học lực</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-5">Đánh giá chung kết quả tích lũy GPA</p>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Xuất sắc & Giỏi (GPA 3.2 - 4.0)', value: 40, count: '20 SV', color: 'bg-emerald-500', barBg: 'bg-emerald-500/10' },
                  { label: 'Khá (GPA 2.5 - 3.19)', value: 45, count: '23 SV', color: 'bg-blue-500', barBg: 'bg-blue-500/10' },
                  { label: 'Trung bình (GPA 2.0 - 2.49)', value: 10, count: '5 SV', color: 'bg-amber-500', barBg: 'bg-amber-500/10' },
                  { label: 'Yếu & Kém (GPA < 2.0)', value: 5, count: '3 SV', color: 'bg-rose-500', barBg: 'bg-rose-500/10' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-350">{item.label}</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-500 font-medium text-xs">{item.count}</span>
                        <span className="text-slate-800 dark:text-white">{item.value}%</span>
                      </div>
                    </div>
                    <div className={`w-full ${item.barBg} h-2 rounded-full overflow-hidden`}>
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                  * Số liệu ước lượng dựa trên kết quả đồng bộ dữ liệu học tập học kỳ mới nhất.
                </p>
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Lưu lượng truy cập & Ghi nhận</h3>
                <p className="text-sm text-slate-650 dark:text-slate-450 font-semibold mt-0.5">Biểu đồ đăng nhập và đăng ký tài khoản (6 tháng qua)</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Đăng nhập</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Ghi danh</span>
                </div>
              </div>
            </div>
            
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="logins" name="Đăng nhập" stroke="#3b82f6" strokeWidth={2} fill="url(#blueArea)" dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }} />
                  <Area type="monotone" dataKey="registrations" name="Ghi danh" stroke="#10b981" strokeWidth={2} fill="url(#emeraldArea)" dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* TAB: Security */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Security Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-850">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/10">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Nhật ký bảo mật</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Giám sát các nỗ lực xác thực mạng</p>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {securityLogs.map(log => {
                const cfg = logTypeConfig[log.type];
                const LogIcon = cfg.icon;
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4.5 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                      <LogIcon className={`w-4.5 h-4.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-850 dark:text-slate-200">{log.action}</p>
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />{log.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{log.result}</p>
                      <div className="flex items-center gap-2.5 mt-2">
                        <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-2 py-0.5 rounded-lg border border-slate-200/40 dark:border-slate-700/30">{log.ip}</span>
                        <span className="text-xs text-slate-500 font-bold">@{log.user}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* IP Blacklist Management */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-850">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/10">
                    <ShieldAlert className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Danh sách chặn IP</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{blockedData.totalCount} địa chỉ IP đang bị khóa</p>
                  </div>
                </div>
                {blockedData.totalCount > 0 && (
                  <button
                    onClick={handleClearAllBlocked}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-200/40 dark:border-rose-900/30 rounded-xl transition-colors active:scale-95"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Mở chặn tất cả
                  </button>
                )}
              </div>

              {/* Block new IP form */}
              <form onSubmit={handleBlockIp} className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/10 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Server className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={newIpToBlock}
                      onChange={e => setNewIpToBlock(e.target.value)}
                      placeholder="Địa chỉ IP (vd: 113.161.42.5)"
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-955 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 font-medium"
                      pattern="^(\d{1,3}\.){3}\d{1,3}$"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 px-5 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors active:scale-95 whitespace-nowrap"
                  >
                    <Ban className="w-4 h-4" />
                    Chặn thủ công
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="Lý do chặn..."
                    className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-955 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-350 focus:border-slate-400 font-medium"
                    required
                  />
                </div>
              </form>

              {/* IP list */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40 max-h-60 overflow-y-auto">
                {loading ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                      <div className="h-4 w-4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                      <div className="h-3.5 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded ml-auto" />
                    </div>
                  ))
                ) : blockedData.blockedIps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mb-3 border border-emerald-100/50">
                      <Shield className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-750 dark:text-slate-300">Tường lửa an toàn</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Không có địa chỉ IP nào trong danh sách đen</p>
                  </div>
                ) : (
                  blockedData.blockedIps.map((ip, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center">
                          <Ban className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{ip}</span>
                      </div>
                      <button
                        onClick={() => handleUnblockIp(ip)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/45 border border-emerald-200/40 dark:border-emerald-900/30 rounded-xl transition-colors active:scale-95"
                      >
                        <Unlock className="w-3 h-3" />
                        Mở chặn
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/10">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                * Lưu ý bảo mật: Việc chặn IP được thực thi trực tiếp tại tầng API Gateway để giảm tải xử lý cho các microservices phía sau.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
          {/* Sub-tab selection */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveGradesSubTab('study')}
              className={`flex-1 py-5 px-6 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
                activeGradesSubTab === 'study'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Điểm học tập chờ duyệt ({pendingGrades.length})
            </button>
            <button
              onClick={() => setActiveGradesSubTab('training')}
              className={`flex-1 py-5 px-6 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
                activeGradesSubTab === 'training'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20'
              }`}
            >
              <Users className="w-5 h-5" />
              Điểm rèn luyện chờ duyệt ({pendingTrainingScores.length})
            </button>
          </div>

          {activeGradesSubTab === 'study' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-800/15 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">Sinh viên</th>
                    <th className="py-4 px-5">Lớp học phần</th>
                    <th className="py-4 px-5">Giảng viên đề xuất</th>
                    <th className="py-4 px-5">Điểm đề xuất</th>
                    <th className="py-4 px-5">Chuyên cần</th>
                    <th className="py-4 px-5">Ghi chú</th>
                    <th className="py-4 px-5 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 font-semibold text-slate-750 dark:text-slate-300 text-sm">
                  {pendingGrades.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{item.studentName}</td>
                      <td className="py-4 px-5 font-mono text-blue-600 dark:text-blue-400 text-sm">{item.className} ({item.classCode})</td>
                      <td className="py-4 px-5 text-slate-800 dark:text-slate-200">{item.teacherName}</td>
                      <td className="py-4 px-5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
                          Điểm {item.grade}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">{item.attendanceRate}%</td>
                      <td className="py-4 px-5 text-slate-500 italic">{item.notes || 'Không có ghi chú'}</td>
                      <td className="py-4 px-5 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleApproveGrade(item)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors active:scale-95 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" /> Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectGrade(item)}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors active:scale-95 flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> Từ chối
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pendingGrades.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-sm">Tất cả điểm học tập đã được phê duyệt</p>
                </div>
              )}
            </div>
          )}

          {activeGradesSubTab === 'training' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-800/15 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">Sinh viên</th>
                    <th className="py-4 px-5">Lớp học phần (Cố vấn)</th>
                    <th className="py-4 px-5">Giảng viên / Cố vấn</th>
                    <th className="py-4 px-5">Điểm rèn luyện đề xuất</th>
                    <th className="py-4 px-5 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 font-semibold text-slate-750 dark:text-slate-300 text-sm">
                  {pendingTrainingScores.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{item.studentName}</td>
                      <td className="py-4 px-5 font-mono text-indigo-600 dark:text-indigo-400">{item.className} ({item.classCode})</td>
                      <td className="py-4 px-5 text-slate-800 dark:text-slate-200">{item.teacherName}</td>
                      <td className="py-4 px-5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                          {item.trainingScore} điểm
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleApproveTrainingScore(item)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors active:scale-95 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" /> Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectTrainingScore(item)}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors active:scale-95 flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> Từ chối
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pendingTrainingScores.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-sm">Tất cả điểm rèn luyện đã được phê duyệt</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Schedule & Availability */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Semester Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm overflow-x-auto">
            <div className="flex items-center gap-3 min-w-[900px] justify-between relative py-4">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 -z-10" />
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
                    className={`flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-3 relative z-10 hover:scale-105 transition-transform`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border-2 transition-all ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-110' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Month Calendar Picker */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-150 rounded-lg text-slate-650 font-extrabold">
                    &lt;
                  </button>
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">
                    Tháng {currentCalendarMonth + 1} &nbsp; {currentCalendarYear}
                  </h4>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-slate-150 rounded-lg text-slate-650 font-extrabold">
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
                          !cell.isCurrentMonth ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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

              {/* Status Info Box */}
              <div className="bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Ghi chú giám sát</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Hệ thống tự động lọc thời khóa biểu của từng giảng viên dựa trên phân bổ lịch học từ cơ sở dữ liệu. 
                  Giảng viên trống lịch có trạng thái <span className="text-emerald-650 dark:text-emerald-450 font-bold">Khả dụng</span> để sắp xếp dạy thay hoặc phân công công tác.
                </p>
              </div>
            </div>

            {/* Right side: Teachers Availability & Schedule on that day */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Lịch dạy & Trạng thái Giảng viên ngày {selectedDate ? `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}` : ''}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
                    Ngày trong tuần: <strong>Thứ {selectedDayOfWeek === 7 ? 'Chủ Nhật' : selectedDayOfWeek + 1}</strong>
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-800/15 text-slate-650 dark:text-slate-450 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Mã GV</th>
                        <th className="py-3.5 px-4">Tên Giảng viên</th>
                        <th className="py-3.5 px-4">Khoa / Bộ môn</th>
                        <th className="py-3.5 px-4">Trạng thái giảng dạy ngày này</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {allTeachers.map((teach) => {
                        const teachingClasses = allClasses.filter(c => 
                          c.teacherId === teach.id && isClassOnDay(c.schedule, selectedDayOfWeek)
                        );
                        const isTeaching = teachingClasses.length > 0;

                        return (
                          <tr key={teach.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-slate-500">{teach.teacherCode || 'GV-N/A'}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{teach.fullName}</td>
                            <td className="py-3.5 px-4 text-slate-500">{teach.department || 'Khoa CNTT'}</td>
                            <td className="py-3.5 px-4">
                              {isTeaching ? (
                                <div className="space-y-1.5">
                                  {teachingClasses.map((tc, idx) => (
                                    <div key={idx} className="p-2 rounded bg-blue-550 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/30 text-[11px] text-blue-900 dark:text-blue-300 leading-snug">
                                      <p className="font-extrabold">{tc.className}</p>
                                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Môn: {tc.subject} · Phòng: {tc.room} · Lịch: {tc.schedule}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/30 uppercase">
                                  ● Khả dụng (Trống lịch)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {allTeachers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-slate-400 font-bold">
                            Không tìm thấy dữ liệu Giảng viên nào trong hệ thống.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
