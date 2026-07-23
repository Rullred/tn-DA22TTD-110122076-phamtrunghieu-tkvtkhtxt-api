import { api } from './api';
import { ApiResponse } from './studentService';

export interface BlockedIpDetail {
  ip: string;
  blockedAt?: string;
  blockedBy?: string;
  reason?: string;
  durationMinutes?: number;
  permanent?: boolean;
  expiresAt?: string | null;
}

// Alias tương thích ngược
export type BlockedIpDto = BlockedIpDetail;

export interface BlockHistoryEntry {
  at: string;
  action: string; // BLOCK | UNBLOCK | EDIT | CLEAR_ALL
  ip: string;
  actor: string;
  reason: string;
}

export interface BlockedIpsResponse {
  blockedIps: string[];
  blockedIpsDetailed: BlockedIpDetail[];
  totalCount: number;
  recentlyBlocked: BlockedIpDetail[];
}

export const adminService = {
  /** Danh sách IP bị chặn (kèm chi tiết + gần đây). */
  async getBlockedIps(): Promise<BlockedIpsResponse> {
    const response = await api.get<ApiResponse<any>>('/api/admin/blocked-ips');
    const d = response.data.data || {};
    return {
      blockedIps: d.blockedIps || [],
      blockedIpsDetailed: d.blockedIpsDetailed || [],
      totalCount: d.totalCount || 0,
      recentlyBlocked: d.recentlyBlocked || [],
    };
  },

  /** Lịch sử các lần chặn / mở chặn. */
  async getBlockHistory(limit = 100): Promise<BlockHistoryEntry[]> {
    const response = await api.get<ApiResponse<BlockHistoryEntry[]>>('/api/admin/blocked-ips/history', { params: { limit } });
    return response.data.data || [];
  },

  /** Chi tiết một IP bị chặn. */
  async getBlockedIpInfo(ip: string): Promise<BlockedIpDetail | null> {
    try {
      const response = await api.get<ApiResponse<BlockedIpDetail>>(`/api/admin/blocked-ips/${ip}`);
      return response.data.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  /** Mở chặn một IP. */
  async unblockIp(ip: string): Promise<void> {
    await api.delete(`/api/admin/blocked-ips/${ip}`);
  },

  /** Chặn IP thủ công (kèm người chặn + thời hạn phút; 0 = vĩnh viễn). */
  async blockIp(ip: string, reason = 'Chặn thủ công bởi Admin', blockedBy = 'ADMIN', durationMinutes = 0): Promise<void> {
    await api.post('/api/admin/blocked-ips', null, { params: { ip, reason, blockedBy, durationMinutes } });
  },

  /** Sửa lý do / thời hạn chặn của một IP. */
  async editBlock(ip: string, reason: string, durationMinutes = 0): Promise<void> {
    await api.put(`/api/admin/blocked-ips/${ip}`, null, { params: { reason, durationMinutes } });
  },

  /** Xóa toàn bộ IP bị chặn. */
  async clearAllBlockedIps(): Promise<void> {
    await api.delete('/api/admin/blocked-ips');
  },
};

export default adminService;
