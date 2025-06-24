import { NextRequest, NextResponse } from 'next/server';
import { getUploadConfig } from '@/lib/upload';

export async function GET(request: NextRequest) {
  try {
    const config = getUploadConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('获取上传配置失败:', error);
    return NextResponse.json(
      { error: '获取上传配置失败' },
      { status: 500 }
    );
  }
}