import axios from 'axios';
import { Moment, MomentCreate, MomentUpdate, MomentList, Tag, UploadResponse, UploadConfig, FilterOptions } from '@/types';

// 改为使用本地API路由
const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

// Moments API
export const momentsApi = {
  // 获取动态列表 - 支持筛选
  async getMoments(pageSize = 10, cursor?: string, filters?: FilterOptions): Promise<MomentList> {
    const params = new URLSearchParams();
    params.append('page_size', pageSize.toString());
    if (cursor) params.append('cursor', cursor);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tag) params.append('tag', filters.tag);  
    if (filters?.favorited !== undefined) params.append('favorited', filters.favorited.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/api/moments?${params}`);
    return response.data;
  },

  // 获取单个动态
  async getMoment(id: string): Promise<Moment> {
    const response = await api.get(`/api/moments/${id}`);
    return response.data;
  },

  // 创建动态
  async createMoment(data: MomentCreate): Promise<Moment> {
    const response = await api.post('/api/moments', data);
    return response.data;
  },

  // 更新动态
  async updateMoment(id: string, data: MomentUpdate): Promise<Moment> {
    const response = await api.put(`/api/moments/${id}`, data);
    return response.data;
  },

  // 删除动态
  async deleteMoment(id: string): Promise<void> {
    await api.delete(`/api/moments/${id}`);
  },

  // 收藏/取消收藏动态
  async toggleFavorite(id: string): Promise<Moment> {
    const response = await api.patch(`/api/moments/${id}/favorite`);
    return response.data;
  },

  // 搜索动态
  async searchMoments(query: string): Promise<Moment[]> {
    const response = await api.get(`/api/moments/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // 根据状态筛选
  async getMomentsByStatus(status: string): Promise<Moment[]> {
    const response = await api.get(`/api/moments/filter/status/${encodeURIComponent(status)}`);
    return response.data;
  },

  // 根据标签筛选
  async getMomentsByTag(tag: string): Promise<Moment[]> {
    const response = await api.get(`/api/moments/filter/tag/${encodeURIComponent(tag)}`);
    return response.data;
  },

  // 获取收藏的动态
  async getFavoritedMoments(): Promise<Moment[]> {
    const response = await api.get('/api/moments/filter/favorited');
    return response.data;
  },

  // 获取标签列表
  async getTags(): Promise<Tag[]> {
    const response = await api.get('/api/moments/tags');
    return response.data;
  },
};

// Upload API
export const uploadApi = {
  // 上传单张图片
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 批量上传图片
  async uploadImages(files: File[]): Promise<{ files: UploadResponse[]; total: number }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await api.post('/api/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 上传视频
  async uploadVideo(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 删除文件
  async deleteFile(fileUrl: string): Promise<void> {
    const formData = new FormData();
    formData.append('file_url', fileUrl);
    
    await api.delete('/api/upload/file', {
      data: formData,
    });
  },

  // 获取上传配置
  async getUploadConfig(): Promise<UploadConfig> {
    const response = await api.get('/api/upload/info');
    return response.data;
  },
};

// 健康检查
export const healthApi = {
  async checkHealth(): Promise<any> {
    const response = await api.get('/api/health');
    return response.data;
  },
};

export default api; 