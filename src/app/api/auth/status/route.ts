import { NextResponse } from 'next/server';
import { isAuthenticated, isAuthEnabled } from '@/lib/auth';

export async function GET() {
  try {
    const authEnabled = isAuthEnabled();
    const authenticated = await isAuthenticated();
    
    const response = NextResponse.json({
      authEnabled,
      authenticated,
      success: true
    });
    
    // 添加缓存控制头，防止浏览器缓存
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('身份验证状态检查错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
} 