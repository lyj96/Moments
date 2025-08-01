import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, setAuthCookie, isPasswordConfigured } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 检查是否配置了密码
    if (!isPasswordConfigured()) {
      return NextResponse.json(
        { success: false, message: '系统配置错误：未设置访问密码，请联系管理员' },
        { status: 500 }
      );
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
    try {
      if (!verifyPassword(password)) {
        return NextResponse.json(
          { success: false, message: '密码错误' },
          { status: 401 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // 设置身份验证cookie并获取token
    const token = await setAuthCookie();

    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      token: token
    });

    // 添加缓存控制头
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
} 