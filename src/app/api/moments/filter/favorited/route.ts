import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const notionService = new NotionService();
    
    // 使用筛选获取收藏的动态
    const result = await notionService.getMoments(50, undefined, { favorited: true });
    
    // 只返回动态数组，保持与其他筛选API的一致性
    return NextResponse.json(result.moments);
  } catch (error) {
    console.error('获取收藏动态失败:', error);
    return NextResponse.json(
      { error: '获取收藏动态失败' },
      { status: 500 }
    );
  }
} 