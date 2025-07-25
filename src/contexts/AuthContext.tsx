'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  authEnabled: boolean;
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
  const [authEnabled, setAuthEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      // 添加时间戳防止缓存
      const response = await fetch(`/api/auth/status?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include', // 确保发送cookies
        cache: 'no-cache', // 禁用缓存
      });
      const data = await response.json();
      
      if (data.success) {
        setAuthEnabled(data.authEnabled);
        setIsAuthenticated(data.authenticated);
      } else {
        // 如果请求失败，假设未认证
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('检查身份验证状态失败:', error);
      setAuthEnabled(false);
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
      if (authEnabled && isAuthenticated) {
        checkAuthStatus();
      }
    }, 5 * 60 * 1000);
    
    // 监听页面可见性变化，当页面重新可见时检查认证状态
    const handleVisibilityChange = () => {
      if (!document.hidden && authEnabled && isAuthenticated) {
        checkAuthStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authEnabled, isAuthenticated]);

  const value: AuthContextType = {
    isAuthenticated,
    authEnabled,
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