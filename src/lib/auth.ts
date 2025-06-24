import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// 获取环境变量
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const SESSION_EXPIRE_HOURS = parseInt(process.env.SESSION_EXPIRE_HOURS || '24');

// 检查是否启用了身份验证
export function isAuthEnabled(): boolean {
  return Boolean(AUTH_PASSWORD);
}

// 验证密码
export function verifyPassword(inputPassword: string): boolean {
  if (!AUTH_PASSWORD) return true; // 如果没有设置密码，则允许访问
  return inputPassword === AUTH_PASSWORD;
}

// 生成JWT token
export async function generateToken(): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  return await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRE_HOURS}h`)
    .sign(secret);
}

// 验证JWT token
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

// 设置认证cookie
export async function setAuthCookie(): Promise<string> {
  const token = await generateToken();
  const cookieStore = cookies();
  
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRE_HOURS * 60 * 60, // 转换为秒
    path: '/',
  });
  
  return token;
}

// 检查用户是否已认证
export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  
  try {
    let token: string | undefined;
    
    if (request) {
      // 从请求中获取token
      token = request.cookies.get('auth-token')?.value;
    } else {
      // 从服务器端cookies中获取token
      const cookieStore = cookies();
      token = cookieStore.get('auth-token')?.value;
    }
    
    if (!token) return false;
    
    return await verifyToken(token);
  } catch {
    return false;
  }
}

// 清除认证cookie
export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('auth-token');
} 