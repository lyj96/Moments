import React from 'react';
import { clsx } from 'clsx';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export default function VideoPlayer({ src, className }: VideoPlayerProps) {
  return (
    <div className={clsx('relative', className)}>
      <video
        src={src}
        controls
        className="w-full rounded-lg shadow-sm"
        preload="metadata"
      >
        您的浏览器不支持视频播放。
      </video>
    </div>
  );
} 