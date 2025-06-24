'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Filter, Heart, Clock, CheckCircle, Zap, Lightbulb, X } from 'lucide-react';
import { FilterOptions, MomentStatus, Tag as TagType, STATUS_OPTIONS } from '@/types';
import { momentsApi } from '@/utils/api';
import LoadingSpinner from './LoadingSpinner';

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export default function FilterBar({ onFilterChange, currentFilters }: FilterBarProps) {
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // 加载标签
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagsData = await momentsApi.getTags();
        setTags(tagsData);
      } catch (error) {
        console.error('加载标签失败:', error);
      } finally {
        setTagsLoading(false);
      }
    };

    loadTags();
  }, []);

  // 点击外部关闭操作菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded) {
        const target = event.target as Element;
        if (!target.closest('.filter-bar')) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const handleStatusFilter = (status: MomentStatus) => {
    const newFilters = { ...currentFilters };
    if (newFilters.status === status) {
      delete newFilters.status;
    } else {
      newFilters.status = status;
      delete newFilters.tag;
      delete newFilters.favorited;
    }
    onFilterChange(newFilters);
  };

  const handleTagFilter = (tagName: string) => {
    const newFilters = { ...currentFilters };
    if (newFilters.tag === tagName) {
      delete newFilters.tag;
    } else {
      newFilters.tag = tagName;
      delete newFilters.status;
      delete newFilters.favorited;
    }
    onFilterChange(newFilters);
  };

  const handleFavoriteFilter = () => {
    const newFilters = { ...currentFilters };
    if (newFilters.favorited) {
      delete newFilters.favorited;
    } else {
      newFilters.favorited = true;
      delete newFilters.status;
      delete newFilters.tag;
    }
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const getStatusIcon = (status: MomentStatus) => {
    switch (status) {
      case '闪念':
        return <Lightbulb className="w-4 h-4" />;
      case '待办':
        return <Clock className="w-4 h-4" />;
      case '进行中':
        return <Zap className="w-4 h-4" />;
      case '已完成':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: MomentStatus) => {
    switch (status) {
      case '闪念':
        return 'from-orange-500 to-orange-600 text-white';
      case '待办':
        return 'from-teal-500 to-teal-600 text-white';
      case '进行中':
        return 'from-emerald-500 to-emerald-600 text-white';
      case '已完成':
        return 'from-emerald-600 to-emerald-700 text-white';
      default:
        return 'from-gray-500 to-gray-600 text-white';
    }
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <div className="filter-bar">
      <div className="py-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 
                           flex items-center space-x-1 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>清除筛选</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>

        {/* 快捷筛选 */}
        <div className="flex flex-wrap gap-2 mb-2">
          {/* 收藏筛选 */}
          <button
            onClick={handleFavoriteFilter}
            className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              currentFilters.favorited 
                ? 'bg-yellow-500 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Heart className={`w-3 h-3 ${currentFilters.favorited ? 'fill-current' : ''}`} />
            <span>收藏</span>
          </button>

          {/* 状态筛选 */}
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                currentFilters.status === status
                  ? getStatusActiveClass(status)
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {getStatusIcon(status)}
              <span>{status}</span>
            </button>
          ))}
        </div>

        {/* 标签筛选 - 可展开 */}
        {isExpanded && (
          <div className="border-t border-slate-200 dark:border-slate-600 pt-2">
            <div className="flex items-center space-x-2 mb-2">
              <Tag className="w-3 h-3 text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">标签</span>
              {tagsLoading && <LoadingSpinner size="small" />}
            </div>
            
            {tagsLoading ? (
              <div className="text-center py-2">
                <LoadingSpinner size="small" />
              </div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => handleTagFilter(tag.name)}
                    className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      currentFilters.tag === tag.name
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag.name}</span>
                    {tag.count && <span className="text-xs opacity-75">({tag.count})</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">暂无标签</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  function getStatusActiveClass(status: MomentStatus) {
    switch (status) {
      case '闪念':
        return 'bg-orange-500 text-white';
      case '待办':
        return 'bg-teal-500 text-white';
      case '进行中':
        return 'bg-emerald-500 text-white';
      case '已完成':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }
} 