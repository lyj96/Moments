import React, { useState } from 'react';
import { X, Upload, Image, Video, Tag, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { MomentCreate, MomentStatus, STATUS_OPTIONS } from '@/types';
import { momentsApi, uploadApi } from '@/utils/api';
import { validateImageFile, validateVideoFile } from '@/utils/format';
import LoadingSpinner from './LoadingSpinner';

interface CreateMomentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateMomentModal({ onClose, onSuccess }: CreateMomentModalProps) {
  const [formData, setFormData] = useState<MomentCreate>({
    content: '',
    tags: [],
    status: '闪念',
    images: [],
    videos: [],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: keyof Omit<MomentCreate, 'tags' | 'images' | 'videos'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 验证文件
    const totalImages = formData.images.length + files.length;
    if (totalImages > 9) {
      toast.error('最多只能上传9张图片');
      return;
    }

    // 验证每个文件
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
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...result.files.map(f => f.url)],
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
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, result.url],
      }));
      toast.success('视频上传成功');
    } catch (error) {
      toast.error('视频上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('请填写标题和内容');
      return;
    }

    setIsSubmitting(true);
    try {
      await momentsApi.createMoment(formData);
      toast.success('创建成功！');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">创建动态</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={handleInputChange('content')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="分享你的想法..."
              maxLength={2000}
            />
          </div>

          {/* 状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态
            </label>
            <select
              value={formData.status}
              onChange={handleInputChange('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="添加标签..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片 ({formData.images.length}/9)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Image className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  点击选择图片 (最多9张)
                </span>
              </label>
            </div>
          </div>

          {/* 视频上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              视频 ({formData.videos.length}/3)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Video className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  点击选择视频 (最多3个)
                </span>
              </label>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>创建中...</span>
                </>
              ) : (
                <span>创建动态</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 