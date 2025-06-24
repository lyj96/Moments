import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: 'blue' | 'white' | 'gray';
}

export default function LoadingSpinner({ 
  size = 'medium', 
  className,
  color = 'blue'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const colorClasses = {
    blue: 'border-gray-600 border-t-blue-500',
    white: 'border-gray-600 border-t-white',
    gray: 'border-gray-600 border-t-gray-400',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
} 