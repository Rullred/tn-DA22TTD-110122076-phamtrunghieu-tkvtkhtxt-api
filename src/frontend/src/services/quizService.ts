import { api } from './api';
import { ApiResponse } from './studentService';

export type QuizStatus = 'NHAP' | 'DA_XUAT_BAN' | 'DONG';

export interface QuizChoiceDto {
  id?: string;
  content: string;
  correct?: boolean;   // ẩn (undefined) khi SV làm bài
  orderIndex?: number;
}

export interface QuizQuestionDto {
  id?: string;
  content: string;
  orderIndex?: number;
  enabled?: boolean;
  needsReview?: boolean; // parser không xác định được đáp án -> GV cần chọn lại
  choices: QuizChoiceDto[];
}

export interface QuizDto {
  id: string;
  classId: string;
  teacherId?: string | null;
  title: string;
  description?: string | null;
  questionsPerAttempt?: number | null;
  timeLimitMinutes?: number | null;
  maxScore?: number | null;
  status: QuizStatus;
  className?: string | null;
  totalQuestions?: number;
  enabledQuestions?: number;
  questions?: QuizQuestionDto[];
}

export interface CreateQuizRequest {
  classId: string;
  teacherId?: string;
  title: string;
  description?: string;
  questionsPerAttempt?: number | null;
  timeLimitMinutes?: number | null;
  maxScore?: number | null;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  questionsPerAttempt?: number | null;
  timeLimitMinutes?: number | null;
  maxScore?: number | null;
  status?: QuizStatus;
}

export interface UpsertQuestionRequest {
  content: string;
  enabled?: boolean;
  choices: { content: string; correct: boolean }[];
}

export interface StartAttemptResponse {
  attemptId: string;
  quizId: string;
  title: string;
  timeLimitMinutes?: number | null;
  maxScore?: number | null;
  questionCount: number;
  questions: QuizQuestionDto[];
}

export interface SubmitAttemptRequest {
  answers: { questionId: string; choiceId: string | null }[];
}

export interface AttemptResultDto {
  attemptId?: string;
  score: number;
  correctCount: number;
  questionCount: number;
  maxScore: number;
  bestScore?: number;
}

export interface QuizResultRowDto {
  studentId: string;
  studentName: string;
  studentCode: string;
  attemptCount: number;
  bestScore: number | null;
}

export interface StudentQuizDto {
  quizId: string;
  classId: string;
  className?: string | null;
  title: string;
  description?: string | null;
  questionsPerAttempt?: number | null;
  enabledQuestions?: number | null;
  timeLimitMinutes?: number | null;
  maxScore?: number | null;
  bestScore?: number | null;
  attemptCount?: number | null;
}

export const quizService = {
  // ---- Teacher ----
  async listByClass(classId: string): Promise<QuizDto[]> {
    const res = await api.get<ApiResponse<QuizDto[]>>(`/api/quizzes/class/${classId}`);
    return res.data.data;
  },

  async get(quizId: string): Promise<QuizDto> {
    const res = await api.get<ApiResponse<QuizDto>>(`/api/quizzes/${quizId}`);
    return res.data.data;
  },

  async create(data: CreateQuizRequest): Promise<QuizDto> {
    const res = await api.post<ApiResponse<QuizDto>>('/api/quizzes', data);
    return res.data.data;
  },

  async update(quizId: string, data: UpdateQuizRequest): Promise<QuizDto> {
    const res = await api.put<ApiResponse<QuizDto>>(`/api/quizzes/${quizId}`, data);
    return res.data.data;
  },

  async remove(quizId: string): Promise<void> {
    await api.delete(`/api/quizzes/${quizId}`);
  },

  async parseQuestions(quizId: string, text: string, replace = true): Promise<QuizDto> {
    const res = await api.post<ApiResponse<QuizDto>>(`/api/quizzes/${quizId}/questions/parse`, { text, replace });
    return res.data.data;
  },

  async addQuestion(quizId: string, data: UpsertQuestionRequest): Promise<QuizQuestionDto> {
    const res = await api.post<ApiResponse<QuizQuestionDto>>(`/api/quizzes/${quizId}/questions`, data);
    return res.data.data;
  },

  async updateQuestion(questionId: string, data: UpsertQuestionRequest): Promise<QuizQuestionDto> {
    const res = await api.put<ApiResponse<QuizQuestionDto>>(`/api/quizzes/questions/${questionId}`, data);
    return res.data.data;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await api.delete(`/api/quizzes/questions/${questionId}`);
  },

  async getResults(quizId: string): Promise<QuizResultRowDto[]> {
    const res = await api.get<ApiResponse<QuizResultRowDto[]>>(`/api/quizzes/${quizId}/results`);
    return res.data.data;
  },

  async exportGrades(quizId: string): Promise<number> {
    const res = await api.post<ApiResponse<number>>(`/api/quizzes/${quizId}/export-grades`);
    return res.data.data;
  },

  // ---- Student ----
  async getStudentQuizzes(studentId: string): Promise<StudentQuizDto[]> {
    const res = await api.get<ApiResponse<StudentQuizDto[]>>(`/api/quizzes/student/${studentId}`);
    return res.data.data;
  },

  async startAttempt(quizId: string, studentId: string): Promise<StartAttemptResponse> {
    const res = await api.post<ApiResponse<StartAttemptResponse>>(
      `/api/quizzes/${quizId}/attempts/start`, null, { params: { studentId } });
    return res.data.data;
  },

  async submitAttempt(attemptId: string, data: SubmitAttemptRequest): Promise<AttemptResultDto> {
    const res = await api.post<ApiResponse<AttemptResultDto>>(`/api/quizzes/attempts/${attemptId}/submit`, data);
    return res.data.data;
  },

  async getStudentAttempts(quizId: string, studentId: string): Promise<AttemptResultDto[]> {
    const res = await api.get<ApiResponse<AttemptResultDto[]>>(
      `/api/quizzes/${quizId}/attempts`, { params: { studentId } });
    return res.data.data;
  },
};

export default quizService;
