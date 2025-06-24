import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const notionService = new NotionService();
    const result = await notionService.getTags();

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
} 