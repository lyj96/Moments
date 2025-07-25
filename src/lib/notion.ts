import { Client } from '@notionhq/client';
import { MomentCreate, MomentUpdate, MomentResponse, MomentList, TagResponse, MomentStatus } from './types';

// 工具函数：动态构建BASE_URL，完全基于请求的host
export function getBaseUrl(request?: Request): string {
  // 如果没有request对象，回退到默认值
  if (!request) {
    return 'http://localhost:3000';
  }
  
  const url = new URL(request.url);
  const protocol = url.protocol;
  const host = url.host;
  
  return `${protocol}//${host}`;
}

// 辅助函数：构建完整URL
function buildFullUrl(url: string, baseUrl?: string): string {
  if (url.startsWith('/uploads/')) {
    const currentBaseUrl = baseUrl || 'http://localhost:3000';
    return `${currentBaseUrl}${url}`;
  }
  return url;
}

export class NotionService {
  private notion: Client;
  private databaseId: string;

  constructor() {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) {
      throw new Error('请确保已设置 NOTION_API_KEY 和 NOTION_DATABASE_ID 环境变量');
    }

    this.notion = new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  async getDatabaseInfo() {
    try {
      const database = await this.notion.databases.retrieve({ database_id: this.databaseId });
      return database;
    } catch (error) {
      throw new Error(`获取数据库信息失败: ${error}`);
    }
  }

  private async parseNotionPage(page: any): Promise<MomentResponse> {
    const properties = page.properties;
    
    const title = properties.Title?.title?.[0]?.text?.content || '';
    const tags = properties.Tags?.multi_select?.map((tag: any) => tag.name) || [];
    const status = properties.Status?.select?.name || MomentStatus.FLASH;
    const favorited = properties.Favorited?.checkbox || false;
    
    // 从页面内容中获取内容
    let content = '';
    try {
      const blocks = await this.notion.blocks.children.list({
        block_id: page.id,
      });
      
      // 获取第一个段落块的内容
      if (blocks.results.length > 0) {
        const firstBlock = blocks.results[0] as any;
        if (firstBlock.type === 'paragraph' && firstBlock.paragraph?.rich_text) {
          content = firstBlock.paragraph.rich_text
            .map((text: any) => text.text?.content || '')
            .join('');
        }
      }
    } catch (error) {
      console.error('获取页面内容失败:', error);
      // 如果获取内容失败，使用标题作为内容
      content = title;
    }
    
    // 解析图片
    const images = properties.Images?.files?.map((file: any) => {
      if (file.type === 'file') {
        return file.file.url;
      } else if (file.type === 'external') {
        return file.external.url;
      }
      return '';
    }).filter(Boolean);
    
    // 解析视频
    const videos = properties.Videos?.files?.map((file: any) => {
      if (file.type === 'file') {
        return file.file.url;
      } else if (file.type === 'external') {
        return file.external.url;
      }
      return '';
    }).filter(Boolean);
    
    return {
      id: page.id,
      title,
      content,
      tags,
      status,
      images,
      videos,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      url: page.url,
      favorited,
    };
  }

  async createMoment(momentData: MomentCreate, baseUrl?: string): Promise<MomentResponse> {
    try {
      // 标题限制为20个字符，取内容的前20个字符
      const titleContent = momentData.content.slice(0, 20);
      
      const properties: any = {
        Title: {
          title: [
            {
              text: {
                content: titleContent,
              },
            },
          ],
        },
        Status: {
          select: {
            name: momentData.status || MomentStatus.FLASH,
          },
        },
        Favorited: {
          checkbox: momentData.favorited || false,
        },
      };

      // 添加标签
      if (momentData.tags && momentData.tags.length > 0) {
        properties.Tags = {
          multi_select: momentData.tags.map(tag => ({ name: tag })),
        };
      }

      // 添加图片
      if (momentData.images && momentData.images.length > 0) {
        const filesList = momentData.images.map(url => {
          if (url.startsWith('notion-file-upload://')) {
            // 处理Notion文件上传URL
            const urlObj = new URL(url);
            const fileUploadId = urlObj.hostname;
            const filename = urlObj.searchParams.get('filename') || 'image';
            
            return {
              type: 'file_upload',
              file_upload: { id: fileUploadId },
              name: filename,
            };
          } else {
            // 处理外部URL
            return {
              name: url.split('/').pop() || 'image',
              external: { url: buildFullUrl(url, baseUrl) },
            };
          }
        });
        
        properties.Images = { files: filesList };
      }

      // 添加视频
      if (momentData.videos && momentData.videos.length > 0) {
        const filesList = momentData.videos.map(url => {
          if (url.startsWith('notion-file-upload://')) {
            // 处理Notion文件上传URL
            const urlObj = new URL(url);
            const fileUploadId = urlObj.hostname;
            const filename = urlObj.searchParams.get('filename') || 'video';
            
            return {
              type: 'file_upload',
              file_upload: { id: fileUploadId },
              name: filename,
            };
          } else {
            // 处理外部URL
            return {
              name: url.split('/').pop() || 'video',
              external: { url: buildFullUrl(url, baseUrl) },
            };
          }
        });
        
        properties.Videos = { files: filesList };
      }

      const page = await this.notion.pages.create({
        parent: { database_id: this.databaseId },
        properties,
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: momentData.content,
                  },
                },
              ],
            },
          },
        ],
      });

      return this.parseNotionPage(page);
    } catch (error) {
      throw new Error(`创建动态失败: ${error}`);
    }
  }

  async getMoments(pageSize: number = 10, startCursor?: string, filters?: any): Promise<MomentList> {
    try {
      const queryParams: any = {
        database_id: this.databaseId,
        page_size: pageSize,
        sorts: [
          {
            property: 'Created',
            direction: 'descending',
          },
        ],
      };

      if (startCursor) {
        queryParams.start_cursor = startCursor;
      }

      // 添加筛选条件
      if (filters) {
        queryParams.filter = { and: [] };

        if (filters.status) {
          queryParams.filter.and.push({
            property: 'Status',
            select: {
              equals: filters.status,
            },
          });
        }

        if (filters.tag) {
          queryParams.filter.and.push({
            property: 'Tags',
            multi_select: {
              contains: filters.tag,
            },
          });
        }

        if (filters.favorited !== undefined) {
          queryParams.filter.and.push({
            property: 'Favorited',
            checkbox: {
              equals: filters.favorited,
            },
          });
        }

        if (filters.search) {
          queryParams.filter.and.push({
            property: 'Title',
            title: {
              contains: filters.search,
            },
          });
        }

        // 如果只有一个筛选条件，不需要用and包装
        if (queryParams.filter.and.length === 1) {
          queryParams.filter = queryParams.filter.and[0];
        }
      }

      const response = await this.notion.databases.query(queryParams);
      const moments = await Promise.all(response.results.map(page => this.parseNotionPage(page)));

      return {
        moments,
        total: moments.length,
        has_more: response.has_more,
        next_cursor: response.next_cursor || undefined,
      };
    } catch (error) {
      throw new Error(`获取动态列表失败: ${error}`);
    }
  }

  async getMomentById(momentId: string): Promise<MomentResponse> {
    try {
      const page = await this.notion.pages.retrieve({ page_id: momentId });
      return this.parseNotionPage(page);
    } catch (error) {
      throw new Error(`获取动态失败: ${error}`);
    }
  }

  async updateMoment(momentId: string, momentData: MomentUpdate, baseUrl?: string): Promise<MomentResponse> {
    try {
      const properties: any = {};

      if (momentData.title !== undefined) {
        properties.Title = {
          title: [{ text: { content: momentData.title } }],
        };
      }

      if (momentData.content !== undefined) {
        // 更新标题为内容的前20个字符
        properties.Title = {
          title: [{ text: { content: momentData.content.slice(0, 20) } }],
        };
      }

      if (momentData.status !== undefined) {
        properties.Status = {
          select: { name: momentData.status },
        };
      }

      if (momentData.tags !== undefined) {
        properties.Tags = {
          multi_select: momentData.tags.map(tag => ({ name: tag })),
        };
      }

      if (momentData.images !== undefined) {
        const filesList = momentData.images.map(url => {
          if (url.startsWith('notion-file-upload://')) {
            // 处理Notion文件上传URL
            const urlObj = new URL(url);
            const fileUploadId = urlObj.hostname;
            const filename = urlObj.searchParams.get('filename') || 'image';
            
            return {
              type: 'file_upload',
              file_upload: { id: fileUploadId },
              name: filename,
            };
          } else {
            // 处理外部URL
            return {
              name: url.split('/').pop() || 'image',
              external: { url: buildFullUrl(url, baseUrl) },
            };
          }
        });
        
        properties.Images = { files: filesList };
      }

      if (momentData.videos !== undefined) {
        const filesList = momentData.videos.map(url => {
          if (url.startsWith('notion-file-upload://')) {
            // 处理Notion文件上传URL
            const urlObj = new URL(url);
            const fileUploadId = urlObj.hostname;
            const filename = urlObj.searchParams.get('filename') || 'video';
            
            return {
              type: 'file_upload',
              file_upload: { id: fileUploadId },
              name: filename,
            };
          } else {
            // 处理外部URL
            return {
              name: url.split('/').pop() || 'video',
              external: { url: buildFullUrl(url, baseUrl) },
            };
          }
        });
        
        properties.Videos = { files: filesList };
      }

      if (momentData.favorited !== undefined) {
        properties.Favorited = {
          checkbox: momentData.favorited,
        };
      }

      const page = await this.notion.pages.update({
        page_id: momentId,
        properties,
      });

      // 如果内容有更新，同时更新页面内容
      if (momentData.content !== undefined) {
        try {
          // 先删除现有的内容块
          const existingBlocks = await this.notion.blocks.children.list({
            block_id: momentId,
          });
          
          if (existingBlocks.results.length > 0) {
            // 删除第一个块（内容块）
            await this.notion.blocks.delete({
              block_id: existingBlocks.results[0].id,
            });
          }
          
          // 添加新的内容块
          await this.notion.blocks.children.append({
            block_id: momentId,
            children: [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: momentData.content,
                      },
                    },
                  ],
                },
              },
            ],
          });
        } catch (error) {
          console.error('更新页面内容失败:', error);
        }
      }

      return await this.parseNotionPage(page);
    } catch (error) {
      throw new Error(`更新动态失败: ${error}`);
    }
  }

  async toggleFavorite(momentId: string): Promise<MomentResponse> {
    try {
      // 先获取当前状态
      const currentMoment = await this.getMomentById(momentId);
      
      // 切换收藏状态
      const page = await this.notion.pages.update({
        page_id: momentId,
        properties: {
          Favorited: {
            checkbox: !currentMoment.favorited,
          },
        },
      });

      return this.parseNotionPage(page);
    } catch (error) {
      throw new Error(`切换收藏状态失败: ${error}`);
    }
  }

  async deleteMoment(momentId: string): Promise<boolean> {
    try {
      await this.notion.pages.update({
        page_id: momentId,
        archived: true,
      });
      return true;
    } catch (error) {
      throw new Error(`删除动态失败: ${error}`);
    }
  }

  async searchMoments(query: string): Promise<MomentResponse[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Title',
          title: {
            contains: query,
          },
        },
      });

      return await Promise.all(response.results.map(page => this.parseNotionPage(page)));
    } catch (error) {
      throw new Error(`搜索动态失败: ${error}`);
    }
  }

  async getMomentsByStatus(status: string): Promise<MomentResponse[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Status',
          select: {
            equals: status,
          },
        },
      });

      return await Promise.all(response.results.map(page => this.parseNotionPage(page)));
    } catch (error) {
      throw new Error(`按状态获取动态失败: ${error}`);
    }
  }

  async getMomentsByTag(tag: string): Promise<MomentResponse[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Tags',
          multi_select: {
            contains: tag,
          },
        },
      });

      return await Promise.all(response.results.map(page => this.parseNotionPage(page)));
    } catch (error) {
      throw new Error(`按标签获取动态失败: ${error}`);
    }
  }

  async getTags(): Promise<TagResponse[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
      });

      const tagCounts: { [key: string]: number } = {};
      
      response.results.forEach((page: any) => {
        const tags = page.properties.Tags?.multi_select || [];
        tags.forEach((tag: any) => {
          tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
        });
      });

      return Object.entries(tagCounts).map(([name, count]) => ({
        name,
        count,
      }));
    } catch (error) {
      throw new Error(`获取标签失败: ${error}`);
    }
  }
} 