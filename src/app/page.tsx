'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Settings } from 'lucide-react';
import { Moment, MomentList, FilterOptions, UserConfig, defaultConfig } from '@/types';
import { momentsApi } from '@/utils/api';
import { getUserConfig } from '@/utils/config';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import MomentCard from '@/components/MomentCard';
import CreateMomentBox from '@/components/CreateMomentBox';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ThemeToggle from '@/components/ThemeToggle';
import FilterBar from '@/components/FilterBar';
import ConfigModal from '@/components/ConfigModal';
import LoginForm from '@/components/LoginForm';

type TabType = 'for-you' | 'following';

function MomentsList({ onRefreshNeeded, filters, config }: { onRefreshNeeded?: number, filters?: FilterOptions, config?: UserConfig }) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const loadMoments = async (cursor?: string, append = false) => {
    try {
      if (!append) setLoading(true);
      setError(null);

      const data: MomentList = await momentsApi.getMoments(10, cursor, filters);
      
      if (append) {
        setMoments(prev => [...prev, ...data.moments]);
      } else {
        setMoments(data.moments);
      }
      
      setHasMore(data.has_more);
      setNextCursor(data.next_cursor);
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载动态失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 加载更多
  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadMoments(nextCursor, true);
  };

  // 刷新列表
  const refreshMoments = () => {
    loadMoments();
  };

  // 删除动态
  const handleDeleteMoment = (momentId: string) => {
    setMoments(prev => prev.filter(moment => moment.id !== momentId));
  };

  // 初始加载
  useEffect(() => {
    loadMoments();
  }, []);

  // 监听刷新需求
  useEffect(() => {
    if (onRefreshNeeded) {
      refreshMoments();
    }
  }, [onRefreshNeeded]);

  // 监听筛选条件变化
  useEffect(() => {
    refreshMoments();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage 
          message={error} 
          onRetry={refreshMoments}
        />
      </div>
    );
  }

  if (moments.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="text-gray-400 text-6xl mb-4">✨</div>
        <h3 className="text-gray-400 text-xl font-medium mb-2">
          还没有动态
        </h3>
        <p className="text-gray-500 mb-6">
          开始记录你的第一个灵感时刻吧！
        </p>
      </div>
    );
  }

  return (
    <>
      {moments.map((moment) => (
        <MomentCard
          key={moment.id}
          moment={moment}
          onDelete={handleDeleteMoment}
          onUpdate={refreshMoments}
          config={config}
        />
      ))}

      {hasMore && (
        <div className="text-center py-8 border-b border-gray-800">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="small" />
                <span>加载中...</span>
              </div>
            ) : (
              '显示更多动态'
            )}
          </button>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const { isAuthenticated, authEnabled, isLoading, login } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [config, setConfig] = useState<UserConfig>(defaultConfig);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 确保在客户端环境下运行
  useEffect(() => {
    setIsClient(true);
    // 只在客户端重新加载配置
    setConfig(getUserConfig());
  }, []);

  // 如果正在加载身份验证状态，显示加载界面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">正在验证访问权限...</p>
        </div>
      </div>
    );
  }

  // 如果启用了身份验证且用户未登录，显示登录表单
  if (authEnabled && !isAuthenticated) {
    return (
      <>
        <LoginForm onLoginSuccess={login} />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
            },
          }}
        />
      </>
    );
  }

  const handleMomentCreated = () => {
    // 通过改变key来触发MomentsList刷新
    setRefreshKey(prev => prev + 1);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleConfigUpdate = (newConfig: UserConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300">
      
      <div className="max-w-2xl mx-auto px-4 pb-4">
        {/* 统一的主容器 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* 带背景图的顶部标题设计 */}
          <div className="relative overflow-hidden h-64">
            {/* 背景图层 */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${config.headerBackgroundImage})`,
                opacity: config.headerBackgroundOpacity / 100
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent dark:from-black/70"></div>
            
            {/* 设置按钮 - 左上角 */}
            <div className="absolute top-6 left-6 z-20">
              <button
                onClick={() => setShowConfigModal(true)}
                className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-lg transition-colors backdrop-blur-sm"
                title="个性化设置"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            
            {/* 主题切换按钮 - 右上角 */}
            <div className="absolute top-6 right-6 z-20">
              <ThemeToggle />
            </div>
            
            {/* 标题文字 - 右下角 */}
            <div className="absolute bottom-8 right-8 z-10 text-right">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                {config.siteTitle}
              </h1>
              <p className="text-white/95 text-lg drop-shadow mt-1">{config.siteSubtitle}</p>
            </div>
          </div>

          {/* 分割线 */}
          <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

          {/* 创建动态区域 */}
          <div className="p-6">
            <CreateMomentBox onSuccess={handleMomentCreated} config={config} />
          </div>

          {/* 分割线 */}
          <div className="h-px bg-slate-200 dark:bg-slate-700 mx-6"></div>

          {/* 筛选区域 */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30">
            <FilterBar onFilterChange={handleFilterChange} currentFilters={filters} />
          </div>

          {/* 分割线 */}
          <div className="h-px bg-slate-200 dark:bg-slate-700"></div>

          {/* 历史灵感列表 */}
          <div>
            <MomentsList onRefreshNeeded={refreshKey} filters={filters} config={config} />
          </div>

          {/* 分割线 */}
          <div className="h-px bg-slate-200 dark:bg-slate-700 mx-6"></div>

          {/* Footer */}
          <footer className="p-6 text-center bg-slate-50 dark:bg-slate-700/20">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: config.primaryColor }}
              >
                <span className="text-white font-bold text-sm">✨</span>
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{config.siteTitle}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
              {config.footerText}
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-slate-400 dark:text-slate-500">
              {config.footerLinks.map((link, index) => (
                <React.Fragment key={index}>
                  {link.url ? (
                    <a href={link.url} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {link.text}
                    </a>
                  ) : (
                    <span>{link.text}</span>
                  )}
                  {index < config.footerLinks.length - 1 && <span>·</span>}
                </React.Fragment>
              ))}
            </div>
          </footer>

        </div>
      </div>

      {/* 配置模态框 */}
      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConfigUpdate={handleConfigUpdate}
      />

      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
        }}
      />
    </div>
  );
} 