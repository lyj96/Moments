import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// 获取环境变量
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const SESSION_EXPIRE_HOURS = parseInt(process.env.SESSION_EXPIRE_HOURS || '24');

// 验证密码
export function verifyPassword(inputPassword: string): boolean {
  if (!AUTH_PASSWORD) {
    throw new Error('系统错误：未设置访问密码，请联系管理员配置 AUTH_PASSWORD 环境变量');
  }
  return inputPassword === AUTH_PASSWORD;
}

// 检查是否设置了密码
export function isPasswordConfigured(): boolean {
  return Boolean(AUTH_PASSWORD);
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
    const { payload } = await jwtVerify(token, secret);
    
    // 检查token是否包含必要的字段
    if (!payload.authenticated || !payload.iat || !payload.exp) {
      return false;
    }
    
    // 检查token是否过期
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && currentTime > payload.exp) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// 设置认证cookie
export async function setAuthCookie(): Promise<string> {
  const token = await generateToken();
  const cookieStore = cookies();
  
  // 计算过期时间（秒）
  const maxAgeSeconds = SESSION_EXPIRE_HOURS * 60 * 60;
  
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/',
    expires: new Date(Date.now() + maxAgeSeconds * 1000),
  });
  
  return token;
}

// 检查用户是否已认证
export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  // 如果没有配置密码，直接返回 false，强制要求配置
  if (!isPasswordConfigured()) {
    return false;
  }
  
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
    
    // 验证token的有效性和过期时间
    const isValid = await verifyToken(token);
    
    // 如果token无效，清除cookie
    if (!isValid && !request) {
      clearAuthCookie();
    }
    
    return isValid;
  } catch {
    // 如果出现异常，清除cookie并返回false
    if (!request) {
      clearAuthCookie();
    }
    return false;
  }
}

// 清除认证cookie
export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('auth-token');
} 