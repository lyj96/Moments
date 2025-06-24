export interface Moment {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: MomentStatus;
  images: string[];
  videos: string[];
  created_time: string;
  last_edited_time: string;
  url: string;
  favorited?: boolean;
}

export type MomentStatus = '闪念' | '待办' | '进行中' | '已完成';

export interface MomentCreate {
  title: string;
  content: string;
  tags: string[];
  status: MomentStatus;
  images: string[];
  videos: string[];
  favorited?: boolean;
}

export interface MomentUpdate {
  title?: string;
  content?: string;
  tags?: string[];
  status?: MomentStatus;
  images?: string[];
  videos?: string[];
  favorited?: boolean;
}

export interface MomentList {
  moments: Moment[];
  total: number;
  has_more: boolean;
  next_cursor?: string;
}

export interface Tag {
  name: string;
  count: number;
  color?: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
  type: 'image' | 'video';
  previewUrl?: string; // 用于前端预览的URL（通常是base64 data URL）
}

export interface UploadConfig {
  max_file_size: number;
  max_file_size_mb: number;
  allowed_image_extensions: string[];
  allowed_video_extensions: string[];
  max_images_per_upload: number;
  max_videos_per_upload: number;
}

export const STATUS_COLORS: Record<MomentStatus, string> = {
  '闪念': 'bg-orange-900 bg-opacity-30 text-orange-300 border-orange-700',
  '待办': 'bg-teal-900 bg-opacity-30 text-teal-300 border-teal-700',
  '进行中': 'bg-emerald-900 bg-opacity-30 text-emerald-300 border-emerald-700',
  '已完成': 'bg-emerald-900 bg-opacity-30 text-emerald-300 border-emerald-700',
};

export const STATUS_OPTIONS: MomentStatus[] = ['闪念', '待办', '进行中', '已完成'];

export interface FilterOptions {
  status?: MomentStatus;
  tag?: string;
  favorited?: boolean;
  search?: string;
}

export type FilterType = 'all' | 'favorited' | 'status' | 'tag';

// 用户配置接口
export interface UserConfig {
  // 网站信息
  siteTitle: string;
  siteSubtitle: string;
  
  // 背景设置
  headerBackgroundImage: string;
  headerBackgroundOpacity: number;
  
  // 个人信息
  userName: string;
  userAvatar: string;
  userHandle: string; // @ 后面的内容
  
  // 主题设置
  primaryColor: string;
  
  // 页脚信息
  footerText: string;
  footerLinks: Array<{
    text: string;
    url?: string;
  }>;
  
  // 其他设置
  showStats: boolean;
  defaultMomentStatus: MomentStatus;
}

// 默认配置
export const defaultConfig: UserConfig = {
  siteTitle: '我的灵感',
  siteSubtitle: '记录每一个美好瞬间',
  headerBackgroundImage: 'https://moments.randallanjie.com/upload/6zvcXDyBe9JHoxZRtLWuZK.jpeg',
  headerBackgroundOpacity: 40,
  userName: '我',
  userAvatar: '',
  userHandle: 'moments',
  primaryColor: '#14b8a6', // teal-500
  footerText: '记录生活中的每一个美好瞬间',
  footerLinks: [
    { text: '© 2024' },
    { text: '用心记录' },
    { text: '精彩生活' }
  ],
  showStats: true,
  defaultMomentStatus: '闪念'
}; 