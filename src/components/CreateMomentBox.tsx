import React, { useState, useEffect } from 'react';
import { Image, Video, Bookmark, Tag, Circle, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { MomentCreate, MomentStatus, STATUS_OPTIONS, UserConfig } from '@/types';
import { momentsApi, uploadApi } from '@/utils/api';
import { validateImageFile, validateVideoFile } from '@/utils/format';
import { getUserConfig } from '@/utils/config';
import LoadingSpinner from './LoadingSpinner';

interface CreateMomentBoxProps {
  onSuccess: () => void;
  config?: UserConfig;
}

export default function CreateMomentBox({ onSuccess, config }: CreateMomentBoxProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // 使用配置或默认配置
  const userConfig = config || getUserConfig();
  
  const [formData, setFormData] = useState<MomentCreate>({
    title: '',
    content: '',
    tags: [],
    status: userConfig.defaultMomentStatus,
    images: [],
    videos: [],
  });

  // 存储预览URL的状态
  const [previewUrls, setPreviewUrls] = useState<{
    images: string[];
    videos: string[];
  }>({
    images: [],
    videos: [],
  });

  // 获取已有标签
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await momentsApi.getTags();
        console.log('获取到的标签:', tags); // 调试信息
        setExistingTags(tags.map(tag => tag.name));
      } catch (error) {
        console.error('获取标签失败:', error);
      }
    };
    fetchTags();
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    setFormData(prev => ({
      ...prev,
      content: value,
      title: value.slice(0, 50) || '灵感时刻',
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImages = formData.images.length + files.length;
    if (totalImages > 9) {
      toast.error('最多只能上传9张图片');
      return;
    }

    for (const file of files) {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setIsUploading(true);
    try {
      const result = await uploadApi.uploadImages(files);
      
      // 更新表单数据（用于保存到数据库）
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...result.files.map(f => f.url)],
      }));
      
      // 更新预览URL（用于前端显示）
      setPreviewUrls(prev => ({
        ...prev,
        images: [...prev.images, ...result.files.map(f => f.previewUrl || f.url)],
      }));
      
      toast.success(`上传了 ${result.total} 张图片`);
    } catch (error) {
      toast.error('图片上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.videos.length >= 3) {
      toast.error('最多只能上传3个视频');
      return;
    }

    const error = validateVideoFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadApi.uploadVideo(file);
      
      // 更新表单数据（用于保存到数据库）
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, result.url],
      }));
      
      // 更新预览URL（用于前端显示）
      setPreviewUrls(prev => ({
        ...prev,
        videos: [...prev.videos, result.previewUrl || result.url],
      }));
      
      toast.success('视频上传成功');
    } catch (error) {
      toast.error('视频上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('请输入内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await momentsApi.createMoment(formData);
      toast.success('发布成功！');
      
      // 重置表单
      setContent('');
      setTagInput('');
      setFormData({
        title: '',
        content: '',
        tags: [],
        status: userConfig.defaultMomentStatus,
        images: [],
        videos: [],
      });
      setPreviewUrls({
        images: [],
        videos: [],
      });
      setShowAdvanced(false);
      onSuccess();
    } catch (error) {
      toast.error('发布失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.length > 0 || true);
  };

  const handleTagInputFocus = () => {
    setShowTagSuggestions(true);
  };

  const handleTagInputBlur = (e: React.FocusEvent) => {
    setTimeout(() => {
      setShowTagSuggestions(false);
    }, 200);
  };

  // 过滤建议标签
  const filteredTags = existingTags.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && 
    !formData.tags.includes(tag)
  );

  return (
    <div className="w-full">
      {/* 主输入区域 */}
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

        {/* 输入框区域 */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="有什么新灵感？"
            className="w-full resize-none border-none outline-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm leading-relaxed"
            rows={content ? Math.max(2, Math.ceil(content.length / 60)) : 2}
            maxLength={2000}
          />
          
          {/* 字数统计 - 更小更简洁 */}
          {content && (
            <div className="text-xs text-slate-400 mt-1">
              {content.length}/2000
            </div>
          )}
          
          {/* 媒体预览 - 紧凑布局 */}
          {(previewUrls.images.length > 0 || previewUrls.videos.length > 0) && (
            <div className="mt-3 space-y-2">
              {/* 图片预览 */}
              {previewUrls.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.images.map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img 
                        src={url} 
                        alt={`预览 ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index)
                          }));
                          setPreviewUrls(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index)
                          }));
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 视频预览 */}
              {previewUrls.videos.length > 0 && (
                <div className="space-y-2">
                  {previewUrls.videos.map((url, index) => (
                    <div key={index} className="relative group">
                      <video 
                        src={url} 
                        className="w-full max-h-48 rounded-lg"
                        controls
                      />
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            videos: prev.videos.filter((_, i) => i !== index)
                          }));
                          setPreviewUrls(prev => ({
                            ...prev,
                            videos: prev.videos.filter((_, i) => i !== index)
                          }));
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 标签显示 - 更紧凑 */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-slate-500 hover:text-slate-700 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 底部操作栏 - 简化 */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-4">
              {/* 图片上传 */}
              <label className="cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <Image className="w-4 h-4" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              {/* 视频上传 */}
              <label className="cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <Video className="w-4 h-4" />
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              {/* 标签输入 */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <Tag className="w-4 h-4" />
              </button>
            </div>

            {/* 发布按钮 - 简化 */}
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || isUploading}
              className="px-4 py-1.5 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '发布中...' : '发布'}
            </button>
          </div>

          {/* 展开的高级选项 - 更紧凑 */}
          {showAdvanced && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
              {/* 状态选择 */}
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">状态</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => setFormData(prev => ({ ...prev, status }))}
                      className={`px-2 py-1 text-xs rounded ${
                        formData.status === status
                          ? 'bg-teal-500 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 标签输入 */}
              <div className="relative">
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">标签</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyPress={handleTagKeyPress}
                  onFocus={handleTagInputFocus}
                  onBlur={handleTagInputBlur}
                  placeholder="输入标签，按回车添加"
                  className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                
                {/* 标签建议 */}
                {showTagSuggestions && existingTags.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-lg z-10 max-h-32 overflow-y-auto">
                    {existingTags
                      .filter(tag => 
                        tag.toLowerCase().includes(tagInput.toLowerCase()) && 
                        !formData.tags.includes(tag)
                      )
                      .slice(0, 5)
                      .map((tag) => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          className="w-full text-left px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-white"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 上传进度指示 */}
      {isUploading && (
        <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-slate-500">
          <LoadingSpinner size="small" />
          <span>上传中...</span>
        </div>
      )}
    </div>
  );
} 