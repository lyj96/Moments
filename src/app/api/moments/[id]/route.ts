import { NextRequest, NextResponse } from 'next/server';
import { NotionService, getBaseUrl } from '@/lib/notion';
import { MomentUpdate } from '@/lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const notionService = new NotionService();
    const result = await notionService.getMomentById(params.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取动态失败:', error);
    if (error instanceof Error && error.message.includes('Could not find page')) {
      return NextResponse.json(
        { error: '动态不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: '获取动态失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body: MomentUpdate = await request.json();
    
    const baseUrl = getBaseUrl(request);
    
    const notionService = new NotionService();
    const result = await notionService.updateMoment(params.id, body, baseUrl);

    return NextResponse.json(result);
  } catch (error) {
    console.error('更新动态失败:', error);
    if (error instanceof Error && error.message.includes('Could not find page')) {
      return NextResponse.json(
        { error: '动态不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: '更新动态失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const notionService = new NotionService();
    const result = await notionService.deleteMoment(params.id);

    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('删除动态失败:', error);
    if (error instanceof Error && error.message.includes('Could not find page')) {
      return NextResponse.json(
        { error: '动态不存在' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: '删除动态失败' },
      { status: 500 }
    );
  }
} 