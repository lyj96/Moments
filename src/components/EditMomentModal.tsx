import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Moment, MomentUpdate, MomentStatus, STATUS_OPTIONS } from '@/types';
import { momentsApi, uploadApi } from '@/utils/api';
import { buildImageUrl } from '@/utils/format';
import LoadingSpinner from './LoadingSpinner';

interface EditMomentModalProps {
  moment: Moment;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditMomentModal({ moment, isOpen, onClose, onUpdate }: EditMomentModalProps) {
  const [formData, setFormData] = useState<MomentUpdate>({
    content: moment.content || '',
    tags: moment.tags || [],
    status: moment.status,
    images: moment.images || [],
    videos: moment.videos || [],
  });
  
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadConfig, setUploadConfig] = useState<any>(null);

  // 加载上传配置
  useEffect(() => {
    const loadUploadConfig = async () => {
      try {
        const config = await uploadApi.getUploadConfig();
        setUploadConfig(config);
      } catch (error) {
        console.error('加载上传配置失败:', error);
      }
    };
    
    if (isOpen) {
      loadUploadConfig();
    }
  }, [isOpen]);

  // 重置表单数据
  useEffect(() => {
    if (isOpen) {
      setFormData({
        content: moment.content || '',
        tags: moment.tags || [],
        status: moment.status,
        images: moment.images || [],
        videos: moment.videos || [],
      });
      setNewTag('');
    }
  }, [isOpen, moment]);

  const handleInputChange = (field: keyof MomentUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleFileUpload = async (files: FileList, type: 'image' | 'video') => {
    if (!files.length) return;

    setUploadingFiles(true);
    try {
      const fileArray = Array.from(files);
      
      if (type === 'image') {
        const uploadPromises = fileArray.map(file => uploadApi.uploadImage(file));
        const results = await Promise.all(uploadPromises);
        const newImages = results.map(result => result.url);
        
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...newImages]
        }));
      } else {
        const uploadPromises = fileArray.map(file => uploadApi.uploadVideo(file));
        const results = await Promise.all(uploadPromises);
        const newVideos = results.map(result => result.url);
        
        setFormData(prev => ({
          ...prev,
          videos: [...(prev.videos || []), ...newVideos]
        }));
      }
      
      toast.success('文件上传成功');
    } catch (error) {
      toast.error('文件上传失败');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = (fileUrl: string, type: 'image' | 'video') => {
    if (type === 'image') {
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter(url => url !== fileUrl) || []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        videos: prev.videos?.filter(url => url !== fileUrl) || []
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content?.trim()) {
      toast.error('请输入动态内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await momentsApi.updateMoment(moment.id, formData);
      toast.success('动态更新成功');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            编辑动态
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              标题（可选）
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="输入标题..."
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              内容 *
            </label>
            <textarea
              value={formData.content || ''}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
              placeholder="分享你的想法..."
              required
            />
          </div>

          {/* 状态 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              状态
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as MomentStatus)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="添加标签..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              图片
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {formData.images?.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={buildImageUrl(imageUrl)}
                    alt={`图片 ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(imageUrl, 'image')}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'image')}
              className="hidden"
              id="image-upload"
              disabled={uploadingFiles}
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>上传图片</span>
            </label>
          </div>

          {/* 视频上传 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              视频
            </label>
            <div className="space-y-2 mb-2">
              {formData.videos?.map((videoUrl, index) => (
                <div key={index} className="relative group">
                  <video
                    src={buildImageUrl(videoUrl)}
                    controls
                    className="w-full rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(videoUrl, 'video')}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'video')}
              className="hidden"
              id="video-upload"
              disabled={uploadingFiles}
            />
            <label
              htmlFor="video-upload"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>上传视频</span>
            </label>
          </div>

          {/* 上传状态 */}
          {uploadingFiles && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <LoadingSpinner size="small" />
              <span>正在上传文件...</span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="small" />
                  <span>更新中...</span>
                </div>
              ) : (
                '更新动态'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 