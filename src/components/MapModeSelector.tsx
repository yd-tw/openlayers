'use client';

import { useState, useEffect } from 'react';
import { useTownPass } from '@/lib/townpass/hooks/useTownPass';
import type { UserMode } from '@/types/townpass';

interface ModeSelectorProps {
  className?: string;
}

export default function MapModeSelector({ className = '' }: ModeSelectorProps) {
  const { isFlutter, state, setMode, loading } = useTownPass();
  const [currentMode, setCurrentMode] = useState<UserMode>('pedestrian');

  // 同步 Flutter 狀態
  useEffect(() => {
    if (state?.mode) {
      setCurrentMode(state.mode);
    }
  }, [state?.mode]);

  const modes: Array<{
    value: UserMode;
    label: string;
    icon: string;
    color: string;
  }> = [
    {
      value: 'pedestrian',
      label: '行人',
      icon: '🚶',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      value: 'bicycle',
      label: '自行車',
      icon: '🚴',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      value: 'vehicle',
      label: '車輛',
      icon: '🚗',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const handleModeChange = async (mode: UserMode) => {
    if (!isFlutter) {
      // 非 Flutter 環境，僅更新本地狀態
      setCurrentMode(mode);
      return;
    }

    try {
      await setMode(mode);
    } catch (error) {
      console.error('Failed to change mode:', error);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {modes.map((mode) => {
        const isActive = currentMode === mode.value;
        const isDisabled = loading;

        return (
          <button
            key={mode.value}
            onClick={() => handleModeChange(mode.value)}
            disabled={isDisabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white
              transition-all duration-200 shadow-md
              ${isActive ? mode.color : 'bg-gray-400 hover:bg-gray-500'}
              ${isActive ? 'scale-105 ring-2 ring-white' : ''}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-2xl">{mode.icon}</span>
            <span className="text-sm">{mode.label}</span>
          </button>
        );
      })}

      {!isFlutter && (
        <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
          離線模式
        </div>
      )}
    </div>
  );
}
