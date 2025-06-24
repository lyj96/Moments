import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: '请提供搜索关键词' },
        { status: 400 }
      );
    }

    const notionService = new NotionService();
    const result = await notionService.searchMoments(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error('搜索动态失败:', error);
    return NextResponse.json(
      { error: '搜索动态失败' },
      { status: 500 }
    );
  }
} 