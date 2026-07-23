import { api } from './api';
import { PageResponse, ApiResponse } from './studentService';

export interface TeacherDto {
  id: string;
  teacherCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  avatarUrl: string | null;
  department: string;
  specialization: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  hireDate: string;
}

export interface CreateTeacherRequest {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  department: string;
  specialization?: string;
  hireDate: string;
}

export interface UpdateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  department: string;
  specialization?: string;
  status: string;
}

export const teacherService = {
  /**
   * Lấy hồ sơ giáo viên của người dùng đang đăng nhập.
   * Gateway inject X-User-Id từ token; truyền thêm email để fallback.
   */
  async getMe(email?: string): Promise<TeacherDto> {
    const response = await api.get<ApiResponse<TeacherDto>>('/api/teachers/me', {
      params: { email: email || undefined }
    });
    return response.data.data;
  },

  /**
   * Get all teachers with pagination
   */
  async getAll(page = 0, size = 20, sortBy = 'id', sortDir = 'ASC'): Promise<PageResponse<TeacherDto>> {
    const response = await api.get<ApiResponse<PageResponse<TeacherDto>>>('/api/teachers', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data.data;
  },

  /**
   * Get teacher by ID
   */
  async getById(id: string): Promise<TeacherDto> {
    const response = await api.get<ApiResponse<TeacherDto>>(`/api/teachers/${id}`);
    return response.data.data;
  },

  /**
   * Get teacher by code
   */
  async getByCode(code: string): Promise<TeacherDto> {
    const response = await api.get<ApiResponse<TeacherDto>>(`/api/teachers/code/${code}`);
    return response.data.data;
  },

  /**
   * Search teachers by name
   */
  async searchByName(name: string, page = 0, size = 20): Promise<PageResponse<TeacherDto>> {
    const response = await api.get<ApiResponse<PageResponse<TeacherDto>>>('/api/teachers/search', {
      params: { name, page, size }
    });
    return response.data.data;
  },

  /**
   * Create new teacher profile
   */
  async create(data: CreateTeacherRequest): Promise<TeacherDto> {
    const response = await api.post<ApiResponse<TeacherDto>>('/api/teachers', data);
    return response.data.data;
  },

  /**
   * Update teacher profile
   */
  async update(id: string, data: UpdateTeacherRequest): Promise<TeacherDto> {
    const response = await api.put<ApiResponse<TeacherDto>>(`/api/teachers/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete teacher profile
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/teachers/${id}`);
  },

  /**
   * Upload teacher avatar
   */
  async uploadAvatar(id: string, file: File): Promise<TeacherDto> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse<TeacherDto>>(`/api/upload/teachers/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Delete teacher avatar
   */
  async deleteAvatar(id: string): Promise<TeacherDto> {
    const response = await api.delete<ApiResponse<TeacherDto>>(`/api/upload/teachers/${id}/avatar`);
    return response.data.data;
  },

  /**
   * Get total teacher count
   */
  async getCount(): Promise<number> {
    const response = await api.get<ApiResponse<number>>('/api/teachers/count');
    return response.data.data;
  }
};

export default teacherService;
