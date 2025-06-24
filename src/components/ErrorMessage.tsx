import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <div className={clsx(
      'bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4',
      className
    )}>
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
        <div className="flex-1">
          <p className="text-red-300 font-medium">出错了</p>
          <p className="text-red-400 text-sm mt-1">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 bg-red-800 bg-opacity-30 text-red-300 px-3 py-1 rounded-md hover:bg-red-700 hover:bg-opacity-40 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重试</span>
          </button>
        )}
      </div>
    </div>
  );
} 