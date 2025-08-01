import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少token', valid: false },
        { status: 400 }
      );
    }

    // 验证token的有效性
    const isValid = await verifyToken(token);

    return NextResponse.json({
      success: true,
      valid: isValid
    });

  } catch (error) {
    console.error('验证token错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误', valid: false },
      { status: 500 }
    );
  }
}