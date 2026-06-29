import { api } from './api';
import { PageResponse, ApiResponse, StudentDto } from './studentService';

export interface ClassDto {
  id: string;
  classCode: string;
  className: string;
  description: string;
  teacherId: string | null;
  teacherName: string | null;
  subject: string;
  room: string;
  maxStudents: number;
  currentStudents: number;
  schedule: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | string;
  academicYear: string;
  semester: number;
  startDate: string;
  endDate: string;
}

export interface CreateClassRequest {
  classCode: string;
  className: string;
  description?: string;
  teacherId?: string;
  subject: string;
  room?: string;
  maxStudents: number;
  schedule?: string;
  academicYear: string;
  semester: number;
  startDate: string;
  endDate: string;
}

export interface UpdateClassRequest {
  className: string;
  description?: string;
  teacherId?: string;
  subject: string;
  room?: string;
  maxStudents: number;
  schedule?: string;
  status: string;
  academicYear: string;
  semester: number;
  startDate: string;
  endDate: string;
}

export interface EnrollmentDto {
  id: string;
  classId: string;
  className?: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'DROPPED' | 'COMPLETED' | string;
  credits?: number;
  componentGrade1?: number | null;
  componentGrade2?: number | null;
  finalExamGrade?: number | null;
  totalGrade10?: number | null;
  totalGrade4?: number | null;
  letterGrade?: string | null;
  grade: string | null;
  attendanceRate: number | null;
  notes: string | null;
  droppedAt: string | null;
}

export interface UpdateEnrollmentRequest {
  status?: string;
  credits?: number;
  componentGrade1?: number;
  componentGrade2?: number;
  finalExamGrade?: number;
  grade?: string;
  attendanceRate?: number;
  notes?: string;
}

export const classService = {
  /**
   * Get all classes with pagination
   */
  async getAll(page = 0, size = 20, sortBy = 'id', sortDir = 'ASC'): Promise<PageResponse<ClassDto>> {
    const response = await api.get<ApiResponse<PageResponse<ClassDto>>>('/api/classes', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  },

  /**
   * Get class by ID
   */
  async getById(id: string): Promise<ClassDto> {
    const response = await api.get<ApiResponse<ClassDto>>(`/api/classes/${id}`);
    return response.data.data;
  },

  /**
   * Get class by code
   */
  async getByCode(code: string): Promise<ClassDto> {
    const response = await api.get<ApiResponse<ClassDto>>(`/api/classes/code/${code}`);
    return response.data.data;
  },

  /**
   * Search classes by name
   */
  async searchByName(name: string, page = 0, size = 20): Promise<PageResponse<ClassDto>> {
    const response = await api.get<ApiResponse<PageResponse<ClassDto>>>('/api/classes/search', {
      params: { name, page, size }
    });
    return response.data.data;
  },

  /**
   * Get classes by teacher ID
   */
  async getByTeacher(teacherId: string, page = 0, size = 20): Promise<PageResponse<ClassDto>> {
    const response = await api.get<ApiResponse<PageResponse<ClassDto>>>(`/api/classes/teacher/${teacherId}`, {
      params: { page, size }
    });
    return response.data.data;
  },

  /**
   * Create new class
   */
  async create(data: CreateClassRequest): Promise<ClassDto> {
    const response = await api.post<ApiResponse<ClassDto>>('/api/classes', data);
    return response.data.data;
  },

  /**
   * Update class
   */
  async update(id: string, data: UpdateClassRequest): Promise<ClassDto> {
    const response = await api.put<ApiResponse<ClassDto>>(`/api/classes/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete class
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/classes/${id}`);
  },

  /**
   * Enroll a student in class
   */
  async enrollStudent(classId: string, studentId: string): Promise<EnrollmentDto> {
    const response = await api.post<ApiResponse<EnrollmentDto>>(`/api/classes/${classId}/enroll`, {
      studentId
    });
    return response.data.data;
  },

  /**
   * Drop a student from class
   */
  async dropStudent(classId: string, studentId: string): Promise<void> {
    await api.delete(`/api/classes/${classId}/students/${studentId}`);
  },

  /**
   * Get active students in class
   */
  async getActiveStudents(classId: string): Promise<StudentDto[]> {
    const response = await api.get<ApiResponse<StudentDto[]>>(`/api/classes/${classId}/students`);
    return response.data.data;
  },

  /**
   * Update enrollment (grades, attendance, status)
   */
  async updateEnrollment(enrollmentId: string, data: UpdateEnrollmentRequest): Promise<EnrollmentDto> {
    const response = await api.put<ApiResponse<EnrollmentDto>>(`/api/classes/enrollments/${enrollmentId}`, data);
    return response.data.data;
  },

  /**
   * Get student's enrollments (classes and grades)
   */
  async getStudentEnrollments(studentId: string, page = 0, size = 100): Promise<PageResponse<EnrollmentDto>> {
    const response = await api.get<ApiResponse<PageResponse<EnrollmentDto>>>(`/api/classes/students/${studentId}/enrollments`, {
      params: { page, size }
    });
    return response.data.data;
  },

  /**
   * Get class enrollments (students list in a class with grades/details)
   */
  async getClassEnrollments(classId: string, page = 0, size = 100): Promise<PageResponse<EnrollmentDto>> {
    const response = await api.get<ApiResponse<PageResponse<EnrollmentDto>>>(`/api/classes/${classId}/enrollments`, {
      params: { page, size }
    });
    return response.data.data;
  },

  /**
   * Get total class count
   */
  async getCount(): Promise<number> {
    const response = await api.get<ApiResponse<number>>('/api/classes/count');
    return response.data.data;
  },

  /**
   * Get available classes for student registration
   */
  async getAvailableClasses(
    studentId?: string,
    academicYear?: string,
    semester?: number,
    page = 0,
    size = 100
  ): Promise<PageResponse<any>> {
    const response = await api.get<ApiResponse<PageResponse<any>>>('/api/classes/available', {
      params: { studentId, academicYear, semester, page, size }
    });
    return response.data.data;
  }
};

export default classService;
