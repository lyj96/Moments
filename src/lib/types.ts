export enum MomentStatus {
  FLASH = "闪念",
  TODO = "待办", 
  IN_PROGRESS = "进行中",
  COMPLETED = "已完成"
}

export interface MomentCreate {
  title: string;
  content: string;
  tags?: string[];
  status?: MomentStatus;
  images?: string[];
  videos?: string[];
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

export interface MomentResponse {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: string;
  images: string[];
  videos: string[];
  created_time: string;
  last_edited_time: string;
  url: string;
  favorited?: boolean;
}

export interface MomentList {
  moments: MomentResponse[];
  total: number;
  has_more: boolean;
  next_cursor?: string;
}

export interface TagResponse {
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
  type: string;
  previewUrl?: string;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedImageExtensions: string[];
  allowedVideoExtensions: string[];
  uploadToNotion?: boolean;
} 