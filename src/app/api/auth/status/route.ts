import { NextResponse } from 'next/server';
import { isAuthenticated, isPasswordConfigured } from '@/lib/auth';

export async function GET() {
  try {
    const passwordConfigured = isPasswordConfigured();
    
    if (!passwordConfigured) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        authEnabled: true, // 认证始终启用，只是密码未配置
        message: '系统配置错误：未设置访问密码'
      });
    }

    const authenticated = await isAuthenticated();

    return NextResponse.json({
      success: true,
      authenticated,
      authEnabled: true // 认证始终启用
    });

  } catch (error) {
    console.error('检查认证状态失败:', error);
    return NextResponse.json({
      success: false,
      authenticated: false,
      authEnabled: true,
      message: '服务器错误'
    }, { status: 500 });
  }
} 