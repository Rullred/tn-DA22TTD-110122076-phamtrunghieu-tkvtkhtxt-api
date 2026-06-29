import { api } from './api';
import { ApiResponse } from './studentService';

export interface BlockedIpDto {
  ip: string;
  blockedAt?: string;
  reason?: string;
}

export interface BlockedIpsResponse {
  blockedIps: string[];
  totalCount: number;
}

export const adminService = {
  /**
   * Get all blocked IPs
   */
  async getBlockedIps(): Promise<BlockedIpsResponse> {
    const response = await api.get<ApiResponse<{ blockedIps: string[]; totalCount: number }>>('/api/admin/blocked-ips');
    // Map set to array
    return {
      blockedIps: response.data.data.blockedIps || [],
      totalCount: response.data.data.totalCount || 0
    };
  },

  /**
   * Get blocked IP details
   */
  async getBlockedIpInfo(ip: string): Promise<BlockedIpDto | null> {
    try {
      const response = await api.get<ApiResponse<BlockedIpDto>>(`/api/admin/blocked-ips/${ip}`);
      return response.data.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  /**
   * Unblock an IP address
   */
  async unblockIp(ip: string): Promise<void> {
    await api.delete(`/api/admin/blocked-ips/${ip}`);
  },

  /**
   * Manually block an IP address
   */
  async blockIp(ip: string, reason = 'Chặn thủ công bởi Admin'): Promise<void> {
    await api.post('/api/admin/blocked-ips', null, {
      params: { ip, reason }
    });
  },

  /**
   * Clear all blocked IPs
   */
  async clearAllBlockedIps(): Promise<void> {
    await api.delete('/api/admin/blocked-ips');
  }
};

export default adminService;
