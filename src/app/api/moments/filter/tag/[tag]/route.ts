import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';

interface RouteParams {
  params: {
    tag: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const tag = decodeURIComponent(params.tag);
    
    const notionService = new NotionService();
    const result = await notionService.getMomentsByTag(tag);

    return NextResponse.json(result);
  } catch (error) {
    console.error('按标签筛选动态失败:', error);
    return NextResponse.json(
      { error: '按标签筛选动态失败' },
      { status: 500 }
    );
  }
} 