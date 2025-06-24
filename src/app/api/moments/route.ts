import { NextRequest, NextResponse } from 'next/server';
import { NotionService, getBaseUrl } from '@/lib/notion';
import { MomentCreate } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSize = parseInt(searchParams.get('page_size') || '10');
    const cursor = searchParams.get('cursor') || undefined;
    
    // 获取筛选参数
    const filters: any = {};
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.get('tag')) {
      filters.tag = searchParams.get('tag');
    }
    if (searchParams.get('favorited')) {
      filters.favorited = searchParams.get('favorited') === 'true';
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search');
    }

    const notionService = new NotionService();
    const result = await notionService.getMoments(pageSize, cursor, Object.keys(filters).length > 0 ? filters : undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取动态列表失败:', error);
    return NextResponse.json(
      { error: '获取动态列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MomentCreate = await request.json();
    
    // 动态获取baseUrl
    const baseUrl = getBaseUrl(request);
    
    const notionService = new NotionService();
    const result = await notionService.createMoment(body, baseUrl);

    return NextResponse.json(result);
  } catch (error) {
    console.error('创建动态失败:', error);
    return NextResponse.json(
      { error: '创建动态失败' },
      { status: 500 }
    );
  }
} 