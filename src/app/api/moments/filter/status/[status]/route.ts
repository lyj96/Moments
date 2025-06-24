import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';

interface RouteParams {
  params: {
    status: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const status = decodeURIComponent(params.status);
    
    const notionService = new NotionService();
    const result = await notionService.getMomentsByStatus(status);

    return NextResponse.json(result);
  } catch (error) {
    console.error('按状态筛选动态失败:', error);
    return NextResponse.json(
      { error: '按状态筛选动态失败' },
      { status: 500 }
    );
  }
} 