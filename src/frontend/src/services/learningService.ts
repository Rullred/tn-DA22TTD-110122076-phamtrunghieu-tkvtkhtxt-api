import { api } from './api';
import { ApiResponse } from './studentService';

export type ItemType = 'TAI_LIEU' | 'BAI_TAP';

export interface LearningFileDto {
  id: string;
  fileName: string;
  contentType?: string | null;
  size?: number | null;
  externalLink?: string | null;
  link: boolean;
}

export interface SubmissionDto {
  id: string;
  itemId: string;
  studentId: string;
  studentName?: string | null;
  studentCode?: string | null;
  fileName: string;
  contentType?: string | null;
  size?: number | null;
  submittedAt: string;
  late?: boolean | null;
  grade?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
}

export interface LearningItemDto {
  id: string;
  classId: string;
  type: ItemType;
  title: string;
  description?: string | null;
  orderIndex?: number;
  visible?: boolean;
  dueDate?: string | null;
  maxScore?: number | null;
  files?: LearningFileDto[];
  submissionCount?: number;      // GV
  mySubmission?: SubmissionDto;  // SV
  completed?: boolean;           // SV: mục đã hoàn thành chưa
}

export interface ProgressDto {
  total: number;
  completed: number;
  percent: number;
  materialsDone: number;
  materialsTotal: number;
  assignmentsDone: number;
  assignmentsTotal: number;
  quizzesDone: number;
  quizzesTotal: number;
}

export interface CreateItemRequest {
  type: ItemType;
  title: string;
  description?: string;
  visible?: boolean;
  dueDate?: string | null;
  maxScore?: number | null;
}

export interface UpdateItemRequest {
  title?: string;
  description?: string;
  visible?: boolean;
  orderIndex?: number;
  dueDate?: string | null;
  maxScore?: number | null;
}

export interface GradeSubmissionRequest {
  grade?: number | null;
  feedback?: string;
  teacherId?: string;
}

// Tải blob (giữ auth token qua axios) rồi kích hoạt tải xuống trong trình duyệt.
async function downloadBlob(url: string, fallbackName: string) {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data]);
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = fallbackName || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export const learningService = {
  // ---- Teacher: items ----
  async teacherItems(classId: string): Promise<LearningItemDto[]> {
    const res = await api.get<ApiResponse<LearningItemDto[]>>(`/api/learning/class/${classId}/items`);
    return res.data.data;
  },
  async createItem(classId: string, data: CreateItemRequest): Promise<LearningItemDto> {
    const res = await api.post<ApiResponse<LearningItemDto>>(`/api/learning/class/${classId}/items`, data);
    return res.data.data;
  },
  async updateItem(itemId: string, data: UpdateItemRequest): Promise<LearningItemDto> {
    const res = await api.put<ApiResponse<LearningItemDto>>(`/api/learning/items/${itemId}`, data);
    return res.data.data;
  },
  async deleteItem(itemId: string): Promise<void> {
    await api.delete(`/api/learning/items/${itemId}`);
  },

  // ---- Teacher: attachments ----
  async attachFile(itemId: string, file: File): Promise<LearningFileDto> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post<ApiResponse<LearningFileDto>>(`/api/learning/items/${itemId}/files`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  async attachLink(itemId: string, url: string, title?: string): Promise<LearningFileDto> {
    const res = await api.post<ApiResponse<LearningFileDto>>(`/api/learning/items/${itemId}/link`, { url, title });
    return res.data.data;
  },
  async removeFile(fileId: string): Promise<void> {
    await api.delete(`/api/learning/files/${fileId}`);
  },

  // ---- Teacher: submissions ----
  async itemSubmissions(itemId: string): Promise<SubmissionDto[]> {
    const res = await api.get<ApiResponse<SubmissionDto[]>>(`/api/learning/items/${itemId}/submissions`);
    return res.data.data;
  },
  async gradeSubmission(subId: string, data: GradeSubmissionRequest): Promise<SubmissionDto> {
    const res = await api.put<ApiResponse<SubmissionDto>>(`/api/learning/submissions/${subId}/grade`, data);
    return res.data.data;
  },

  // ---- Student ----
  async studentItems(studentId: string, classId: string): Promise<LearningItemDto[]> {
    const res = await api.get<ApiResponse<LearningItemDto[]>>(`/api/learning/student/${studentId}/class/${classId}/items`);
    return res.data.data;
  },
  async submit(itemId: string, studentId: string, file: File): Promise<SubmissionDto> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post<ApiResponse<SubmissionDto>>(`/api/learning/items/${itemId}/submit`, fd, {
      params: { studentId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  async getProgress(studentId: string, classId: string): Promise<ProgressDto> {
    const res = await api.get<ApiResponse<ProgressDto>>(`/api/learning/student/${studentId}/class/${classId}/progress`);
    return res.data.data;
  },
  async markComplete(itemId: string, studentId: string): Promise<void> {
    await api.post(`/api/learning/items/${itemId}/complete`, null, { params: { studentId } });
  },
  async unmarkComplete(itemId: string, studentId: string): Promise<void> {
    await api.delete(`/api/learning/items/${itemId}/complete`, { params: { studentId } });
  },

  // ---- Downloads ----
  async downloadFile(f: LearningFileDto): Promise<void> {
    if (f.link && f.externalLink) {
      window.open(f.externalLink, '_blank', 'noopener');
      return;
    }
    await downloadBlob(`/api/learning/files/${f.id}/download`, f.fileName);
  },
  async downloadSubmission(sub: SubmissionDto): Promise<void> {
    await downloadBlob(`/api/learning/submissions/${sub.id}/download`, sub.fileName);
  },
};

export default learningService;
