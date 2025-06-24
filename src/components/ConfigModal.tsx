'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, RefreshCw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserConfig, STATUS_OPTIONS } from '@/types';
import { getUserConfig, saveUserConfig, resetUserConfig } from '@/utils/config';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdate: (config: UserConfig) => void;
}

export default function ConfigModal({ isOpen, onClose, onConfigUpdate }: ConfigModalProps) {
  const [config, setConfig] = useState<UserConfig>(getUserConfig());
  const [activeTab, setActiveTab] = useState<'basic' | 'appearance' | 'advanced'>('basic');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // 只在客户端且模态框打开时重新加载配置
      setConfig(getUserConfig());
    }
  }, [isOpen]);

  const handleSave = () => {
    const success = saveUserConfig(config);
    if (success) {
      onConfigUpdate(config);
      toast.success('配置已保存');
      onClose();
    } else {
      toast.error('保存失败');
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置为默认配置吗？这将删除所有自定义设置。')) {
      const defaultConfig = resetUserConfig();
      setConfig(defaultConfig);
      onConfigUpdate(defaultConfig);
      toast.success('已重置为默认配置');
    }
  };

  const updateConfig = (updates: Partial<UserConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-500" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">个性化设置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签导航 */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { key: 'basic', label: '基本设置' },
            { key: 'appearance', label: '外观设置' },
            { key: 'advanced', label: '高级设置' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-500'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* 网站信息 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  网站标题
                </label>
                <input
                  type="text"
                  value={config.siteTitle}
                  onChange={(e) => updateConfig({ siteTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  网站副标题
                </label>
                <input
                  type="text"
                  value={config.siteSubtitle}
                  onChange={(e) => updateConfig({ siteSubtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* 个人信息 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={config.userName}
                  onChange={(e) => updateConfig({ userName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  用户标识 (@ 后面的内容)
                </label>
                <div className="flex items-center">
                  <span className="text-slate-500 dark:text-slate-400 mr-1">@</span>
                  <input
                    type="text"
                    value={config.userHandle}
                    onChange={(e) => updateConfig({ userHandle: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="moments"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  将显示为 @{config.userHandle || 'moments'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* 背景图片 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  背景图片 URL
                </label>
                <input
                  type="url"
                  value={config.headerBackgroundImage}
                  onChange={(e) => updateConfig({ headerBackgroundImage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* 背景透明度 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  背景透明度: {config.headerBackgroundOpacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.headerBackgroundOpacity}
                  onChange={(e) => updateConfig({ headerBackgroundOpacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* 主题色 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  主题色
                </label>
                <div className="flex space-x-3">
                  {[
                    { color: '#14b8a6', name: '青绿' },
                    { color: '#3b82f6', name: '蓝色' },
                    { color: '#8b5cf6', name: '紫色' },
                    { color: '#f59e0b', name: '橙色' },
                    { color: '#ef4444', name: '红色' },
                    { color: '#10b981', name: '翠绿' }
                  ].map((colorOption) => (
                    <button
                      key={colorOption.color}
                      onClick={() => updateConfig({ primaryColor: colorOption.color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        config.primaryColor === colorOption.color
                          ? 'border-slate-900 dark:border-white scale-110'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      style={{ backgroundColor: colorOption.color }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* 页脚文本 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  页脚描述
                </label>
                <input
                  type="text"
                  value={config.footerText}
                  onChange={(e) => updateConfig({ footerText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* 默认状态 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  默认动态状态
                </label>
                <select
                  value={config.defaultMomentStatus}
                  onChange={(e) => updateConfig({ defaultMomentStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* 显示统计 */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.showStats}
                    onChange={(e) => updateConfig({ showStats: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">显示统计信息</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重置默认</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>保存设置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 