import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) {
    return format(d, 'HH:mm', { locale: zhCN });
  }
  
  if (isYesterday(d)) {
    return `昨天 ${format(d, 'HH:mm', { locale: zhCN })}`;
  }
  
  // 如果是今年
  if (d.getFullYear() === new Date().getFullYear()) {
    return format(d, 'MM-dd HH:mm', { locale: zhCN });
  }
  
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { 
    addSuffix: true, 
    locale: zhCN 
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateImageGridClass(count: number): string {
  if (count === 0) return '';
  if (count === 1) return 'image-grid grid-1';
  if (count === 2) return 'image-grid grid-2';
  if (count === 3) return 'image-grid grid-3';
  if (count === 4) return 'image-grid grid-4';
  return 'image-grid grid-9'; // 5-9张都用3x3网格
}

export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return '不支持的图片格式，请选择 JPG、PNG、GIF 或 WebP 格式';
  }
  
  if (file.size > maxSize) {
    return '图片大小不能超过 10MB';
  }
  
  return null;
}

export function validateVideoFile(file: File): string | null {
  const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return '不支持的视频格式，请选择 MP4、MOV、AVI 或 MKV 格式';
  }
  
  if (file.size > maxSize) {
    return '视频大小不能超过 10MB';
  }
  
  return null;
}

export function buildImageUrl(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  
  // 使用相对路径，让Next.js处理静态资源
  return url.startsWith('/') ? url : `/${url}`;
} 