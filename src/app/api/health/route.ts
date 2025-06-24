import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const notionService = new NotionService();
    const databaseInfo = await notionService.getDatabaseInfo();
    
    return NextResponse.json({
      status: 'healthy',
      notion_connected: true,
      database_title: 'Connected',
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    return NextResponse.json({
      status: 'unhealthy',
      notion_connected: false,
      error: error instanceof Error ? error.message : '未知错误',
    });
  }
} 