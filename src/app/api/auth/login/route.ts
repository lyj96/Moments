import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, setAuthCookie, isAuthEnabled } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 如果未启用身份验证，直接返回成功
    if (!isAuthEnabled()) {
      return NextResponse.json({ success: true, message: '身份验证未启用' });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: '请输入密码' },
        { status: 400 }
      );
    }

    // 验证密码
    if (!verifyPassword(password)) {
      return NextResponse.json(
        { success: false, message: '密码错误' },
        { status: 401 }
      );
    }

    // 设置身份验证cookie
    await setAuthCookie();

    return NextResponse.json({
      success: true,
      message: '登录成功'
    });

  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
} 