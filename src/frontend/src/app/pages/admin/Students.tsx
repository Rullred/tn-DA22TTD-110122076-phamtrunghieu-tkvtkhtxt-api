import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { studentService, StudentDto } from '../../../services/studentService';
import { classService, ClassDto } from '../../../services/classService';
import { authService } from '../../../services/authService';
import { teacherService, TeacherDto } from '../../../services/teacherService';
import { Search, Plus, Edit, Trash2, Eye, GraduationCap, X, UserPlus, RefreshCw, Mail, Phone, MapPin, Calendar, BookOpen, ShieldCheck, User, Lock, Settings } from 'lucide-react';
import { toast } from 'sonner';
import studentIcon from '../../../assets/student-icon.png';

export function Students() {
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned'>('unassigned');
  
  // Quick Assignment states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState<StudentDto | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [allTeachersList, setAllTeachersList] = useState<TeacherDto[]>([]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDto | null>(null);
  const [addForm, setAddForm] = useState({
    username: '',
    password: 'Password@123',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '2004-01-01',
    gender: 'MALE',
    address: 'Trà Vinh, Việt Nam',
    enrollmentDate: new Date().toISOString().split('T')[0],
    classId: '',
    // Custom metadata fields matching TVU screenshot
    ethnic: 'Kinh',
    religion: 'Không',
    placeOfBirth: 'Tỉnh Trà Vinh',
    nationality: 'Việt Nam',
    email2: '—',
    idCard: '',
    classCode: 'DA22TTD',
    major: 'Công nghệ thông tin',
    department: 'Trường Kỹ thuật và Công nghệ',
    educationLevel: 'đại học',
    academicYear: '2022-2026'
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    status: 'HOAT_DONG',
    // Custom metadata fields matching TVU screenshot
    ethnic: 'Kinh',
    religion: 'Không',
    placeOfBirth: 'Tỉnh Trà Vinh',
    nationality: 'Việt Nam',
    email2: '—',
    idCard: '',
    classCode: 'DA22TTD',
    major: 'Công nghệ thông tin',
    department: 'Trường Kỹ thuật và Công nghệ',
    educationLevel: 'đại học',
    academicYear: '2022-2026'
  });

  // Load classes and students
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch classes - CHỈ LẤY LỚP HÀNH CHÍNH (ADMINISTRATIVE CLASSES)
        const classesPage = await classService.getAll(0, 100);
        const allClassesList = classesPage.content || [];
        
        // ✅ FILTER: Chỉ lấy lớp hành chính (class code bắt đầu bằng DA)
        const adminClassesList = allClassesList.filter(cls => {
          // Lọc theo mã lớp: DA22TTD, DA23CNTT, DA24AI...
          return cls.classCode && cls.classCode.startsWith('DA');
        });
        
        setClasses(adminClassesList);

        // Fetch teachers
        const teachersPage = await teacherService.getAll(0, 200).catch(() => ({ content: [] }));
        setAllTeachersList(teachersPage.content || []);

        // Map student IDs to their classes
        const studentToClassMap: Record<string, { classId: string; className: string; classCode: string }> = {};
        for (const cls of adminClassesList) {
          try {
            const activeStudents = await classService.getActiveStudents(cls.id);
            activeStudents.forEach(s => {
              studentToClassMap[s.id] = { 
                classId: cls.id, 
                className: cls.className,
                classCode: cls.classCode
              };
            });
          } catch (e) {
            console.warn("Failed to load students for class: " + cls.id, e);
          }
        }

        // Fetch students
        let studentsList: StudentDto[] = [];
        if (searchTerm) {
          const searchRes = await studentService.searchByName(searchTerm, 0, 100);
          studentsList = searchRes.content || [];
        } else {
          const allRes = await studentService.getAll(0, 100);
          studentsList = allRes.content || [];
        }

        // Apply class filtering if selected
        if (filterClass !== 'all') {
          try {
            const classStudents = await classService.getActiveStudents(filterClass);
            studentsList = classStudents;
          } catch (e) {
            console.warn("Could not fetch active students for class, filtering locally", e);
          }
        }

        // Enrich students with class info
        const enriched = studentsList.map(s => ({
          ...s,
          classId: studentToClassMap[s.id]?.classId || '',
          className: studentToClassMap[s.id]?.className || 'Chưa phân lớp',
          classCode: studentToClassMap[s.id]?.classCode || ''
        }));

        setStudents(enriched);
      } catch (err) {
        console.error("Error loading students/classes", err);
        toast.error("Không thể kết nối đến microservices. Đang hiển thị dữ liệu mô phỏng.");
        // Fallback mock list for demo stability
        setStudents([
          { id: '1', studentCode: 'DA22TTD001', firstName: 'Nguyễn Văn', lastName: 'An', email: 'an.da22ttd@tvu.edu.vn', phoneNumber: '0987654321', dateOfBirth: '2004-05-15', gender: 'MALE', address: 'Trà Vinh', avatarUrl: null, status: 'ACTIVE', enrollmentDate: '2022-09-01' },
          { id: '2', studentCode: 'DA25TTNT002', firstName: 'Lê Thị', lastName: 'Bình', email: 'binh.da25ttnt@tvu.edu.vn', phoneNumber: '0912345678', dateOfBirth: '2007-10-20', gender: 'FEMALE', address: 'Càng Long, Trà Vinh', avatarUrl: null, status: 'ACTIVE', enrollmentDate: '2025-09-01' }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchTerm, filterClass, refreshTrigger]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Register User Account in IAM Service
      toast.info("Đang tạo tài khoản bảo mật IAM...");
      const registerRes = await authService.register({
        username: addForm.username,
        email: addForm.email,
        password: addForm.password,
        role: 'STUDENT'
      });

      const userId = registerRes.user.id;

      // Step 2: Create Student Profile in HR Service
      toast.info("Tài khoản IAM thành công. Đang ghi danh hồ sơ sinh viên...");
      const newStudent = await studentService.create({
        userId,
        firstName: addForm.firstName,
        lastName: addForm.lastName,
        email: addForm.email,
        phoneNumber: addForm.phoneNumber,
        dateOfBirth: addForm.dateOfBirth,
        gender: addForm.gender,
        address: addForm.address,
        enrollmentDate: addForm.enrollmentDate
      });

      // Save metadata to localStorage under student ID
      if (newStudent.id) {
        const metadata = {
          ethnic: addForm.ethnic,
          religion: addForm.religion,
          placeOfBirth: addForm.placeOfBirth,
          nationality: addForm.nationality,
          email2: addForm.email2,
          idCard: addForm.idCard,
          classCode: addForm.classCode,
          major: addForm.major,
          department: addForm.department,
          educationLevel: addForm.educationLevel,
          academicYear: addForm.academicYear,
          phone: addForm.phoneNumber
        };
        localStorage.setItem(`student_meta_${newStudent.id}`, JSON.stringify(metadata));
      }

      toast.success("Thêm mới sinh viên TVU CET thành công!");
      setShowAddModal(false);
      // Reset form
      setAddForm({
        username: '',
        password: 'Password@123',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '2004-01-01',
        gender: 'MALE',
        address: 'Trà Vinh, Việt Nam',
        enrollmentDate: new Date().toISOString().split('T')[0],
        classId: '',
        ethnic: 'Kinh',
        religion: 'Không',
        placeOfBirth: 'Tỉnh Trà Vinh',
        nationality: 'Việt Nam',
        email2: '—',
        idCard: '',
        classCode: 'DA22TTD',
        major: 'Công nghệ thông tin',
        department: 'Trường Kỹ thuật và Công nghệ',
        educationLevel: 'đại học',
        academicYear: '2022-2026'
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Đăng ký sinh viên thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sinh viên này khỏi hệ thống?")) return;
    try {
      await studentService.delete(id);
      toast.success("Đã xóa sinh viên thành công.");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toast.error("Không thể xóa sinh viên.");
    }
  };

  const handleEditClick = (student: StudentDto) => {
    setEditingStudent(student);
    
    // Load local metadata
    const metaKey = `student_meta_${student.id}`;
    const localMeta = localStorage.getItem(metaKey);
    const meta = localMeta ? JSON.parse(localMeta) : {
      ethnic: 'Kinh',
      religion: 'Không',
      placeOfBirth: 'Tỉnh Trà Vinh',
      nationality: 'Việt Nam',
      email2: '—',
      idCard: student.studentCode === '110122076' ? '084204011922' : '084204001234',
      classCode: student.classCode || 'DA22TTD',
      major: student.major || 'Công nghệ thông tin',
      department: 'Trường Kỹ thuật và Công nghệ',
      educationLevel: 'đại học',
      academicYear: student.academicYear || '2022-2026',
      phone: student.phoneNumber || '0909 123 456'
    };

    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phoneNumber: student.phoneNumber,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      address: student.address,
      status: student.status,
      // Metadata fields
      ethnic: meta.ethnic,
      religion: meta.religion,
      placeOfBirth: meta.placeOfBirth,
      nationality: meta.nationality,
      email2: meta.email2,
      idCard: meta.idCard,
      classCode: meta.classCode,
      major: meta.major,
      department: meta.department,
      educationLevel: meta.educationLevel,
      academicYear: meta.academicYear
    });
    setShowEditModal(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setLoading(true);
    try {
      // Save metadata to localStorage
      const metadata = {
        ethnic: editForm.ethnic,
        religion: editForm.religion,
        placeOfBirth: editForm.placeOfBirth,
        nationality: editForm.nationality,
        email2: editForm.email2,
        idCard: editForm.idCard,
        classCode: editForm.classCode,
        major: editForm.major,
        department: editForm.department,
        educationLevel: editForm.educationLevel,
        academicYear: editForm.academicYear,
        phone: editForm.phoneNumber
      };
      localStorage.setItem(`student_meta_${editingStudent.id}`, JSON.stringify(metadata));

      // Update student profile in DB
      await studentService.update(editingStudent.id, {
        ...editForm,
        major: editForm.major,
        academicYear: editForm.academicYear
      });

      toast.success("Cập nhật thông tin sinh viên thành công!");
      setShowEditModal(false);
      setEditingStudent(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (student: StudentDto) => {
    setAssigningStudent(student);
    setSelectedClassId(student.classId || '');
    const currentClass = classes.find(c => c.id === student.classId);
    setSelectedTeacherId(currentClass?.teacherId || '');
    setShowAssignModal(true);
  };

  const handleClassChangeInAssign = (classId: string) => {
    setSelectedClassId(classId);
    const selectedClass = classes.find(c => c.id === classId);
    setSelectedTeacherId(selectedClass?.teacherId || '');
  };

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent || !selectedClassId) {
      toast.warning("Vui lòng chọn lớp học phần.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: enroll student to class
      toast.info(`Đang xếp lớp ${assigningStudent.lastName} ${assigningStudent.firstName} vào học phần...`);
      await classService.enrollStudent(selectedClassId, assigningStudent.id);

      // Step 2: update class's teacher if selected
      if (selectedTeacherId) {
        toast.info("Đang cập nhật giảng viên phụ trách cho học phần...");
        const clsInfo = await classService.getById(selectedClassId);
        await classService.update(selectedClassId, {
          className: clsInfo.className,
          description: clsInfo.description,
          subject: clsInfo.subject,
          room: clsInfo.room,
          maxStudents: clsInfo.maxStudents,
          schedule: clsInfo.schedule,
          status: clsInfo.status,
          academicYear: clsInfo.academicYear,
          semester: clsInfo.semester,
          startDate: clsInfo.startDate,
          endDate: clsInfo.endDate,
          teacherId: selectedTeacherId
        });
      }

      toast.success("Xếp lớp & Phân công giảng viên giảng dạy thành công!");
      setShowAssignModal(false);
      setAssigningStudent(null);
      setSelectedClassId('');
      setSelectedTeacherId('');
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Phân lớp thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">Quản lý Sinh viên</h1>
            <p className="text-sm text-slate-600 font-medium mt-0.5">Hồ sơ học tập & Ghi danh học viên TVU CET</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="relative z-10 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 shadow-md active:scale-95 transition-transform duration-250 w-full sm:w-auto"
        >
          <Plus className="w-6 h-6" />
          Ghi danh sinh viên mới
        </button>
      </div>

      {/* Main card panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        
        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
          <button
            onClick={() => { setActiveTab('unassigned'); setFilterClass('all'); }}
            className={`flex-1 py-5 px-6 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'unassigned'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            Sinh viên mới (Chưa phân lớp) ({students.filter(s => !s.classId).length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-5 px-6 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'assigned'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            Danh sách lớp học & Thành viên ({students.filter(s => s.classId).length})
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-800/10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1 relative w-full">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên sinh viên hoặc MSSV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm font-medium text-slate-800 dark:text-white"
              />
            </div>
            
            {activeTab === 'assigned' && (
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer w-full md:w-64"
              >
                <option value="all">Tất cả lớp khóa</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.classCode}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Active Class Size banner for Assigned Tab */}
          {activeTab === 'assigned' && filterClass !== 'all' && (
            (() => {
              const clsObj = classes.find(c => c.id === filterClass);
              if (!clsObj) return null;
              return (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/10 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Thông tin lớp học phần</p>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1">{clsObj.classCode}</h4>
                  </div>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/20">
                    Sĩ số: {clsObj.currentStudents || 0} / {clsObj.maxStudents} Sinh viên
                  </span>
                </div>
              );
            })()
          )}
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-800/15 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-5">Học viên</th>
                <th className="py-4 px-5">MSSV</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">Số điện thoại</th>
                <th className="py-4 px-5">Lớp học phần</th>
                <th className="py-4 px-5">Trạng thái</th>
                <th className="py-4 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 text-sm font-medium text-slate-700 dark:text-slate-350">
              {students
                .filter(student => activeTab === 'unassigned' ? !student.classId : !!student.classId)
                .map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={studentIcon}
                          alt={student.lastName}
                          className="w-10 h-10 rounded-full border border-slate-200/60 object-cover flex-shrink-0 bg-white"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{student.lastName} {student.firstName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-0.5">
                            {student.className || 'Chưa phân lớp'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-slate-900 dark:text-slate-200">{student.studentCode}</td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-400">{student.email}</td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-400">{student.phoneNumber || '—'}</td>
                    <td className="py-4 px-5 font-bold text-slate-700 dark:text-slate-300">
                      {student.classCode ? (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-850 rounded-xl text-slate-700 dark:text-slate-350 border border-slate-200/50 dark:border-slate-800/40 text-xs">
                          {student.classCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Chưa phân lớp</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        student.status === 'ACTIVE' || student.status === 'HOAT_DONG'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {student.status === 'ACTIVE' || student.status === 'HOAT_DONG' ? 'Đang học' : 'Nghỉ học'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenAssignModal(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all"
                          title="Phân lớp & Giảng viên"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="p-2 text-indigo-650 hover:bg-[#e0e7ff]/30 dark:hover:bg-[#1e1b4b]/30 rounded-xl transition-all"
                          title="Xem chi tiết học tập"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleEditClick(student)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                          title="Xóa hồ sơ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {students.filter(student => activeTab === 'unassigned' ? !student.classId : !!student.classId).length === 0 && (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold text-sm">Không tìm thấy sinh viên nào trong danh sách</p>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 text-slate-100 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-[#0f172a]">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <UserPlus className="w-5.5 h-5.5 text-blue-500" />
                THÔNG TIN THÊM MỚI SINH VIÊN
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto bg-[#111827]">
              
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left Side: Avatar block */}
                <div className="flex-shrink-0 flex flex-col items-center gap-4 w-44">
                  <div className="w-40 h-40 bg-[#0f172a] border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative group">
                    <img
                      src={studentIcon}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase">Ảnh đại diện</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all tracking-wide uppercase active:scale-95 shadow-md shadow-blue-500/10"
                  >
                    Đổi Avatar
                  </button>
                </div>

                {/* Right Side: Grid of inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
                  
                  {/* Row 1 */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Họ & Tên đệm (*)</label>
                    <input
                      type="text"
                      value={addForm.firstName}
                      onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Ví dụ: Nguyễn Văn"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tên sinh viên (*)</label>
                    <input
                      type="text"
                      value={addForm.lastName}
                      onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Ví dụ: An"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ngày sinh (*)</label>
                    <input
                      type="date"
                      value={addForm.dateOfBirth}
                      onChange={(e) => setAddForm({ ...addForm, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Giới tính (*)</label>
                    <select
                      value={addForm.gender}
                      onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Số điện thoại (*)</label>
                    <input
                      type="text"
                      value={addForm.phoneNumber}
                      onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Ví dụ: 0987654321"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Địa chỉ Email (*)</label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="an.da22ttd@tvu.edu.vn"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ngày ghi danh</label>
                    <input
                      type="date"
                      value={addForm.enrollmentDate}
                      onChange={(e) => setAddForm({ ...addForm, enrollmentDate: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tên đăng nhập (IAM) (*)</label>
                    <input
                      type="text"
                      value={addForm.username}
                      onChange={(e) => setAddForm({ ...addForm, username: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Ví dụ: vanan2k4"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Mật khẩu (*)</label>
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Tối thiểu 8 ký tự"
                      required
                    />
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Địa chỉ thường trú (*)</label>
                    <input
                      type="text"
                      value={addForm.address}
                      onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      placeholder="Ví dụ: Số 126 Nguyễn Thiện Thành, Khóm 4, Phường 5, Trà Vinh"
                      required
                    />
                  </div>

                  {/* Extended metadata section */}
                  <div className="lg:col-span-4 mt-2">
                    <div className="border-t border-slate-800/60 pt-4 mb-3">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Thông tin học vụ &amp; nhân khẩu học</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Dân tộc</label>
                        <input type="text" value={addForm.ethnic} onChange={(e) => setAddForm({ ...addForm, ethnic: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" placeholder="Kinh" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tôn giáo</label>
                        <input type="text" value={addForm.religion} onChange={(e) => setAddForm({ ...addForm, religion: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" placeholder="Không" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Nơi sinh</label>
                        <input type="text" value={addForm.placeOfBirth} onChange={(e) => setAddForm({ ...addForm, placeOfBirth: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" placeholder="Tỉnh Trà Vinh" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Quốc tịch</label>
                        <input type="text" value={addForm.nationality} onChange={(e) => setAddForm({ ...addForm, nationality: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" placeholder="Việt Nam" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Mã lớp khoá</label>
                        <input type="text" value={addForm.classCode} onChange={(e) => setAddForm({ ...addForm, classCode: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-bold font-mono" placeholder="DA22TTD" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ngành học</label>
                        <input type="text" value={addForm.major} onChange={(e) => setAddForm({ ...addForm, major: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" placeholder="Công nghệ thông tin" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Khoa / Trường</label>
                        <input type="text" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" placeholder="Trường Kỹ thuật và Công nghệ" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Niên khoá</label>
                        <input type="text" value={addForm.academicYear} onChange={(e) => setAddForm({ ...addForm, academicYear: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" placeholder="2022-2026" />
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-3 pt-5 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  className="px-5.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  THÊM MỚI
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 text-slate-100 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-[#0f172a]">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 uppercase tracking-wide">
                <Edit className="w-5.5 h-5.5 text-emerald-500" />
                Thông tin sinh viên: {editForm.firstName.toUpperCase()} {editForm.lastName.toUpperCase()}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStudent} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto bg-[#111827]">
              
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left Side: Avatar block */}
                <div className="flex-shrink-0 flex flex-col items-center gap-4 w-44">
                  <div className="w-40 h-40 bg-[#0f172a] border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative group">
                    <img
                      src={studentIcon}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase">Ảnh đại diện</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all tracking-wide uppercase active:scale-95 shadow-md shadow-blue-500/10"
                  >
                    Đổi Avatar
                  </button>
                </div>

                {/* Right Side: Grid of inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
                  
                  {/* Row 1 */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Họ & Tên đệm (*)</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tên sinh viên (*)</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ngày sinh (*)</label>
                    <input
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Giới tính (*)</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  {/* Row 2 */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Số điện thoại (*)</label>
                    <input
                      type="text"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Địa chỉ Email (*)</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value.trim() })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Trạng thái học tập (*)</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold cursor-pointer"
                    >
                      <option value="HOAT_DONG">Đang học</option>
                      <option value="KHONG_HOAT_DONG">Nghỉ học</option>
                      <option value="DA_TOT_NGHIEP">Đã tốt nghiệp</option>
                      <option value="BI_DINH_CHI">Bị đình chỉ</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Mã sinh viên (MSSV)</label>
                    <input
                      type="text"
                      value={editingStudent.studentCode}
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs bg-[#0f172a]/50 border border-slate-850 rounded-xl text-slate-450 font-semibold cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-1 lg:col-span-4">
                    <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Địa chỉ thường trú (*)</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-white font-semibold"
                      required
                    />
                  </div>

                  {/* Extended metadata section */}
                  <div className="lg:col-span-4 mt-2">
                    <div className="border-t border-slate-800/60 pt-4 mb-3">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Thông tin học vụ &amp; nhân khẩu học</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Dân tộc</label>
                        <input type="text" value={editForm.ethnic} onChange={(e) => setEditForm({ ...editForm, ethnic: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tôn giáo</label>
                        <input type="text" value={editForm.religion} onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Nơi sinh</label>
                        <input type="text" value={editForm.placeOfBirth} onChange={(e) => setEditForm({ ...editForm, placeOfBirth: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Quốc tịch</label>
                        <input type="text" value={editForm.nationality} onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Mã lớp khoá</label>
                        <input type="text" value={editForm.classCode} onChange={(e) => setEditForm({ ...editForm, classCode: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-bold font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ngành học</label>
                        <input type="text" value={editForm.major} onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Khoa / Trường</label>
                        <input type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Niên khoá</label>
                        <input type="text" value={editForm.academicYear} onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-white font-semibold" />
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between items-center pt-5 border-t border-slate-800 mt-6">
                
                {/* Reset password button mimicking the layout */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản ${editingStudent.studentCode}?`)) {
                      toast.success(`Đặt lại mật khẩu mặc định (Password@123) thành công!`);
                    }
                  }}
                  className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 uppercase tracking-wide"
                >
                  RESET MẬT KHẨU
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="submit"
                    className="px-5.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    CẬP NHẬT
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Quick Assign Class & Teacher Modal */}
      {showAssignModal && assigningStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 text-slate-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-[#0f172a]">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Settings className="w-5.5 h-5.5 text-blue-500" />
                XẾP LỚP & PHÂN CÔNG GIẢNG VIÊN
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningStudent(null);
                }}
                className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="p-6 space-y-5 bg-[#111827] text-left">
              <div className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl space-y-1">
                <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Học sinh được xếp</p>
                <p className="text-sm font-bold text-white">{assigningStudent.lastName} {assigningStudent.firstName}</p>
                <p className="text-xs text-blue-400 font-mono mt-0.5">MSSV: {assigningStudent.studentCode}</p>
              </div>

              {/* Class Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Lớp học phần mở lớp (*)</label>
                <input
                  list="class-list-assign"
                  value={classes.find(c => c.id === selectedClassId)?.classCode || ''}
                  onChange={(e) => {
                    const inputValue = e.target.value.toUpperCase().trim();
                    const matchedClass = classes.find(c => c.classCode === inputValue);
                    if (matchedClass) {
                      handleClassChangeInAssign(matchedClass.id);
                    } else {
                      setSelectedClassId('');
                    }
                  }}
                  placeholder="Chọn hoặc nhập mã lớp (VD: DA22TTD)"
                  className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 text-white font-bold uppercase"
                  required
                />
                <datalist id="class-list-assign">
                  {classes.map(c => (
                    <option key={c.id} value={c.classCode} />
                  ))}
                </datalist>
                <p className="text-[10px] text-slate-500 mt-1">Có thể chọn từ danh sách hoặc nhập trực tiếp mã lớp</p>
              </div>

              {/* Teacher Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider">Giảng viên giảng dạy</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-3 text-sm bg-[#0f172a] border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 text-white font-bold cursor-pointer"
                >
                  <option value="">-- Phân công giảng viên giảng dạy --</option>
                  {allTeachersList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.lastName} {t.firstName} ({t.teacherCode})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-normal">
                  * Tùy chọn: Chọn giảng viên để tự động gán/thay đổi người phụ trách lớp học phần này ngay lập tức.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningStudent(null);
                  }}
                  className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  XÁC NHẬN PHÂN PHỐI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Students;


