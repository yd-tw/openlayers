'use client';

import { useTownPass, useSyncMessages } from '@/lib/townpass';
import { ModeSelector } from '@/components/sync-control/ModeSelector';
import { SyncControls } from '@/components/sync-control/SyncControls';
import { StatePanel } from '@/components/sync-control/StatePanel';
import { MessageList } from '@/components/sync-control/MessageList';
import { RequestViewer } from '@/components/sync-control/RequestViewer';
import { DebugPanel } from './debug';

export default function SyncControlPage() {
  const {
    isFlutter,
    state,
    loading,
    error,
    setMode,
    setSyncInterval,
    toggleSync,
    clearMessages,
    toggleDemo,
    toggleNotifications,
    refresh,
  } = useTownPass();

  const {
    requests,
    responses,
    messages,
    clearAll,
  } = useSyncMessages();

  if (!isFlutter) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">非 Flutter 環境</h1>
          <p className="text-gray-600">
            此頁面僅能在 TownPass Flutter App 內的 WebView 中使用。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TownPass 同步控制台
          </h1>
          <p className="text-gray-600">
            控制 Flutter App 的同步功能與即時監控
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mode Selector */}
            <ModeSelector
              currentMode={state?.mode}
              onModeChange={setMode}
              disabled={loading}
            />

            {/* Sync Controls */}
            <SyncControls
              isSyncing={state?.isSyncing}
              onToggleSync={toggleSync}
              onSetInterval={setSyncInterval}
              onClearMessages={clearMessages}
              onToggleDemo={toggleDemo}
              disabled={loading}
            />

            {/* Additional Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">其他設定</h2>
              <button
                onClick={toggleNotifications}
                disabled={loading}
                className={`
                  w-full px-4 py-2 rounded-lg font-medium transition-all
                  ${state?.enableNotifications
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {state?.enableNotifications ? '🔔 通知已啟用' : '🔕 通知已停用'}
              </button>
            </div>

            {/* State Panel */}
            <StatePanel
              state={state}
              loading={loading}
              error={error}
              onRefresh={refresh}
              disabled={loading}
            />
          </div>

          {/* Right Column - Data Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Messages */}
            <MessageList
              messages={messages}
              disabled={loading}
            />

            {/* Request/Response Viewer */}
            <RequestViewer
              requests={requests}
              responses={responses}
              disabled={loading}
            />

            {/* Clear All Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <button
                onClick={clearAll}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ 清除所有記錄 (僅限前端)
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                此操作僅清除前端顯示的記錄，不影響 Flutter 端
              </p>
            </div>

            {/* Debug Panel */}
            <DebugPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
