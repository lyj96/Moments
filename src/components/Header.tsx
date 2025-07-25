'use client';

import React from 'react';
import { Plus, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onCreateClick: () => void;
}

export default function Header({ onCreateClick }: HeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">灵感时刻</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onCreateClick}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建</span>
            </button>
            
            {/* 登出按钮 - 认证始终启用 */}
            <button
              onClick={logout}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="登出"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 