import { NextResponse } from 'next/server';
import { isAuthenticated, isAuthEnabled } from '@/lib/auth';

export async function GET() {
  try {
    const authEnabled = isAuthEnabled();
    const authenticated = await isAuthenticated();
    
    return NextResponse.json({
      authEnabled,
      authenticated,
      success: true
    });
  } catch (error) {
    console.error('身份验证状态检查错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
} 