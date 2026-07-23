import { api } from './api';
import { ApiResponse } from './studentService';

export interface AdminNotification {
  at: string;
  type: string;      // SUBJECT_APPROVAL | ACCOUNT_PENDING | ATTACK | ABNORMAL_TRAFFIC | SECURITY | SYSTEM
  severity: string;  // LOW | MEDIUM | HIGH | CRITICAL
  actor: string;
  link: string;
  message: string;
  read: boolean;
}

export const notificationService = {
  /** Danh sách thông báo + số chưa đọc. */
  async list(limit = 50): Promise<{ notifications: AdminNotification[]; unreadCount: number }> {
    const res = await api.get<ApiResponse<{ notifications: AdminNotification[]; unreadCount: number }>>(
      '/api/admin/notifications', { params: { limit } });
    const d = res.data.data || ({} as any);
    return { notifications: d.notifications || [], unreadCount: d.unreadCount || 0 };
  },

  /** Đánh dấu tất cả đã đọc. */
  async markAllRead(): Promise<void> {
    await api.post('/api/admin/notifications/read-all');
  },
};

export default notificationService;
