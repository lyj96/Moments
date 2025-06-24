import { NextRequest, NextResponse } from 'next/server';
import { parseFormData } from '@/lib/parse-form';
import { saveUploadedFile, isAllowedImage } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const { files } = await parseFormData(request);
    const fileList = Array.isArray(files.files) ? files.files : [files.files].filter(Boolean);

    if (fileList.length === 0) {
      return NextResponse.json(
        { error: '请选择文件' },
        { status: 400 }
      );
    }

    if (fileList.length > 9) {
      return NextResponse.json(
        { error: '最多只能上传9张图片' },
        { status: 400 }
      );
    }

    const results = [];
    const uploadedFiles = [];

    try {
      for (const file of fileList) {
        if (!file.name) continue;

        if (!isAllowedImage(file.name)) {
          throw new Error(`文件 ${file.name} 格式不支持，支持的格式: jpg, jpeg, png, gif, webp`);
        }

        // 将File转换为Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await saveUploadedFile(buffer, file.name, 'images');
        results.push(result);
        uploadedFiles.push(result.url);
      }

      return NextResponse.json({
        files: results,
        total: results.length,
      });
    } catch (error) {
      // 如果有错误，清理已上传的文件
      // TODO: 实现文件清理逻辑
      throw error;
    }
  } catch (error) {
    console.error('批量上传图片失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '批量上传失败' },
      { status: 500 }
    );
  }
} 