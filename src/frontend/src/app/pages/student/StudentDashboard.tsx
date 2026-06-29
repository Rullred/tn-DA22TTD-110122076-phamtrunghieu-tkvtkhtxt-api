import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService, StudentDto } from '../../../services/studentService';
import { classService, ClassDto, EnrollmentDto } from '../../../services/classService';
import { teacherService, TeacherDto } from '../../../services/teacherService';
import {
  Mail, Phone, MapPin, Calendar, Award, TrendingUp, RefreshCw,
  BookOpen, ShieldAlert, Star, Target, Check, Trash2, CalendarDays,
  BarChart3, Compass, CheckCircle2, AlertCircle, User
} from 'lucide-react';

import { toast } from 'sonner';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import studentIcon from '../../../assets/student-icon.png';
import teacherIcon from '../../../assets/teacher-icon.png';

// IT Curriculum structure for CNTT students
const IT_CURRICULUM = [
  {
    year: 1,
    semesters: [
      {
        sem: 1,
        courses: [
          { code: 'MATH101', name: 'Đại số tuyến tính', credits: 3 },
          { code: 'CS101', name: 'Nhập môn Tin học', credits: 3 },
          { code: 'POL101', name: 'Triết học Mác - Lênin', credits: 3 }
        ]
      },
      {
        sem: 2,
        courses: [
          { code: 'MATH102', name: 'Giải tích', credits: 3 },
          { code: 'CS102', name: 'Cơ sở lập trình', credits: 3 },
          { code: 'COM101', name: 'Kỹ năng giao tiếp', credits: 2 }
        ]
      }
    ]
  },
  {
    year: 2,
    semesters: [
      {
        sem: 1,
        courses: [
          { code: 'CS201', name: 'Lập trình hướng đối tượng (OOP)', credits: 3 },
          { code: 'CS202', name: 'Cấu trúc dữ liệu & Giải thuật', credits: 3 },
          { code: 'CS203', name: 'Kiến trúc máy tính', credits: 3 }
        ]
      },
      {
        sem: 2,
        courses: [
          { code: 'CS204', name: 'Hệ quản trị cơ sở dữ liệu', credits: 3 },
          { code: 'CS205', name: 'Mạng máy tính', credits: 3 },
          { code: 'CS206', name: 'Hệ điều hành', credits: 3 }
        ]
      }
    ]
  },
  {
    year: 3,
    semesters: [
      {
        sem: 1,
        courses: [
          { code: 'CS301', name: 'Công nghệ phần mềm', credits: 3 },
          { code: 'CS302', name: 'Lập trình thiết bị di động', credits: 3 },
          { code: 'CS303', name: 'An toàn và bảo mật thông tin', credits: 3 }
        ]
      },
      {
        sem: 2,
        courses: [
          { code: 'CS304', name: 'Cơ sở trí tuệ nhân tạo', credits: 3 },
          { code: 'CS305', name: 'Khai phá dữ liệu', credits: 3 },
          { code: 'CS306', name: 'Thiết kế giao diện UI/UX', credits: 3 }
        ]
      }
    ]
  },
  {
    year: 4,
    semesters: [
      {
        sem: 1,
        courses: [
          { code: 'CS401', name: 'Phát triển ứng dụng Web', credits: 3 },
          { code: 'CS402', name: 'Quản lý dự án CNTT', credits: 3 },
          { code: 'CS403', name: 'Thực tập tốt nghiệp', credits: 4 }
        ]
      },
      {
        sem: 2,
        courses: [
          { code: 'CS404', name: 'Khóa luận tốt nghiệp', credits: 10 }
        ]
      }
    ]
  }
];

interface ScheduleSlot {
  classCode: string;
  className: string;
  room: string;
  teacherName: string;
  startPeriod: number;
  endPeriod: number;
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentDto | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [classesDetail, setClassesDetail] = useState<Record<string, ClassDto>>({});
  const [advisor, setAdvisor] = useState<TeacherDto | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'schedule' | 'curriculum' | 'registration' | 'transcript'>('stats');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Registration states
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'not-yet'>('not-yet');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
  const [selectedSemester, setSelectedSemester] = useState(3);
  const [isRegistering, setIsRegistering] = useState(false);

  // Timeline semesters list y như ảnh
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
    { label: 'HK 3-2025', year: 2026, month: 5 }, // June 2026 y như ảnh
    { label: 'HK 1-2026', year: 2026, month: 8 },
    { label: 'HK 2-2026', year: 2027, month: 0 },
  ];

  // Calendar states
  const [currentCalendarYear, setCurrentCalendarYear] = useState(2026);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(5); // June
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 5, 27));
  const [selectedSemesterLabel, setSelectedSemesterLabel] = useState('HK 3-2025');
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [activeNoteText, setActiveNoteText] = useState('');

  // Student metadata (enriched info set by Admin via localStorage)
  const [studentMeta, setStudentMeta] = useState({
    ethnic: 'Kinh',
    religion: 'Không',
    placeOfBirth: 'Tỉnh Trà Vinh',
    nationality: 'Việt Nam',
    email2: '—',
    classCode: 'DA22TTD',
    major: 'Công nghệ thông tin',
    department: 'Trường Kỹ thuật và Công nghệ',
    educationLevel: 'đại học',
    academicYear: '2022-2026'
  });

  // Load notes helper
  const loadNotes = (studentId: string) => {
    const notesMap: Record<string, string> = {};
    const prefix = `student_note_${studentId}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const dateStr = key.substring(prefix.length);
        const val = localStorage.getItem(key);
        if (val) notesMap[dateStr] = val;
      }
    }
    return notesMap;
  };

  useEffect(() => {
    if (!student) return;
    const loaded = loadNotes(student.id);
    setNotesMap(loaded);
    // Load enriched student metadata
    const raw = localStorage.getItem(`student_meta_${student.id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStudentMeta(prev => ({ ...prev, ...parsed }));
      } catch (_) {}
    }
  }, [student]);

  // Load note text when selected date changes
  useEffect(() => {
    if (!selectedDate) {
      setActiveNoteText('');
      return;
    }
    const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    setActiveNoteText(notesMap[key] || '');
  }, [selectedDate, notesMap]);

  const handleSaveNote = () => {
    if (!student || !selectedDate) return;
    const keyStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const storageKey = `student_note_${student.id}_${keyStr}`;
    
    if (activeNoteText.trim() === '') {
      localStorage.removeItem(storageKey);
      const newMap = { ...notesMap };
      delete newMap[keyStr];
      setNotesMap(newMap);
      toast.success('Đã xóa ghi chú thành công!');
    } else {
      localStorage.setItem(storageKey, activeNoteText);
      setNotesMap(prev => ({ ...prev, [keyStr]: activeNoteText }));
      toast.success('Đã lưu ghi chú thành công!');
    }
  };

  const handleDeleteNote = () => {
    if (!student || !selectedDate) return;
    const keyStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const storageKey = `student_note_${student.id}_${keyStr}`;
    localStorage.removeItem(storageKey);
    const newMap = { ...notesMap };
    delete newMap[keyStr];
    setNotesMap(newMap);
    setActiveNoteText('');
    toast.success('Đã xóa ghi chú thành công!');
  };

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

  useEffect(() => {
    if (!user) return;
    async function loadStudentDashboard() {
      setLoading(true);
      try {
        const studentsPage = await studentService.getAll(0, 1000);
        const currentStudent = studentsPage.content.find(s => s.email === user.email);

        if (currentStudent) {
          setStudent(currentStudent);

          // Fetch student enrollments
          const enrollmentsPage = await classService.getStudentEnrollments(currentStudent.id);
          const enrollList = enrollmentsPage.content || [];
          setEnrollments(enrollList);

          // Fetch details for all enrolled classes
          const classesMap: Record<string, ClassDto> = {};
          for (const enroll of enrollList) {
            try {
              const cls = await classService.getById(enroll.classId);
              classesMap[enroll.classId] = cls;
            } catch (err) {
              console.error(err);
            }
          }
          setClassesDetail(classesMap);

          // Fetch advisor info
          if (currentStudent.advisorId) {
            try {
              const adviserTeacher = await teacherService.getById(currentStudent.advisorId);
              setAdvisor(adviserTeacher);
            } catch (e) {
              console.warn(e);
            }
          } else if (enrollList.length > 0) {
            const firstClass = classesMap[enrollList[0].classId];
            if (firstClass && firstClass.teacherId) {
              try {
                const adviserTeacher = await teacherService.getById(firstClass.teacherId);
                setAdvisor(adviserTeacher);
              } catch (e) {
                console.warn(e);
              }
            }
          }

          // Fetch available classes for registration
          const availablePage = await classService.getAvailableClasses(
            currentStudent.id,
            selectedAcademicYear,
            selectedSemester
          );
          setAvailableClasses(availablePage.content || []);
        } else {
          toast.warning("Hồ sơ sinh viên chưa được cấu hình tại cơ sở dữ liệu Nhân sự HR.");
        }
      } catch (err) {
        console.error("Error loading student dashboard data", err);
        toast.error("Không thể kết nối đến backend.");
      } finally {
        setLoading(false);
      }
    }
    loadStudentDashboard();
  }, [user, refreshTrigger, selectedAcademicYear, selectedSemester]);

  // Handle class registration
  const handleRegister = async (classId: string) => {
    if (!student) return;
    setIsRegistering(true);
    try {
      await classService.enrollStudent(classId, student.id);
      toast.success("Đăng ký môn học thành công!");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Đăng ký không thành công. Lớp học có thể đã đầy.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle cancel registration
  const handleCancelRegistration = async (classId: string) => {
    if (!student) return;
    setIsRegistering(true);
    try {
      await classService.dropStudent(classId, student.id);
      toast.success("Hủy đăng ký môn học thành công!");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Hủy đăng ký không thành công.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Helper to map letter grade to scale 4
  const getGradePoint = (letter: string) => {
    switch (letter?.toUpperCase().trim()) {
      case 'A+': return 4.0;
      case 'A': return 4.0;
      case 'B+': return 3.5;
      case 'B': return 3.0;
      case 'C+': return 2.5;
      case 'C': return 2.0;
      case 'D+': return 1.5;
      case 'D': return 1.0;
      case 'F': return 0.0;
      default: return 0.0;
    }
  };

  // Compute GPA and credits
  const overallGPA4 = enrollments.length > 0
    ? (enrollments.reduce((sum, e) => sum + (e.totalGrade4 !== null && e.totalGrade4 !== undefined ? e.totalGrade4 : getGradePoint(e.letterGrade || e.grade || '')), 0) / enrollments.length)
    : 0;

  const overallGPA10 = enrollments.length > 0
    ? (enrollments.reduce((sum, e) => sum + (e.totalGrade10 !== null && e.totalGrade10 !== undefined ? e.totalGrade10 : (e.letterGrade || e.grade ? getGradePoint(e.letterGrade || e.grade || '') * 2.5 : 0)), 0) / enrollments.length)
    : 0;

  const totalCredits = enrollments
    .filter(e => e.status === 'COMPLETED' || e.status === 'DA_HOAN_THANH' || e.status === 'ACTIVE' || e.status === 'DA_DANG_KY' || (e.letterGrade || e.grade) !== 'F')
    .reduce((sum, e) => sum + (e.credits || 3), 0);

  // Group enrollments by semester for charts
  const semesterGPAMap: Record<string, { gpa4: number; gpa10: number; count: number; semCredits: number }> = {};
  enrollments.forEach(enroll => {
    const cls = classesDetail[enroll.classId];
    if (cls) {
      const semKey = `${cls.academicYear} HK${cls.semester}`;
      if (!semesterGPAMap[semKey]) {
        semesterGPAMap[semKey] = { gpa4: 0, gpa10: 0, count: 0, semCredits: 0 };
      }
      const gradeVal4 = enroll.totalGrade4 !== null && enroll.totalGrade4 !== undefined ? enroll.totalGrade4 : getGradePoint(enroll.letterGrade || enroll.grade || '');
      const gradeVal10 = enroll.totalGrade10 !== null && enroll.totalGrade10 !== undefined ? enroll.totalGrade10 : (enroll.letterGrade || enroll.grade ? getGradePoint(enroll.letterGrade || enroll.grade || '') * 2.5 : 0);
      
      semesterGPAMap[semKey].gpa4 += gradeVal4;
      semesterGPAMap[semKey].gpa10 += gradeVal10;
      semesterGPAMap[semKey].count += 1;
      semesterGPAMap[semKey].semCredits += (enroll.credits || 3);
    }
  });

  // Group all enrollments by Academic Year & Semester for detailed transcript
  const groupedEnrollments = (() => {
    const groups: Record<string, { year: string; semester: number; items: EnrollmentDto[] }> = {};
    enrollments.forEach(enroll => {
      const cls = classesDetail[enroll.classId];
      const year = cls?.academicYear || 'Chưa rõ năm học';
      const semester = cls?.semester || 1;
      const key = `${year}_HK${semester}`;
      if (!groups[key]) {
        groups[key] = { year, semester, items: [] };
      }
      groups[key].items.push(enroll);
    });
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      return a.semester - b.semester;
    });
  })();

  const chartData = Object.entries(semesterGPAMap).map(([semester, val]) => ({
    name: semester,
    GPA: parseFloat((val.gpa4 / val.count).toFixed(2)),
    'Điểm hệ 10': parseFloat((val.gpa10 / val.count).toFixed(2)),
    'Tín chỉ': val.semCredits
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Parse schedule string
  const parseSchedule = (scheduleStr: string): ScheduleSlot[] => {
    if (!scheduleStr) return [];
    const results: ScheduleSlot[] = [];
    const parts = scheduleStr.split(/[;|]/);

    const dayMap: Record<string, number> = {
      'thứ 2': 1, 'thứ hai': 1, 't2': 1,
      'thứ 3': 2, 'thứ ba': 2, 't3': 2,
      'thứ 4': 3, 'thứ tư': 3, 't4': 3,
      'thứ 5': 4, 'thứ năm': 4, 't5': 4,
      'thứ 6': 5, 'thứ sáu': 5, 't6': 5,
      'thứ 7': 6, 'thứ bảy': 6, 't7': 6,
      'chủ nhật': 7, 'cn': 7
    };

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
        
        // Extract room and teacher if format is "Thứ X: Tiết Y->Z/Ph G3.01, GV Nguyễn Chí Sol"
        let room = '';
        let teacher = '';
        
        const roomMatch = cleanPart.match(/\/ph\s*([a-z0-9.]+)/);
        if (roomMatch) room = roomMatch[1].toUpperCase();

        const teacherMatch = cleanPart.match(/gv\s*([^,/\n]+)/);
        if (teacherMatch) {
          teacher = teacherMatch[1].trim()
            .replace(/\b[a-z]/g, letter => letter.toUpperCase());
        }

        results.push({
          classCode: '',
          className: '',
          room,
          teacherName: teacher,
          startPeriod: start,
          endPeriod: end
        });
      }
    });
    return results;
  };



  // Let's rewrite weekly schedule logic carefully
  const dayIndexMap: Record<number, string> = {
    1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ Nhật'
  };

  const scheduleSlots: { day: number; start: number; end: number; cls: ClassDto }[] = [];
  enrollments.forEach(enroll => {
    const cls = classesDetail[enroll.classId];
    if (cls && cls.schedule) {
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

  // Filter open classes
  const filteredAvailableClasses = availableClasses.filter(cls => {
    const isAlreadyEnrolled = enrollments.some(e => e.classId === cls.id);
    if (isAlreadyEnrolled) return false;

    if (filterMode === 'not-yet') {
      // Find completed course names
      const completedSubjectNames = enrollments
        .filter(e => e.grade && e.grade !== 'F')
        .map(e => {
          const det = classesDetail[e.classId];
          return det ? det.subject : e.className;
        });
      
      const isCompleted = completedSubjectNames.some(name => 
        name?.toLowerCase().includes(cls.subject?.toLowerCase() || '') ||
        cls.subject?.toLowerCase().includes(name?.toLowerCase() || '')
      );
      
      return !isCompleted;
    }
    return true;
  });

  if (loading && refreshTrigger === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-750 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <RefreshCw className="w-7 h-7 text-white animate-spin" />
        </div>
        <p className="text-slate-700 font-bold text-sm">Đang tải cổng thông tin sinh viên...</p>
        <p className="text-slate-400 text-xs font-medium">Đại học Trà Vinh Portal</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-black text-slate-800">Không tìm thấy Hồ sơ Sinh viên</h2>
          <p className="text-sm text-slate-500 mt-2 px-6">
            Hồ sơ học viên cho địa chỉ email <strong>{user?.email}</strong> chưa được tạo trong Cơ sở dữ liệu Nhân sự (HR). Vui lòng đăng nhập với tài khoản Quản trị viên (Admin) để ghi danh và gán tài khoản cho học viên.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Banner Banner */}
      <div className="relative overflow-hidden px-6 py-8 md:py-10 text-white"
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 60%, #0f172a 100%)' }}>
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 page-container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl p-0.5" style={{ background: 'linear-gradient(135deg, #f59e0b, #3b82f6)' }}>
                <img
                  src={studentIcon}
                  alt={student.firstName}
                  className="w-full h-full rounded-2xl object-cover bg-white"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full border-2 border-[#1e1b4b] flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full uppercase tracking-wider">
                  Sinh viên {student.major || 'CNTT'}
                </span>
                <span className="text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full">Đang học</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                {student.lastName} {student.firstName}
              </h1>
              <p className="text-blue-200 text-sm font-mono mt-2">{student.studentCode}</p>
            </div>
          </div>

          <div className="flex gap-6 sm:gap-8 bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md">
            <div className="text-center">
              <p className="text-3xl font-black text-amber-400">{overallGPA4.toFixed(2)}</p>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-1">GPA Hệ 4</p>
            </div>
            <div className="h-10 w-px bg-white/10 my-auto" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">{totalCredits}</p>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-1">Tín chỉ</p>
            </div>
            <div className="h-10 w-px bg-white/10 my-auto" />
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-400">{student.conductScore || 0}đ</p>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-1">Rèn luyện</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            Tổng quan & Thống kê
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarDays className="w-4.5 h-4.5" />
            Thời khóa biểu tuần
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'curriculum'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4.5 h-4.5" />
            Tiến trình học tập
          </button>
          <button
            onClick={() => setActiveTab('registration')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'registration'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            Đăng ký môn học
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'transcript'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4.5 h-4.5" />
            Bảng điểm chi tiết
          </button>
        </div>

        {/* Tab 1: Stats - TVU Style */}
        {activeTab === 'stats' && (
          <div className="space-y-6">

            {/* ===== TVU Student Info Block ===== */}
            <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Header 1: Thông tin sinh viên */}
              <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-[#1e3a8a] to-[#1e1b4b]">
                <User className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Thông tin sinh viên</h3>
              </div>

              <div className="bg-white flex flex-col md:flex-row">
                {/* Avatar */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-3 py-6 px-8 md:border-r border-slate-100">
                  <div className="w-[88px] h-[88px] rounded-xl overflow-hidden border-2 border-blue-200 shadow-md">
                    <img src={studentIcon} alt={student.firstName} className="w-full h-full object-cover" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    student.status === 'ACTIVE' || student.status === 'HOAT_DONG'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'Đang học' : 'Nghỉ học'}
                  </span>
                </div>

                {/* Info grid – 3 column groups */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  {/* Col 1 */}
                  <table className="text-xs w-full">
                    <tbody className="divide-y divide-slate-50">
                      <TVUInfoRow label="Mã SV:" value={student.studentCode} mono />
                      <TVUInfoRow label="Tên sinh viên:" value={`${student.lastName} ${student.firstName}`} />
                      <TVUInfoRow label="Ngày sinh:" value={student.dateOfBirth || '13/01/2004'} />
                      <TVUInfoRow label="Dân tộc:" value={studentMeta.ethnic} />
                      <TVUInfoRow label="Tôn giáo:" value={studentMeta.religion} />
                      <TVUInfoRow label="Nơi sinh:" value={studentMeta.placeOfBirth} />
                    </tbody>
                  </table>
                  {/* Col 2 */}
                  <table className="text-xs w-full">
                    <tbody className="divide-y divide-slate-50">
                      <TVUInfoRow label="Giới tính:" value={student.gender === 'MALE' || student.gender === 'NAM' ? 'Nam' : student.gender === 'FEMALE' || student.gender === 'NU' ? 'Nữ' : 'Nam'} />
                      <TVUInfoRow label="Quốc tịch:" value={studentMeta.nationality} />
                      <TVUInfoRow label="Email 1:" value={student.email} truncate />
                      <TVUInfoRow label="Email 2:" value={studentMeta.email2 || '—'} />
                      <TVUInfoRow label="Địa chỉ:" value={student.address || 'Trà Vinh'} truncate />
                    </tbody>
                  </table>
                  {/* Col 3: GPA quick stats */}
                  <div className="px-5 py-5 flex flex-col justify-around gap-3">
                    <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-2xl font-black text-blue-700">{overallGPA4.toFixed(2)}</p>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">GPA Tích lũy (Hệ 4)</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-2xl font-black text-amber-600">{totalCredits}</p>
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Tín chỉ tích lũy</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-2xl font-black text-emerald-600">{student.conductScore || 0}</p>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Điểm rèn luyện</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header 2: Thông tin khóa học */}
              <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-slate-600 to-slate-700">
                <BookOpen className="w-4 h-4 text-blue-300 flex-shrink-0" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Thông tin khóa học</h3>
              </div>
              <div className="bg-white grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                <TVUCourseCell label="Lớp" value={studentMeta.classCode || student.classCode || 'DA22TTD'} mono />
                <TVUCourseCell label="Ngành" value={studentMeta.major || student.major || 'Công nghệ thông tin'} />
                <TVUCourseCell label="Khoa" value={studentMeta.department || 'Trường Kỹ thuật và Công nghệ'} />
                <div className="grid grid-rows-2 divide-y divide-slate-100">
                  <TVUCourseCell label="Bậc đào tạo" value={studentMeta.educationLevel || 'đại học'} />
                  <TVUCourseCell label="Niên khóa" value={studentMeta.academicYear || student.academicYear || '2022-2026'} />
                </div>
              </div>
            </div>

            {/* ===== Charts Row ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Advisor card */}
              {advisor && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Giảng viên cố vấn</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src={teacherIcon} alt="Cố vấn" className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-blue-200" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-800 truncate">{advisor.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{advisor.department || 'Khoa CNTT - TVU'}</p>
                      <p className="text-[11px] text-blue-600 font-mono mt-0.5 truncate">{advisor.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* GPA Chart */}
              <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${advisor ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">Biểu đồ kết quả học tập theo học kỳ</h3>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                    GPA: {overallGPA4.toFixed(2)} / 4.0
                  </span>
                </div>
                {chartData.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                    <AlertCircle className="w-10 h-10 mb-2 opacity-55" />
                    <p className="text-sm font-bold">Chưa có kết quả học tập để hiển thị.</p>
                  </div>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                        <YAxis stroke="#94a3b8" domain={[0, 4.0]} ticks={[0, 1.0, 2.0, 3.0, 4.0]} fontSize={11} fontWeight={600} />
                        <Tooltip />
                        <Area type="monotone" dataKey="GPA" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorGpa)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Credits + Conduct side-by-side */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Tiến độ tích lũy tín chỉ</h4>
                    <p className="text-slate-500 text-xs mt-1">Yêu cầu hoàn thành tối thiểu 132 tín chỉ để tốt nghiệp.</p>
                  </div>
                  <div className="my-5 space-y-2">
                    <div className="flex justify-between items-end text-xs font-bold">
                      <span className="text-slate-500">Hoàn thành</span>
                      <span className="text-blue-600 text-sm font-black">{totalCredits} / 132 TC</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (totalCredits / 132) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-center bg-blue-50/50 border border-blue-100 rounded-xl py-3 text-xs font-bold text-blue-800">
                    Bạn đã đi được {((totalCredits / 132) * 100).toFixed(0)}% chặng đường tốt nghiệp!
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Điểm rèn luyện tích lũy</h4>
                    <p className="text-slate-500 text-xs mt-1">Ghi nhận đánh giá hoạt động phong trào và đạo đức.</p>
                  </div>
                  <div className="text-center py-4">
                    <span className="text-5xl font-black text-emerald-500">{student.conductScore || 0}</span>
                    <span className="text-sm font-bold text-slate-500 ml-1">/ 100 điểm</span>
                    <p className="text-xs font-bold text-slate-500 mt-2">
                      Xếp loại: &nbsp;
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        (student.conductScore || 0) >= 90 ? 'bg-green-50 text-green-700 border border-green-200' :
                        (student.conductScore || 0) >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        (student.conductScore || 0) >= 65 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        (student.conductScore || 0) >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {(student.conductScore || 0) >= 90 ? 'Xuất sắc' :
                         (student.conductScore || 0) >= 80 ? 'Tốt' :
                         (student.conductScore || 0) >= 65 ? 'Khá' :
                         (student.conductScore || 0) >= 50 ? 'Trung bình' : 'Yếu kém'}
                      </span>
                    </p>
                  </div>
                  <div className="text-center bg-emerald-50/50 border border-emerald-100 rounded-xl py-3 text-[11px] font-bold text-emerald-800">
                    Điểm số được cập nhật trực tiếp bởi Cố vấn học tập.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Weekly Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Timeline Semesters ở trên cùng y như ảnh */}
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
                        // Also select the 27th of that month
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

            {/* Layout cột: Trái là Lịch & Ghi chú, Phải là Lưới TKB */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lịch dương và note */}
              <div className="lg:col-span-1 space-y-6">
                {/* Lịch dương (Solar Calendar) */}
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
                      
                      const dateKey = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
                      const hasNote = !!notesMap[dateKey];
                      
                      // Highlight today (27th of June 2026 y như ảnh)
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
                          {hasNote && (
                            <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-amber-500'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ghi chú trong lịch (Calendar Note Editor) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">Ghi chú sự kiện</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                      {selectedDate ? `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}` : ''}
                    </span>
                  </div>
                  
                  <textarea
                    rows={4}
                    value={activeNoteText}
                    onChange={(e) => setActiveNoteText(e.target.value)}
                    placeholder="Nhập ghi chú cho ngày đã chọn (ví dụ: thi cuối kỳ, học nhóm, hoàn thành bài tập...)"
                    className="w-full p-3 text-xs border-2 border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-slate-50"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNote}
                      className="flex-1 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm active:scale-95 transition-all"
                    >
                      Lưu ghi chú
                    </button>
                    {activeNoteText && (
                      <button
                        onClick={handleDeleteNote}
                        className="px-4 py-2.5 text-xs font-bold bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl transition-all"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                {/* Danh sách lớp học trong ngày đã chọn */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Lịch học ngày {selectedDate ? `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}` : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {(() => {
                      const dayIndex = selectedDate ? (selectedDate.getDay() === 0 ? 7 : selectedDate.getDay()) : 1;
                      const daySlots = scheduleSlots.filter(s => s.day === dayIndex);
                      if (daySlots.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 italic font-semibold py-2">
                            Không có lớp học nào trong ngày này.
                          </p>
                        );
                      }
                      
                      // Sort slots by starting period
                      daySlots.sort((a, b) => a.start - b.start);
                      
                      return daySlots.map((slot, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-blue-50 border border-blue-150 space-y-1.5 text-xs text-left">
                          <p className="font-extrabold text-blue-900 leading-snug">{slot.cls.className}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Môn: {slot.cls.subject}</p>
                          <p className="text-[10px] text-slate-650 font-semibold">Thời gian: Tiết {slot.start} - Tiết {slot.end}</p>
                          <p className="text-[10px] text-blue-700 font-bold">Phòng: {slot.cls.room || 'Tự do'}</p>
                          <p className="text-[10px] text-indigo-900 font-bold">Giảng viên: {slot.cls.teacherName || 'Chưa phân công'}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Lưới TKB theo ngày được chọn */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                        Thời khóa biểu tuần từ ngày {String(weekDays[0].getDate()).padStart(2, '0')}/{String(weekDays[0].getMonth() + 1).padStart(2, '0')}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Lưới lịch học đồng bộ tự động dựa trên ngày bạn lựa chọn bên lịch tháng.</p>
                    </div>
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

                            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            const hasNote = !!notesMap[dateKey];

                            return (
                              <th key={idx} className={`py-3 border border-slate-200/50 relative ${isSelected ? 'bg-blue-100/60 text-blue-900 font-black' : ''}`}>
                                <div className="flex flex-col items-center">
                                  <span>{dayLabel}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({formattedDate})</span>
                                </div>
                                {hasNote && (
                                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Có ghi chú" />
                                )}
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
                                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                        borderLeft: '4px solid #3b82f6'
                                      }}
                                    >
                                      <p className="font-extrabold text-blue-900 leading-snug">{slot.cls.className}</p>
                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Lớp: {slot.cls.classCode}</p>
                                      <p className="text-[10px] text-blue-700 font-medium mt-0.5">Phòng: {slot.cls.room || 'Tự do'}</p>
                                      <p className="text-[10px] text-indigo-900 font-bold mt-0.5">GV: {slot.cls.teacherName || 'Chưa phân công'}</p>
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

        {/* Tab 3: Curriculum Progress - TVU Style Table */}
        {activeTab === 'curriculum' && (() => {
          // Full TVU curriculum data — Học kỳ / Năm học grouping
          const TVU_CURRICULUM = [
            {
              semLabel: 'Học kỳ 1', yearLabel: 'Năm học 2022 - 2023', totalCredits: 28,
              courses: [
                { code: '110001', name: 'Đại số tuyến tính', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '110042', name: 'Vi tích phân A1', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '180050', name: 'Triết học Mác - Lênin', major: 'TT', credits: 3, required: true, totalPeriods: 45, theory: 45, practice: 0 },
                { code: '190081', name: 'Học phần I: Đường lối QP và an ninh của ĐCSVN', major: '', credits: 3, required: true, totalPeriods: 45, theory: 37, practice: 0 },
                { code: '190082', name: 'Học phần II: Công tác quốc phòng và an ninh', major: 'TT', credits: 2, required: true, totalPeriods: 30, theory: 22, practice: 0 },
                { code: '190083', name: 'Học phần III: Quân sự chung', major: '', credits: 1, required: true, totalPeriods: 30, theory: 14, practice: 16 },
                { code: '190084', name: 'Học phần IV: Kỹ thuật chiến đấu bộ binh và chiến thuật', major: '', credits: 2, required: true, totalPeriods: 60, theory: 4, practice: 56 },
                { code: '191.00', name: 'Giáo dục thể chất 1 (Điền kinh)', major: 'TT', credits: 1, required: true, totalPeriods: 30, theory: 0, practice: 30 },
                { code: '220092', name: 'Nhập môn công nghệ thông tin', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '220228', name: 'Kỹ thuật lập trình', major: '', credits: 4, required: true, totalPeriods: 90, theory: 30, practice: 60 },
                { code: '410291', name: 'Anh văn không chuyên 1', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '450015', name: 'Pháp luật đại cương', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
              ]
            },
            {
              semLabel: 'Học kỳ 2', yearLabel: 'Năm học 2022 - 2023', totalCredits: 23,
              courses: [
                { code: '110003', name: 'Toán rời rạc', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '150002', name: 'Kỹ năng mềm', major: '', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '170011', name: 'Tiếng Việt thực hành', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '180051', name: 'Kinh tế chính trị Mác - Lênin', major: 'TT', credits: 2, required: true, totalPeriods: 30, theory: 30, practice: 0 },
                { code: '192.08', name: 'Giáo dục thể chất 2 (bóng đá)', major: '', credits: 1, required: false, totalPeriods: 30, theory: 0, practice: 30 },
                { code: '220233', name: 'Đại số đại cương', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '220234', name: 'Cấu trúc dữ liệu và giải thuật', major: 'TT', credits: 4, required: true, totalPeriods: 90, theory: 30, practice: 60 },
                { code: '290000', name: 'Phương pháp NC khoa học', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '410292', name: 'Anh văn không chuyên 2', major: '', credits: 4, required: true, totalPeriods: 90, theory: 30, practice: 60 },
                { code: '640033', name: 'Logic học đại cương', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
              ]
            },
            {
              semLabel: 'Học kỳ 1', yearLabel: 'Năm học 2023 - 2024', totalCredits: 20,
              courses: [
                { code: '110002', name: 'Vi tích phân A2', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '110079', name: 'Kiến trúc máy tính', major: '', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '180052', name: 'Chủ nghĩa xã hội khoa học', major: 'TT', credits: 2, required: true, totalPeriods: 30, theory: 30, practice: 0 },
                { code: '193.15', name: 'Giáo dục thể chất 3 (bóng chuyền)', major: '', credits: 1, required: false, totalPeriods: 30, theory: 0, practice: 30 },
                { code: '220096', name: 'Cơ sở dữ liệu', major: '', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220099', name: 'Lập trình hướng đối tượng', major: '', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220100', name: 'Lý thuyết đồ thị', major: '', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '410293', name: 'Anh văn không chuyên 3', major: '', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
              ]
            },
            {
              semLabel: 'Học kỳ 2', yearLabel: 'Năm học 2023 - 2024', totalCredits: 23,
              courses: [
                { code: '110057', name: 'Duy hoạch tuyến tính', major: 'TT', credits: 2, required: false, totalPeriods: 45, theory: 16, practice: 30 },
                { code: '120004', name: 'Vật lý đại cương', major: '', credits: 2, required: false, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '180001', name: 'Tư tưởng Hồ Chí Minh', major: '', credits: 2, required: true, totalPeriods: 30, theory: 30, practice: 0 },
                { code: '220018', name: 'Mạng máy tính', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220101', name: 'Hệ điều hành', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220236', name: 'Thiết kế Web', major: '', credits: 3, required: false, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220237', name: 'Lý thuyết xếp hàng', major: '', credits: 2, required: false, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '220250', name: 'Anh văn chuyên ngành công nghệ thông tin', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '410294', name: 'Anh văn không chuyên 4', major: '', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
              ]
            },
            {
              semLabel: 'Học kỳ 1', yearLabel: 'Năm học 2024 - 2025', totalCredits: 26,
              courses: [
                { code: '180053', name: 'Lịch sử Đảng Cộng sản Việt Nam', major: '', credits: 2, required: true, totalPeriods: 30, theory: 30, practice: 0 },
                { code: '220034', name: 'Chuyên đề Linux', major: 'TT', credits: 3, required: false, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220065', name: 'Thương mại điện tử', major: '', credits: 3, required: false, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220086', name: 'Lập trình ứng dụng trên Windows', major: 'TT', credits: 3, required: false, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220239', name: 'Phân tích và thiết kế hệ thống thông tin', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220241', name: 'Đồ họa ứng dụng', major: '', credits: 3, required: false, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220265', name: 'Thực tập đồ án cơ sở ngành', major: 'TT', credits: 3, required: true, totalPeriods: 6, theory: 0, practice: 0 },
                { code: '220267', name: 'Điện toán đám mây', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '320045', name: 'Thống kê và phân tích dữ liệu', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
              ]
            },
            {
              semLabel: 'Học kỳ 2', yearLabel: 'Năm học 2024 - 2025', totalCredits: 28,
              courses: [
                { code: '220059', name: 'Công nghệ phần mềm', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220060', name: 'Hệ quản trị cơ sở dữ liệu', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220071', name: 'Lập trình thiết bị di động', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220126', name: 'An toàn và bảo mật thông tin', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220242', name: 'Cơ sở trí tuệ nhân tạo', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220269', name: 'Khai phá dữ liệu', major: '', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '420000', name: 'Kỹ thuật XD & ban hành văn bản', major: 'TT', credits: 2, required: true, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '430000', name: 'Nguyên lý kế toán', major: '', credits: 2, required: false, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '440000', name: 'Quản trị doanh nghiệp', major: 'TT', credits: 2, required: false, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '450006', name: 'Tâm lý học đại cương', major: 'TT', credits: 2, required: false, totalPeriods: 45, theory: 15, practice: 30 },
                { code: '460252', name: 'Chuyên đề đặc biệt', major: 'TT', credits: 2, required: false, totalPeriods: 30, theory: 30, practice: 0 },
              ]
            },
            {
              semLabel: 'Học kỳ 1', yearLabel: 'Năm học 2025 - 2026', totalCredits: 27,
              courses: [
                { code: '220057', name: 'Xử lý ảnh', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220064', name: 'Chuyên đề ASP.net', major: 'TT', credits: 3, required: false, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220078', name: 'Quản trị dự án công nghệ thông tin', major: 'TT', credits: 3, required: true, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220120', name: 'Xây dựng phần mềm hướng đối tượng', major: 'TT', credits: 3, required: false, totalPeriods: 60, theory: 30, practice: 30 },
                { code: '220243', name: 'Phát triển ứng dụng Web với Java/Spring Boot', major: 'TT', credits: 3, required: false, totalPeriods: 60, theory: 30, practice: 30 },
              ]
            }
          ];

          // Helper: check if enrolled in a subject (by course code similarity with enrolled classCode/subject)
          const isEnrolled = (courseCode: string, courseName: string) => {
            return enrollments.some(e => {
              const cls = classesDetail[e.classId];
              const subj = cls?.subject || e.className || '';
              const code = cls?.classCode || '';
              return code.includes(courseCode) || subj.toLowerCase().includes(courseName.toLowerCase()) ||
                courseName.toLowerCase().includes(subj.toLowerCase().split(' ').slice(0, 3).join(' '));
            });
          };

          // Helper: check if completed/passed a subject (has grade and grade is not F)
          const isCompleted = (courseCode: string, courseName: string) => {
            return enrollments.some(e => {
              const cls = classesDetail[e.classId];
              const subj = cls?.subject || e.className || '';
              const code = cls?.classCode || '';
              const hasPassed = e.grade && e.grade !== 'F';
              return (code.includes(courseCode) || subj.toLowerCase().includes(courseName.toLowerCase()) ||
                courseName.toLowerCase().includes(subj.toLowerCase().split(' ').slice(0, 3).join(' '))) && hasPassed;
            });
          };

          const handlePrint = () => window.print();

          return (
            <div className="space-y-0">
              {/* Top bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-650 flex-shrink-0">CTĐT thực hiện</label>
                  <select className="px-4 py-2 border border-slate-700 rounded-lg bg-[#0d1b2a] text-white text-xs font-semibold min-w-[200px]">
                    <option>Công nghệ thông tin K2022</option>
                    <option>Công nghệ thông tin K2023</option>
                    <option>Công nghệ thông tin K2024</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1a2a3a] border border-slate-650 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    🖨 In
                  </button>
                  <button
                    onClick={() => {
                      // Simple CSV export of curriculum
                      const rows = TVU_CURRICULUM.flatMap((sem, si) =>
                        sem.courses.map((c, idx) => [
                          `"${sem.semLabel} - ${sem.yearLabel}"`,
                          idx + 1, c.code, `"${c.name}"`, c.major, c.credits,
                          c.required ? 'x' : '', isCompleted(c.code, c.name) ? 'x' : '',
                          c.totalPeriods, c.theory, c.practice
                        ].join(','))
                      );
                      const csv = ['Học kỳ,STT,Mã MH,Tên môn học,Chuyên ngành,Số tín chỉ,Môn bắt buộc,Đã học,Tổng tiết,Lý thuyết,Thực hành', ...rows].join('\n');
                      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'chuong_trinh_dao_tao.csv';
                      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    📊 Xuất Excel
                  </button>
                </div>
              </div>

              {/* Main table */}
              <div className="rounded-xl overflow-hidden border border-slate-700 shadow-xl" style={{ background: '#0d1b2a' }}>
                {/* Column headers */}
                <table className="w-full text-left border-collapse text-xs" style={{ minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: '#1a2a3a', borderBottom: '2px solid #2d3f52' }}>
                      <th className="py-3 px-3 text-slate-300 font-bold w-10 text-center">STT</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-24">
                        Mã MH ▲
                      </th>
                      <th className="py-3 px-3 text-slate-300 font-bold">Tên môn học</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-24 text-center">Chuyên ngành</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-20 text-center">Số tín chỉ</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-24 text-center">Môn bắt buộc</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-20 text-center">Đã học</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-20 text-center">Tổng tiết</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-20 text-center">Lý thuyết</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-20 text-center">Thực hành</th>
                      <th className="py-3 px-3 text-slate-300 font-bold w-24 text-center">Tiết thành phần</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TVU_CURRICULUM.map((semGroup) => {
                      const semTotalCredits = semGroup.totalCredits;
                      return (
                        <>
                          {/* Semester header row */}
                          <tr key={`header-${semGroup.semLabel}-${semGroup.yearLabel}`}
                            style={{ background: '#1e2d3d', borderTop: '1px solid #2d3f52', borderBottom: '1px solid #2d3f52' }}>
                            <td colSpan={4} className="py-2.5 px-3 font-bold text-white text-xs">
                              {semGroup.semLabel} - {semGroup.yearLabel}
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-blue-400 text-xs">{semTotalCredits}</td>
                            <td colSpan={6} />
                          </tr>

                          {/* Course rows */}
                          {semGroup.courses.map((course, idx) => {
                            const completed = isCompleted(course.code, course.name);
                            return (
                              <tr key={`${semGroup.semLabel}-${course.code}`}
                                className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                <td className="py-2.5 px-3 text-slate-400 text-center font-semibold">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-300 font-semibold">{course.code}</td>
                                <td className="py-2.5 px-3 text-white font-medium">
                                  {completed
                                    ? <span className="text-[#38bdf8] font-bold">{course.name}</span>
                                    : course.name}
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-300 font-semibold">{course.major}</td>
                                <td className="py-2.5 px-3 text-center text-white font-semibold">{course.credits}</td>
                                <td className="py-2.5 px-3 text-center">
                                  {course.required
                                    ? <span className="text-[#38bdf8] font-bold text-xs">x</span>
                                    : null}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {completed
                                    ? <span className="text-[#38bdf8] font-bold text-xs">x</span>
                                    : null}
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-350 font-semibold">{course.totalPeriods}</td>
                                <td className="py-2.5 px-3 text-center text-slate-350 font-semibold">{course.theory}</td>
                                <td className="py-2.5 px-3 text-center text-slate-350 font-semibold">{course.practice}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <button className="p-1.5 hover:bg-slate-700 rounded-md transition-colors" title="Xem tiết thành phần">
                                    <span className="text-[#38bdf8] text-xs">☰</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                <span>Tổng số tín chỉ toàn khóa: <strong className="text-blue-600">{TVU_CURRICULUM.reduce((s, g) => s + g.totalCredits, 0)}</strong></span>
                <span>•</span>
                <span>Số môn đã học: <strong className="text-emerald-600">{TVU_CURRICULUM.flatMap(g => g.courses).filter(c => isCompleted(c.code, c.name)).length}</strong> / {TVU_CURRICULUM.flatMap(g => g.courses).length}</span>
              </div>
            </div>
          );
        })()}



        {/* Tab 4: Course Registration */}
        {activeTab === 'registration' && (
          <div className="space-y-6">
            {/* Open Classes Portal matching layout and labels of Image 3 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                    ĐĂNG KÝ MÔN HỌC
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Sinh viên chọn học phần trong thời gian mở cổng đăng ký trực tuyến.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 flex-shrink-0">Bộ lọc môn học:</span>
                  <select
                    value={filterMode}
                    onChange={(e: any) => setFilterMode(e.target.value)}
                    className="px-4 py-2 border-2 border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not-yet">Môn chưa học trong CTDT thực hiện</option>
                    <option value="all">Tất cả các môn học mở đăng ký</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5">Danh sách môn học mở cho đăng ký</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wide text-xs">
                        <th className="py-3 px-3"></th>
                        <th className="py-3 px-3">Mã MH</th>
                        <th className="py-3 px-3">Tên môn học</th>
                        <th className="py-3 px-3">Nhóm</th>
                        <th className="py-3 px-3">Tổ</th>
                        <th className="py-3 px-3">Số TC</th>
                        <th className="py-3 px-3">Lớp</th>
                        <th className="py-3 px-3">Số lượng</th>
                        <th className="py-3 px-3">Còn lại</th>
                        <th className="py-3 px-3">Thời khóa biểu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredAvailableClasses.map((cls, idx) => {
                        const remaining = cls.maxStudents - cls.currentStudents;
                        return (
                          <tr key={cls.id} className="hover:bg-blue-50/10 transition-colors">
                            <td className="py-3.5 px-3">
                              <button
                                disabled={isRegistering || remaining <= 0}
                                onClick={() => handleRegister(cls.id)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase shadow-sm transition-all ${
                                  remaining <= 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                                }`}
                              >
                                Đăng ký
                              </button>
                            </td>
                            <td className="py-3.5 px-3 font-mono text-slate-500">{cls.classCode.substring(0, 6)}</td>
                            <td className="py-3.5 px-3 font-bold text-slate-900">{cls.subject}</td>
                            <td className="py-3.5 px-3 text-slate-500 font-mono">01</td>
                            <td className="py-3.5 px-3 text-slate-400">—</td>
                            <td className="py-3.5 px-3 font-black text-slate-800">{cls.maxStudents ? 3 : 2}</td>
                            <td className="py-3.5 px-3 font-bold text-blue-700">{cls.className.substring(0, 5)}</td>
                            <td className="py-3.5 px-3 text-slate-500">{cls.maxStudents}</td>
                            <td className={`py-3.5 px-3 font-black ${remaining <= 5 ? 'text-red-600' : 'text-slate-800'}`}>
                              {remaining}
                            </td>
                            <td className="py-3.5 px-3 text-[10px] text-slate-600 leading-snug font-medium">
                              {cls.schedule} / Phòng {cls.room || 'N/A'} <br />
                              <span className="font-bold text-indigo-900">GV: {cls.teacherName || 'Chưa phân công'}</span>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredAvailableClasses.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center py-10 text-slate-500">
                            Không tìm thấy lớp học phần mở đăng ký phù hợp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Registered Classes List */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Danh sách môn học đã đăng ký</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wide text-xs">
                      <th className="py-3 px-4 w-12 text-center">Xóa</th>
                      <th className="py-3 px-4">Mã MH</th>
                      <th className="py-3 px-4">Tên môn học</th>
                      <th className="py-3 px-4">Nhóm tổ</th>
                      <th className="py-3 px-4">Số TC</th>
                      <th className="py-3 px-4">Lớp</th>
                      <th className="py-3 px-4">Ngày đăng ký</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4">Thời khóa biểu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {enrollments
                      .filter(e => {
                        const det = classesDetail[e.classId];
                        return det?.academicYear === selectedAcademicYear && det?.semester === selectedSemester;
                      })
                      .map((enroll) => {
                        const cls = classesDetail[enroll.classId];
                        return (
                          <tr key={enroll.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-center">
                              <button
                                disabled={isRegistering}
                                onClick={() => handleCancelRegistration(enroll.classId)}
                                className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                                title="Hủy đăng ký học phần"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">{cls?.classCode.substring(0, 6) || 'N/A'}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{cls?.subject || enroll.className || 'Chưa cập nhật'}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono">01</td>
                            <td className="py-3 px-4 font-black text-slate-800">{enroll.credits || 3}</td>
                            <td className="py-3 px-4 font-bold text-blue-700">{cls?.className.substring(0, 5) || 'N/A'}</td>
                            <td className="py-3 px-4 text-slate-500 font-medium">
                              {new Date(enroll.enrollmentDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                                {enroll.status === 'DA_DANG_KY' ? 'Đã lưu' : enroll.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[10px] text-slate-600 leading-snug font-medium">
                              {cls?.schedule} <br />
                              <span className="font-bold text-indigo-900">GV: {cls?.teacherName || 'Chưa phân công'}</span>
                            </td>
                          </tr>
                        );
                      })}

                    {enrollments.filter(e => {
                      const det = classesDetail[e.classId];
                      return det?.academicYear === selectedAcademicYear && det?.semester === selectedSemester;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-slate-400 font-bold">
                          Không tìm thấy dữ liệu môn học đã đăng ký cho học kỳ hiện tại.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'transcript' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  BẢNG ĐIỂM CHI TIẾT
                </h3>
                <p className="text-xs text-slate-500 mt-1">Kết quả học tập các học phần tích lũy của sinh viên theo học kỳ và năm học.</p>
              </div>

              {groupedEnrollments.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-semibold">Chưa có kết quả học tập nào được ghi nhận</p>
                </div>
              ) : (
                groupedEnrollments.map((group, groupIdx) => (
                  <div key={groupIdx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-0">
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-800 text-sm">
                        NĂM HỌC: {group.year} &nbsp;•&nbsp; HỌC KỲ {group.semester}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        {group.items.length} môn học
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/55 text-slate-700 font-bold uppercase tracking-wide text-[10px]">
                            <th className="py-2.5 px-4">Mã MH</th>
                            <th className="py-2.5 px-4">Tên học phần</th>
                            <th className="py-2.5 px-4 text-center">TC</th>
                            <th className="py-2.5 px-4 text-center">Điểm TP 1 (20%)</th>
                            <th className="py-2.5 px-4 text-center">Điểm TP 2 (30%)</th>
                            <th className="py-2.5 px-4 text-center">Điểm Thi (50%)</th>
                            <th className="py-2.5 px-4 text-center">Tổng kết 10</th>
                            <th className="py-2.5 px-4 text-center">Hệ 4</th>
                            <th className="py-2.5 px-4 text-center">Điểm chữ</th>
                            <th className="py-2.5 px-4 text-center">Kết quả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                          {group.items.map((enroll) => {
                            const cls = classesDetail[enroll.classId];
                            const isPass = (enroll.letterGrade || enroll.grade) !== 'F';
                            return (
                              <tr key={enroll.id} className="hover:bg-slate-50/45 transition-colors">
                                <td className="py-3 px-4 font-mono text-slate-500">{cls?.classCode || 'N/A'}</td>
                                <td className="py-3 px-4 font-bold text-slate-900">{cls?.subject || enroll.className || 'Học phần'}</td>
                                <td className="py-3 px-4 text-center font-black">{enroll.credits || 3}</td>
                                <td className="py-3 px-4 text-center">{enroll.componentGrade1 !== null && enroll.componentGrade1 !== undefined ? enroll.componentGrade1.toFixed(1) : '—'}</td>
                                <td className="py-3 px-4 text-center">{enroll.componentGrade2 !== null && enroll.componentGrade2 !== undefined ? enroll.componentGrade2.toFixed(1) : '—'}</td>
                                <td className="py-3 px-4 text-center">{enroll.finalExamGrade !== null && enroll.finalExamGrade !== undefined ? enroll.finalExamGrade.toFixed(1) : '—'}</td>
                                <td className="py-3 px-4 text-center font-black text-slate-800">{enroll.totalGrade10 !== null && enroll.totalGrade10 !== undefined ? enroll.totalGrade10.toFixed(2) : '—'}</td>
                                <td className="py-3 px-4 text-center font-black text-blue-700">{enroll.totalGrade4 !== null && enroll.totalGrade4 !== undefined ? enroll.totalGrade4.toFixed(2) : '—'}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                    (enroll.letterGrade || enroll.grade)?.startsWith('A') ? 'bg-green-50 text-green-700 border-green-200' :
                                    (enroll.letterGrade || enroll.grade)?.startsWith('B') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    (enroll.letterGrade || enroll.grade)?.startsWith('C') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    (enroll.letterGrade || enroll.grade)?.startsWith('D') ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    (enroll.letterGrade || enroll.grade) === 'F' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>
                                    {enroll.letterGrade || enroll.grade || '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                    isPass ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {isPass ? '✓ ĐẠT' : '✗ HỌC LẠI'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;

/* ---- Helper components for TVU-style info panel ---- */
function TVUInfoRow({
  label, value, mono = false, truncate = false
}: { label: string; value: string; mono?: boolean; truncate?: boolean }) {
  return (
    <tr>
      <td className="py-2 pl-5 pr-2 text-[11px] font-bold text-slate-500 whitespace-nowrap w-[120px] align-top">{label}</td>
      <td className={`py-2 pr-4 text-[11px] font-semibold text-slate-800 align-top ${mono ? 'font-mono' : ''} ${truncate ? 'max-w-[160px] truncate' : ''}`}>
        {value || '—'}
      </td>
    </tr>
  );
}

function TVUCourseCell({
  label, value, mono = false
}: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-3.5 flex flex-col gap-0.5">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-[13px] font-extrabold text-slate-800 leading-snug ${mono ? 'font-mono text-blue-700' : ''}`}>{value || '—'}</p>
    </div>
  );
}

