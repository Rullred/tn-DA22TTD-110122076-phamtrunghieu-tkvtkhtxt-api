import { api } from './api';
import { ApiResponse } from './studentService';

export type ProposalStatus = 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';

export interface TeachingProposalDto {
  id: string;
  teacherId?: string | null;
  teacherName?: string | null;
  subject: string;
  className?: string | null;
  classCode?: string | null;
  description?: string | null;
  room?: string | null;
  maxStudents?: number | null;
  schedule?: string | null;
  academicYear?: string | null;
  semester?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  status: ProposalStatus;
  rejectionReason?: string | null;
  classId?: string | null;
  createdAt: string;
}

export interface CreateProposalRequest {
  teacherId?: string;
  teacherName?: string;
  subject: string;
  className?: string;
  classCode?: string;
  description?: string;
  room?: string;
  maxStudents?: number;
  schedule?: string;
  academicYear?: string;
  semester?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export const proposalService = {
  async list(status?: ProposalStatus): Promise<TeachingProposalDto[]> {
    const res = await api.get<ApiResponse<TeachingProposalDto[]>>('/api/proposals', {
      params: { status: status || undefined },
    });
    return res.data.data;
  },
  async byTeacher(teacherId: string): Promise<TeachingProposalDto[]> {
    const res = await api.get<ApiResponse<TeachingProposalDto[]>>(`/api/proposals/teacher/${teacherId}`);
    return res.data.data;
  },
  async create(data: CreateProposalRequest): Promise<TeachingProposalDto> {
    const res = await api.post<ApiResponse<TeachingProposalDto>>('/api/proposals', data);
    return res.data.data;
  },
  async approve(id: string): Promise<TeachingProposalDto> {
    const res = await api.post<ApiResponse<TeachingProposalDto>>(`/api/proposals/${id}/approve`);
    return res.data.data;
  },
  async reject(id: string, reason?: string): Promise<TeachingProposalDto> {
    const res = await api.post<ApiResponse<TeachingProposalDto>>(`/api/proposals/${id}/reject`, { reason });
    return res.data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/api/proposals/${id}`);
  },
};

export default proposalService;
