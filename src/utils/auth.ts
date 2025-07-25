// 客户端身份验证相关工具函数

export interface AuthStatus {
  authEnabled: boolean;
  authenticated: boolean;
  success: boolean;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}

// 检查身份验证状态
export async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const response = await fetch(`/api/auth/status?t=${Date.now()}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-cache',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('检查身份验证状态失败:', error);
    return {
      authEnabled: false,
      authenticated: false,
      success: false,
    };
  }
}

// 登录
export async function login(password: string): Promise<LoginResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-cache',
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('登录失败:', error);
    return {
      success: false,
      message: '网络错误，请稍后重试',
    };
  }
}

// 登出
export async function logout(): Promise<LoginResponse> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-cache',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('登出失败:', error);
    return {
      success: false,
      message: '网络错误，请稍后重试',
    };
  }
} 