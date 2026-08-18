import React from 'react';

const ProgressBar = ({ progress, status, message }) => {
  const statusColors = {
    idle: 'bg-gray-300 dark:bg-gray-600',
    loading: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  const statusMessages = {
    idle: 'Siap',
    loading: 'Memproses...',
    success: 'Selesai ✅',
    error: 'Gagal ❌',
  };

  const currentStatus = status || 'idle';
  const color = statusColors[currentStatus] || statusColors.idle;
  const displayMessage = message || statusMessages[currentStatus] || '';

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
        <span>{displayMessage}</span>
        <span>{progress || 0}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${color}`}
          style={{ width: `${progress || 0}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;