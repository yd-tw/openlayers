"use client";

interface SyncControlsProps {
  isSyncing?: boolean;
  onToggleSync: (start: boolean) => void;
  onSetInterval: (intervalMs: number) => void;
  onClearMessages: () => void;
  onToggleDemo: () => void;
  disabled?: boolean;
}

export function SyncControls({
  isSyncing,
  onToggleSync,
  onSetInterval,
  onClearMessages,
  onToggleDemo,
  disabled,
}: SyncControlsProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">同步控制</h2>

      {/* 同步開關 */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => onToggleSync(true)}
            disabled={disabled || isSyncing}
            className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ▶️ 開始同步
          </button>
          <button
            onClick={() => onToggleSync(false)}
            disabled={disabled || !isSyncing}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ⏸️ 停止同步
          </button>
        </div>

        {/* 間隔設定 */}
        <div className="flex gap-2">
          <button
            onClick={() => onSetInterval(2000)}
            disabled={disabled}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            2秒間隔
          </button>
          <button
            onClick={() => onSetInterval(5000)}
            disabled={disabled}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            5秒間隔
          </button>
          <button
            onClick={() => onSetInterval(10000)}
            disabled={disabled}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            10秒間隔
          </button>
        </div>

        {/* 其他操作 */}
        <div className="flex gap-2">
          <button
            onClick={onClearMessages}
            disabled={disabled}
            className="flex-1 rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 disabled:opacity-50"
          >
            🗑️ 清除訊息
          </button>
          <button
            onClick={onToggleDemo}
            disabled={disabled}
            className="flex-1 rounded-lg bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
          >
            🎮 Demo 模式
          </button>
        </div>
      </div>
    </div>
  );
}
