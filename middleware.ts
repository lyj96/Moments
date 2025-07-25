import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

// 需要身份验证保护的路径
const protectedPaths = [
  '/api/moments',
  '/api/upload',
];

// 排除的路径（即使在保护路径下也不需要验证）
const excludedPaths = [
  '/api/auth/login',
  '/api/auth/logout', 
  '/api/auth/status',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是需要保护的路径
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isExcludedPath = excludedPaths.some(path => pathname.startsWith(path));

  // 如果不是保护路径或者是排除路径，直接通过
  if (!isProtectedPath || isExcludedPath) {
    return NextResponse.next();
  }

  try {
    // 检查身份验证状态
    const authenticated = await isAuthenticated(request);

    if (!authenticated) {
      console.log(`未授权访问: ${pathname}`);
      return NextResponse.json(
        { 
          success: false, 
          message: '未授权访问，请先登录',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('中间件认证检查错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器错误',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}; 