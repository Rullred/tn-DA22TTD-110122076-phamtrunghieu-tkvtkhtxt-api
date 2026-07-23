import { api } from './api';
import { ApiResponse } from './studentService';

export type AuthorRole = 'GIANG_VIEN' | 'SINH_VIEN';

export interface ForumReplyDto {
  id: string;
  threadId: string;
  content: string;
  authorId?: string | null;
  authorName?: string | null;
  authorRole?: AuthorRole | string | null;
  createdAt: string;
}

export interface ForumThreadDto {
  id: string;
  classId: string;
  title: string;
  content?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  authorRole?: AuthorRole | string | null;
  createdAt: string;
  replyCount?: number;
  replies?: ForumReplyDto[];
}

export interface CreateThreadRequest {
  title: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  authorRole?: AuthorRole;
}

export interface CreateReplyRequest {
  content: string;
  authorId?: string;
  authorName?: string;
  authorRole?: AuthorRole;
}

export const forumService = {
  async listThreads(classId: string): Promise<ForumThreadDto[]> {
    const res = await api.get<ApiResponse<ForumThreadDto[]>>(`/api/forum/class/${classId}/threads`);
    return res.data.data;
  },
  async createThread(classId: string, data: CreateThreadRequest): Promise<ForumThreadDto> {
    const res = await api.post<ApiResponse<ForumThreadDto>>(`/api/forum/class/${classId}/threads`, data);
    return res.data.data;
  },
  async getThread(threadId: string): Promise<ForumThreadDto> {
    const res = await api.get<ApiResponse<ForumThreadDto>>(`/api/forum/threads/${threadId}`);
    return res.data.data;
  },
  async addReply(threadId: string, data: CreateReplyRequest): Promise<ForumReplyDto> {
    const res = await api.post<ApiResponse<ForumReplyDto>>(`/api/forum/threads/${threadId}/replies`, data);
    return res.data.data;
  },
  async deleteThread(threadId: string): Promise<void> {
    await api.delete(`/api/forum/threads/${threadId}`);
  },
  async deleteReply(replyId: string): Promise<void> {
    await api.delete(`/api/forum/replies/${replyId}`);
  },
};

export default forumService;
