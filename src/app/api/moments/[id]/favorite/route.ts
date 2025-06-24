import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const momentId = params.id;
    
    const notionService = new NotionService();
    const result = await notionService.toggleFavorite(momentId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    return NextResponse.json(
      { error: '切换收藏状态失败' },
      { status: 500 }
    );
  }
} 