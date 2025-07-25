import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated, isPasswordConfigured } from '@/lib/auth';

// 不需要身份验证的公共路径
const publicPaths = [
  '/api/auth/login',
  '/api/auth/logout', 
  '/api/auth/status',
  '/api/health',
  '/_next', // Next.js 内部资源
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

// 静态资源路径
const staticAssetPaths = [
  '/images/',
  '/icons/',
  '/uploads/',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是公共路径
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 检查是否是静态资源
  const isStaticAsset = staticAssetPaths.some(path => pathname.startsWith(path));
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // 检查是否配置了密码
  if (!isPasswordConfigured()) {
    // 如果是 API 请求，返回 JSON 错误
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          success: false, 
          message: '系统配置错误：未设置访问密码，请联系管理员',
          code: 'CONFIGURATION_ERROR'
        },
        { status: 500 }
      );
    }
    
    // 如果是页面请求，重定向到错误页面或显示配置错误
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>配置错误</title>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; padding: 50px; text-align: center; }
            .error { color: #e74c3c; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>系统配置错误</h1>
          <div class="error">未设置访问密码，请联系管理员配置 AUTH_PASSWORD 环境变量</div>
        </body>
      </html>
      `,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }

  try {
    // 检查身份验证状态
    const authenticated = await isAuthenticated(request);

    if (!authenticated) {
      console.log(`未授权访问: ${pathname}`);
      
      // 如果是 API 请求，返回 JSON 错误
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { 
            success: false, 
            message: '未授权访问，请先登录',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }
      
      // 如果是页面请求，允许通过（前端组件会处理登录表单显示）
      // 这样可以确保登录表单能正常显示
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error('中间件认证检查错误:', error);
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          success: false, 
          message: '服务器错误',
          code: 'SERVER_ERROR'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 