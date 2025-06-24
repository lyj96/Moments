import { NextRequest, NextResponse } from 'next/server';
import { parseFormData } from '@/lib/parse-form';
import { saveUploadedFile, isAllowedVideo } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const { files } = await parseFormData(request);
    const file = files.file as File;

    if (!file) {
      return NextResponse.json(
        { error: '请选择文件' },
        { status: 400 }
      );
    }

    if (!isAllowedVideo(file.name)) {
      return NextResponse.json(
        { error: '不支持的视频格式，支持的格式: mp4, mov, avi, mkv' },
        { status: 400 }
      );
    }

    // 将File转换为Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await saveUploadedFile(buffer, file.name, 'videos');

    return NextResponse.json(result);
  } catch (error) {
    console.error('上传视频失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    );
  }
} 