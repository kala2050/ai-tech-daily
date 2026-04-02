// components/RefreshButton.tsx

'use client';

import { useState } from 'react';

interface RefreshButtonProps {
  onRefreshStart?: () => void;
  onRefreshEnd?: () => void;
}

export default function RefreshButton({ onRefreshStart, onRefreshEnd }: RefreshButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRefresh = async () => {
    setStatus('loading');
    setErrorMessage('');
    onRefreshStart?.();

    try {
      const response = await fetch('/api/admin/collect?secret=kala2024secret');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '刷新失败');
      }

      setStatus('success');

      // 1.5秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '刷新失败');
      onRefreshEnd?.();

      // 3秒后恢复
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 3000);
    }
  };

  const buttonStyles = {
    idle: 'bg-gray-900 text-white hover:bg-gray-800',
    loading: 'bg-gray-400 text-white cursor-wait',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
  };

  const buttonText = {
    idle: '刷新数据',
    loading: '刷新中...',
    success: '刷新成功',
    error: '刷新失败',
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={status === 'loading'}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all
          flex items-center gap-2
          ${buttonStyles[status]}
        `}
      >
        {status === 'loading' && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {buttonText[status]}
      </button>

      {errorMessage && (
        <span className="text-xs text-red-600">{errorMessage}</span>
      )}
    </div>
  );
}
