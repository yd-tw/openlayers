'use client';

import type { SyncState } from '@/types/townpass';

interface StatePanelProps {
  state: SyncState | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  disabled?: boolean;
}

export function StatePanel({ state, loading, error, onRefresh, disabled }: StatePanelProps) {
  const getModeIcon = (mode?: string) => {
    switch (mode) {
      case 'pedestrian': return '🚶';
      case 'bicycle': return '🚴';
      case 'vehicle': return '🚗';
      default: return '❓';
    }
  };

  const getModeName = (mode?: string) => {
    switch (mode) {
      case 'pedestrian': return '行人';
      case 'bicycle': return '自行車';
      case 'vehicle': return '汽車';
      default: return '未知';
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '尚未同步';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const formatPosition = (position?: { latitude: number; longitude: number } | null) => {
    if (!position) return '尚未取得';
    return `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">同步狀態</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={disabled || loading}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ 載入中...' : '🔄 重新整理'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm">錯誤: {error}</p>
        </div>
      )}

      {!state && !loading ? (
        <div className="text-center text-gray-500 py-8">
          無法取得狀態資訊
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">當前模式</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getModeIcon(state?.mode)}</span>
              <span className="font-semibold">{getModeName(state?.mode)}</span>
            </div>
          </div>

          {/* Sync Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">同步狀態</span>
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${state?.isSyncing
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-700'
              }
            `}>
              {state?.isSyncing ? '🟢 進行中' : '⚫ 已停止'}
            </span>
          </div>

          {/* Demo Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Demo 模式</span>
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${state?.isDemoMode
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-200 text-gray-700'
              }
            `}>
              {state?.isDemoMode ? '✓ 啟用' : '✗ 停用'}
            </span>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">通知</span>
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${state?.enableNotifications
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-200 text-gray-700'
              }
            `}>
              {state?.enableNotifications ? '🔔 啟用' : '🔕 停用'}
            </span>
          </div>

          {/* Position */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 block mb-2">當前位置</span>
            <span className="text-sm text-gray-600 font-mono">
              {formatPosition(state?.position)}
            </span>
          </div>

          {/* Last Sync Time */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 block mb-2">最後同步時間</span>
            <span className="text-sm text-gray-600">
              {formatTime(state?.lastSyncTime)}
            </span>
          </div>

          {/* Message Count */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">訊息數量</span>
            <span className="text-lg font-semibold text-gray-900">
              {state?.messages?.length || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
