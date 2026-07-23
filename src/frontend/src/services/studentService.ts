import { api } from './api';

export interface StudentDto {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  address: string;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  enrollmentDate: string;
  conductScore?: number | null;
  advisorId?: string | null;
  cohort?: string | null;
  major?: string | null;
  academicYear?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentRequest {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  enrollmentDate: string;
  major?: string;
  cohort?: string;
}

export interface UpdateStudentRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  status: string;
  major?: string;
  cohort?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface GpaDistribution {
  excellentGood: number; // GPA >= 3.2
  fair: number;          // 2.5 - 3.19
  average: number;       // 2.0 - 2.49
  weak: number;          // < 2.0
  totalGraded: number;   // tổng SV đã có điểm
}

export const studentService = {
  /**
   * Get all students with pagination
   */
  async getAll(page = 0, size = 20, sortBy = 'id', sortDir = 'ASC'): Promise<PageResponse<StudentDto>> {
    const response = await api.get<ApiResponse<PageResponse<StudentDto>>>('/api/students', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  },

  /**
   * Get student by ID
   */
  async getById(id: string): Promise<StudentDto> {
    const response = await api.get<ApiResponse<StudentDto>>(`/api/students/${id}`);
    return response.data.data;
  },

  /**
   * Get student by student code
   */
  async getByCode(code: string): Promise<StudentDto> {
    const response = await api.get<ApiResponse<StudentDto>>(`/api/students/code/${code}`);
    return response.data.data;
  },

  /**
   * Search students by name
   */
  async searchByName(name: string, page = 0, size = 20): Promise<PageResponse<StudentDto>> {
    const response = await api.get<ApiResponse<PageResponse<StudentDto>>>('/api/students/search', {
      params: { name, page, size }
    });
    return response.data.data;
  },

  /**
   * Create new student profile
   */
  async create(data: CreateStudentRequest): Promise<StudentDto> {
    const response = await api.post<ApiResponse<StudentDto>>('/api/students', data);
    return response.data.data;
  },

  /**
   * Update student profile
   */
  async update(id: string, data: UpdateStudentRequest): Promise<StudentDto> {
    const response = await api.put<ApiResponse<StudentDto>>(`/api/students/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete student profile
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/students/${id}`);
  },

  /**
   * Upload student avatar
   */
  async uploadAvatar(id: string, file: File): Promise<StudentDto> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse<StudentDto>>(`/api/upload/students/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Delete student avatar
   */
  async deleteAvatar(id: string): Promise<StudentDto> {
    const response = await api.delete<ApiResponse<StudentDto>>(`/api/upload/students/${id}/avatar`);
    return response.data.data;
  },

  /**
   * Get total student count
   */
  async getCount(): Promise<number> {
    const response = await api.get<ApiResponse<number>>('/api/students/count');
    return response.data.data;
  },

  /**
   * Phân bố xếp loại học lực toàn trường (tính từ điểm thật) — dùng cho widget Dashboard.
   */
  async getGpaDistribution(): Promise<GpaDistribution> {
    const response = await api.get<ApiResponse<GpaDistribution>>('/api/students/gpa-distribution');
    return response.data.data;
  },

  /**
   * Update conduct score (diem ren luyen)
   */
  async updateConductScore(id: string, conductScore: number): Promise<StudentDto> {
    const response = await api.put<ApiResponse<StudentDto>>(`/api/students/${id}/conduct-score`, {
      conductScore
    });
    return response.data.data;
  },

  /**
   * Get students by advisor ID
   */
  async getByAdvisor(advisorId: string, page = 0, size = 100): Promise<PageResponse<StudentDto>> {
    const response = await api.get<ApiResponse<PageResponse<StudentDto>>>(`/api/students/advisor/${advisorId}`, {
      params: { page, size }
    });
    return response.data.data;
  },

  /**
   * Assign or unassign a student's academic advisor (giao vien co van).
   * Pass advisorId = teacher id to assign, or null to remove from advisor class.
   */
  async updateAdvisor(id: string, advisorId: string | null): Promise<StudentDto> {
    const response = await api.put<ApiResponse<StudentDto>>(`/api/students/${id}/advisor`, {
      advisorId
    });
    return response.data.data;
  },

  /**
   * Phân nhiều sinh viên vào một lớp cố vấn cùng lúc (gán GV cố vấn + mã lớp cohort).
   * @returns số sinh viên đã cập nhật
   */
  async bulkAssign(studentIds: string[], advisorId: string | null, lopHanhChinh?: string): Promise<number> {
    const response = await api.put<ApiResponse<number>>('/api/students/bulk-assign', {
      studentIds,
      advisorId,
      lopHanhChinh: lopHanhChinh || undefined,
    });
    return response.data.data;
  }
};

export default studentService;
