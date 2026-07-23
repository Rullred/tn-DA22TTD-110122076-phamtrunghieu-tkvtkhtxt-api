import { api } from './api';
import { ApiResponse } from './studentService';

export interface CurriculumDto {
  id: string;
  nganh: string;
  hocKy: number;
  maMonHoc: string;
  tenMonHoc: string;
  soTinChi: number;
  chuyenNganh?: string | null;
  monBatBuoc?: boolean | null;
  tongTiet?: number | null;
  lyThuyet?: number | null;
  thucHanh?: number | null;
}

export interface CurriculumRequest {
  nganh: string;
  hocKy: number;
  maMonHoc: string;
  tenMonHoc: string;
  soTinChi: number;
  chuyenNganh?: string | null;
  monBatBuoc?: boolean | null;
  tongTiet?: number | null;
  lyThuyet?: number | null;
  thucHanh?: number | null;
}

export type ProgressStatus = 'DA_HOC' | 'DANG_HOC' | 'ROT_F' | 'NO_MON';

export interface ProgressItem {
  maMonHoc: string;
  tenMonHoc: string;
  soTinChi: number;
  batBuoc: boolean;
  status: ProgressStatus;
  diemChu: string | null;
  diemTongKet10: number | null;
  diemTongKet4: number | null;
}

export interface AcademicProgressDto {
  nganh: string | null;
  namHoc: string | null;
  hocKy: number | null;
  items: ProgressItem[];
  tinChiDat: number;
  tinChiNo: number;
  soMonNo: number;
  soMonRot: number;
  gpaHocKy: number | null;
}

export const curriculumService = {
  /**
   * List curriculum subjects, optionally filtered by ngành and/or học kỳ.
   */
  async getAll(nganh?: string, hocKy?: number): Promise<CurriculumDto[]> {
    const response = await api.get<ApiResponse<CurriculumDto[]>>('/api/curriculum', {
      params: { nganh: nganh || undefined, hocKy: hocKy ?? undefined },
    });
    return response.data.data;
  },

  async create(data: CurriculumRequest): Promise<CurriculumDto> {
    const response = await api.post<ApiResponse<CurriculumDto>>('/api/curriculum', data);
    return response.data.data;
  },

  async update(id: string, data: CurriculumRequest): Promise<CurriculumDto> {
    const response = await api.put<ApiResponse<CurriculumDto>>(`/api/curriculum/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/curriculum/${id}`);
  },

  /**
   * Tiến độ học tập của sinh viên trong một học kỳ (đối chiếu chương trình khung).
   */
  async getAcademicProgress(studentId: string, namHoc?: string, hocKy?: number): Promise<AcademicProgressDto> {
    const response = await api.get<ApiResponse<AcademicProgressDto>>(`/api/students/${studentId}/academic-progress`, {
      params: { namHoc: namHoc || undefined, hocKy: hocKy ?? undefined },
    });
    return response.data.data;
  },
};

export default curriculumService;
