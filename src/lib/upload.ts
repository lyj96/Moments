import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { UploadResponse, UploadConfig } from './types';
import { Client } from '@notionhq/client';

// 配置
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
const ALLOWED_IMAGE_EXTENSIONS = (process.env.ALLOWED_IMAGE_EXTENSIONS || 'jpg,jpeg,png,gif,webp').split(',');
const ALLOWED_VIDEO_EXTENSIONS = (process.env.ALLOWED_VIDEO_EXTENSIONS || 'mp4,mov,avi,mkv').split(',');

// 新增：Notion上传配置
const UPLOAD_TO_NOTION = process.env.UPLOAD_TO_NOTION === 'true';

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isAllowedImage(filename: string): boolean {
  return ALLOWED_IMAGE_EXTENSIONS.includes(getFileExtension(filename));
}

export function isAllowedVideo(filename: string): boolean {
  return ALLOWED_VIDEO_EXTENSIONS.includes(getFileExtension(filename));
}

export async function ensureUploadDirs(): Promise<void> {
  const imagesDir = path.join(UPLOAD_DIR, 'images');
  const videosDir = path.join(UPLOAD_DIR, 'videos');
  
  await fs.mkdir(imagesDir, { recursive: true });
  await fs.mkdir(videosDir, { recursive: true });
}

// 新增：Notion文件上传服务 - 使用官方File Upload API
export class NotionFileUploader {
  private notion: Client;
  private notionApiKey: string;

  constructor() {
    const apiKey = process.env.NOTION_API_KEY;
    
    if (!apiKey) {
      throw new Error('请确保已设置 NOTION_API_KEY 环境变量');
    }
    
    this.notion = new Client({ auth: apiKey });
    this.notionApiKey = apiKey;
  }

  async uploadFile(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<string> {
    try {
      console.log(`开始上传文件: ${originalFilename}, 大小: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      const fileSizeMB = fileBuffer.length / 1024 / 1024;
      
      // 如果文件大于20MB，使用分片上传
      if (fileSizeMB > 20) {
        return await this.uploadLargeFile(fileBuffer, originalFilename, mimeType);
      }
      
      // 小文件直接上传
      return await this.uploadSmallFile(fileBuffer, originalFilename, mimeType);
    } catch (error) {
      console.error('Notion文件上传失败:', error);
      throw error;
    }
  }

  private async uploadSmallFile(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<string> {
    // 步骤1: 创建文件上传对象
    const fileUploadResponse = await fetch('https://api.notion.com/v1/file_uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filename: originalFilename,
        content_type: mimeType
      })
    });

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      throw new Error(`创建文件上传对象失败: ${fileUploadResponse.status} - ${errorText}`);
    }

    const fileUploadData = await fileUploadResponse.json();
    const { id: fileUploadId, upload_url } = fileUploadData;
    
    console.log(`文件上传对象创建成功, ID: ${fileUploadId}`);

    // 步骤2: 上传文件内容
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { type: mimeType }), originalFilename);

    const uploadResponse = await fetch(upload_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.notionApiKey}`,
        'Notion-Version': '2022-06-28'
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`文件上传失败: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log(`文件上传成功, 状态: ${uploadResult.status}`);

    return fileUploadId;
  }

  private async uploadLargeFile(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<string> {
    console.log(`检测到大文件 (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)，使用分片上传`);
    
    // 步骤1: 开始分片上传
    const startResponse = await fetch('https://api.notion.com/v1/file_uploads/multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filename: originalFilename,
        content_type: mimeType,
        content_length: fileBuffer.length
      })
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`开始分片上传失败: ${startResponse.status} - ${errorText}`);
    }

    const startData = await startResponse.json();
    const { id: fileUploadId, upload_urls } = startData;
    
    console.log(`分片上传开始, ID: ${fileUploadId}, 分片数: ${upload_urls.length}`);

    // 步骤2: 上传所有分片
    const chunkSize = Math.ceil(fileBuffer.length / upload_urls.length);
    const uploadPromises = upload_urls.map(async (uploadUrl: string, index: number) => {
      const start = index * chunkSize;
      const end = Math.min(start + chunkSize, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);

      const formData = new FormData();
      formData.append('file', new Blob([chunk], { type: mimeType }), `${originalFilename}_part_${index}`);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiKey}`,
          'Notion-Version': '2022-06-28'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`分片 ${index} 上传失败: ${response.status} - ${errorText}`);
      }

      console.log(`分片 ${index + 1}/${upload_urls.length} 上传完成`);
      return response.json();
    });

    await Promise.all(uploadPromises);

    // 步骤3: 完成分片上传
    const completeResponse = await fetch(`https://api.notion.com/v1/file_uploads/multipart/${fileUploadId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      throw new Error(`完成分片上传失败: ${completeResponse.status} - ${errorText}`);
    }

    const completeData = await completeResponse.json();
    console.log(`大文件上传完成, 状态: ${completeData.status}`);

    return fileUploadId;
  }

  // 将上传的文件附加到页面的方法
  async attachFileToPage(pageId: string, fileUploadId: string, originalFilename: string, isImage: boolean = false): Promise<void> {
    try {
      const blockType = isImage ? 'image' : 'file';
      const blockData = isImage 
        ? {
            type: 'image',
            image: {
              type: 'file_upload',
              file_upload: {
                id: fileUploadId
              },
              caption: [
                {
                  type: 'text',
                  text: {
                    content: originalFilename
                  }
                }
              ]
            }
          }
        : {
            type: 'file',
            file: {
              type: 'file_upload',
              file_upload: {
                id: fileUploadId
              },
              caption: [
                {
                  type: 'text',
                  text: {
                    content: originalFilename
                  }
                }
              ]
            }
          };

      await this.notion.blocks.children.append({
        block_id: pageId,
        children: [blockData as any]
      });

      console.log(`文件已附加到页面: ${pageId}`);
    } catch (error) {
      console.error('附加文件到页面失败:', error);
      throw error;
    }
  }
}

// 修改保存文件函数，支持Notion上传
export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  subfolder: string
): Promise<UploadResponse> {
  // 检查文件大小（本地上传时才检查）
  if (!UPLOAD_TO_NOTION && fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`文件太大，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const fileExtension = getFileExtension(originalFilename);
  const isImage = isAllowedImage(originalFilename);
  const isVideo = isAllowedVideo(originalFilename);

  if (!isImage && !isVideo) {
    throw new Error('不支持的文件格式');
  }

  let url: string;
  let width: number | undefined;
  let height: number | undefined;

  // 如果是图片，获取尺寸信息
  if (isImage) {
    try {
      const metadata = await sharp(fileBuffer).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (error) {
      throw new Error('无效的图片文件');
    }
  }

  let previewUrl: string | undefined;

  if (UPLOAD_TO_NOTION) {
    // 上传到Notion
    const uploader = new NotionFileUploader();
    const mimeType = isImage 
      ? `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
      : `video/${fileExtension}`;
    
    // 获取文件上传ID
    const fileUploadId = await uploader.uploadFile(fileBuffer, originalFilename, mimeType);
    
    // 返回一个特殊的URL格式，包含文件上传ID（用于保存到数据库）
    url = `notion-file-upload://${fileUploadId}?filename=${encodeURIComponent(originalFilename)}&type=${isImage ? 'image' : 'video'}`;
    
    // 创建base64 data URL用于前端预览
    previewUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  } else {
    // 本地保存
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    await ensureUploadDirs();
    
    const saveDir = path.join(UPLOAD_DIR, subfolder);
    const filePath = path.join(saveDir, uniqueFilename);
    
    await fs.writeFile(filePath, fileBuffer);
    url = `/uploads/${subfolder}/${uniqueFilename}`;
  }

  return {
    url,
    filename: originalFilename,
    size: fileBuffer.length,
    width,
    height,
    type: subfolder === 'images' ? 'image' : 'video',
    previewUrl,
  };
}

export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  try {
    // 从URL中提取文件路径
    const urlPath = fileUrl.startsWith('/uploads/') ? fileUrl.substring('/uploads/'.length) : fileUrl;
    const filePath = path.join(UPLOAD_DIR, urlPath);
    
    // 检查文件是否存在
    await fs.access(filePath);
    
    // 删除文件
    await fs.unlink(filePath);
    
    return true;
  } catch (error) {
    return false;
  }
}

export function getUploadConfig(): UploadConfig {
  return {
    maxFileSize: UPLOAD_TO_NOTION ? -1 : MAX_FILE_SIZE, // -1 表示无限制
    allowedImageExtensions: ALLOWED_IMAGE_EXTENSIONS,
    allowedVideoExtensions: ALLOWED_VIDEO_EXTENSIONS,
    uploadToNotion: UPLOAD_TO_NOTION,
  };
} 