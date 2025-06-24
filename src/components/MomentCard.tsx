import React, { useState } from 'react';
import { Bookmark, Tag, MoreHorizontal, ExternalLink, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Moment, STATUS_COLORS, UserConfig } from '@/types';
import { momentsApi } from '@/utils/api';
import { formatDate, buildImageUrl, generateImageGridClass } from '@/utils/format';
import { getUserConfig } from '@/utils/config';
import ImageGrid from './ImageGrid';
import VideoPlayer from './VideoPlayer';

interface MomentCardProps {
  moment: Moment;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  config?: UserConfig;
}

export default function MomentCard({ moment, onDelete, onUpdate, config }: MomentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [bookmarked, setBookmarked] = useState(moment.favorited || false);
  const [isToggleFavorite, setIsToggleFavorite] = useState(false);

  // 使用配置或默认配置
  const userConfig = config || getUserConfig();

  const handleDelete = async () => {
    if (!confirm('确定要删除这条动态吗？')) return;

    setIsDeleting(true);
    try {
      await momentsApi.deleteMoment(moment.id);
      onDelete(moment.id);
      toast.success('删除成功');
    } catch (error) {
      toast.error('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBookmark = async () => {
    if (isToggleFavorite) return;
    
    setIsToggleFavorite(true);
    try {
      await momentsApi.toggleFavorite(moment.id);
      setBookmarked(!bookmarked);
      toast.success(bookmarked ? '已取消收藏' : '已收藏');
      onUpdate(); // 刷新列表
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setIsToggleFavorite(false);
    }
  };

  const handleViewInNotion = () => {
    window.open(moment.url, '_blank');
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: string; color: string; bgColor: string; borderColor: string; textColor: string }> = {
      '闪念': { 
        icon: '💡', 
        color: 'text-orange-400', 
        bgColor: 'bg-transparent', 
        borderColor: 'border-transparent',
        textColor: 'text-orange-300'
      },
      '待办': { 
        icon: '📝', 
        color: 'text-teal-400', 
        bgColor: 'bg-transparent', 
        borderColor: 'border-transparent',
        textColor: 'text-teal-300'
      },
      '进行中': { 
        icon: '⚡', 
        color: 'text-emerald-600', 
        bgColor: 'bg-transparent', 
        borderColor: 'border-transparent',
        textColor: 'text-emerald-400'
      },
      '已完成': { 
        icon: '✅', 
        color: 'text-emerald-600', 
        bgColor: 'bg-transparent', 
        borderColor: 'border-transparent',
        textColor: 'text-emerald-400'
      },
    };
    return configs[status] || { 
      icon: '💭', 
      color: 'text-slate-400', 
      bgColor: 'bg-slate-800/20', 
      borderColor: 'border-slate-500/30',
      textColor: 'text-slate-300'
    };
  };

  const statusConfig = getStatusConfig(moment.status);

  return (
    <article className="group border-b border-slate-200 dark:border-slate-700 last:border-b-0 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
      <div className="flex space-x-3">
        {/* 头像 - 简化 */}
        <div className="flex-shrink-0">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: userConfig.primaryColor }}
          >
            <span className="text-white font-bold text-sm">{userConfig.userName}</span>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="flex-1 min-w-0">
          {/* 头部信息 - 紧凑 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-slate-900 dark:text-white text-sm">{userConfig.userName}</span>
              <span className="text-slate-400 text-xs">@{userConfig.userHandle}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                {formatDate(moment.created_time)}
              </span>
            </div>
            
            {/* 更多操作按钮 */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* 下拉菜单 */}
              {showActions && (
                <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 min-w-40 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewInNotion();
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>在 Notion 中查看</span>
                  </button>
                  <div className="h-px bg-slate-200 dark:bg-slate-600"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                      setShowActions(false);
                    }}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? '删除中...' : '删除动态'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 内容 */}
          <div className="mb-3">
            <p className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed text-sm">
              {moment.content}
            </p>
          </div>

          {/* 图片网格 */}
          {moment.images && moment.images.length > 0 && (
            <div className="mb-3">
              <ImageGrid images={moment.images.map(buildImageUrl)} />
            </div>
          )}

          {/* 视频 */}
          {moment.videos && moment.videos.length > 0 && (
            <div className="mb-3 space-y-2">
              {moment.videos.map((videoUrl, index) => (
                <VideoPlayer
                  key={index}
                  src={buildImageUrl(videoUrl)}
                  className="w-full max-h-64 rounded-lg"
                />
              ))}
            </div>
          )}

          {/* 标签 - 紧凑 */}
          {moment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {moment.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 底部操作栏 - 简化 */}
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-4">
              {/* 收藏按钮 */}
              <button
                onClick={handleBookmark}
                disabled={isToggleFavorite}
                className={`flex items-center space-x-1 text-xs hover:text-slate-700 dark:hover:text-slate-300 transition-colors ${
                  bookmarked ? 'text-yellow-500' : ''
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                <span>收藏</span>
              </button>
            </div>

            {/* 状态标识 - 简化 */}
            <div className={`flex items-center space-x-1 text-xs ${statusConfig.textColor}`}>
              <span>{statusConfig.icon}</span>
              <span>{moment.status}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
} 