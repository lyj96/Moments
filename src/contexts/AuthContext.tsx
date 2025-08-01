'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      // 先检查本地存储的token
      const localToken = localStorage.getItem('auth-token');
      if (localToken) {
        try {
          // 验证本地token是否有效
          const response = await fetch('/api/auth/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: localToken }),
          });
          
          const data = await response.json();
          if (data.success && data.valid) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } else {
            // 本地token无效，清除
            localStorage.removeItem('auth-token');
          }
        } catch (error) {
          // token验证失败，清除本地token
          localStorage.removeItem('auth-token');
        }
      }

      // 如果本地没有有效token，检查服务端cookie
      const response = await fetch(`/api/auth/status?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
      });
      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(data.authenticated);
      } else {
        // 如果请求失败，假设未认证
        setIsAuthenticated(false);
        if (data.message) {
          console.error('认证检查失败:', data.message);
        }
      }
    } catch (error) {
      console.error('检查身份验证状态失败:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 清除本地存储的token
        localStorage.removeItem('auth-token');
        setIsAuthenticated(false);
        toast.success('已安全登出');
      } else {
        toast.error('登出失败');
      }
    } catch (error) {
      console.error('登出失败:', error);
      toast.error('登出失败');
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // 设置定期检查认证状态（每5分钟检查一次）
    const interval = setInterval(() => {
      if (!isLoading) {
        checkAuthStatus();
      }
    }, 5 * 60 * 1000);
    
    // 监听页面可见性变化，当页面重新可见时检查认证状态
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoading) {
        checkAuthStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 