'use client';

import type { UserMode } from '@/types/townpass';

interface ModeSelectorProps {
  currentMode?: UserMode;
  onModeChange: (mode: UserMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ currentMode, onModeChange, disabled }: ModeSelectorProps) {
  const modes: { value: UserMode; label: string; icon: string }[] = [
    { value: 'pedestrian', label: '行人', icon: '🚶' },
    { value: 'bicycle', label: '自行車', icon: '🚴' },
    { value: 'vehicle', label: '汽車', icon: '🚗' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">選擇模式</h2>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            disabled={disabled}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${currentMode === mode.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className="text-3xl mb-2">{mode.icon}</div>
            <div className="font-medium">{mode.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
