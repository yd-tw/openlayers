"use client";

import { useTownPass, useSyncMessages } from "@/lib/townpass";
import { ModeSelector } from "@/components/sync-control/ModeSelector";
import { SyncControls } from "@/components/sync-control/SyncControls";
import { StatePanel } from "@/components/sync-control/StatePanel";
import { MessageList } from "@/components/sync-control/MessageList";
import { RequestViewer } from "@/components/sync-control/RequestViewer";
import { DebugPanel } from "./debug";

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

  const { requests, responses, messages, clearAll } = useSyncMessages();

  if (!isFlutter) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold">非 Flutter 環境</h1>
          <p className="text-gray-600">
            此頁面僅能在 TownPass Flutter App 內的 WebView 中使用。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            TownPass 同步控制台
          </h1>
          <p className="text-gray-600">控制 Flutter App 的同步功能與即時監控</p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Controls */}
          <div className="space-y-6 lg:col-span-1">
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
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">其他設定</h2>
              <button
                onClick={toggleNotifications}
                disabled={loading}
                className={`w-full rounded-lg px-4 py-2 font-medium transition-all ${
                  state?.enableNotifications
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {state?.enableNotifications ? "🔔 通知已啟用" : "🔕 通知已停用"}
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
          <div className="space-y-6 lg:col-span-2">
            {/* Messages */}
            <MessageList messages={messages} disabled={loading} />

            {/* Request/Response Viewer */}
            <RequestViewer
              requests={requests}
              responses={responses}
              disabled={loading}
            />

            {/* Clear All Button */}
            <div className="rounded-lg bg-white p-6 shadow">
              <button
                onClick={clearAll}
                disabled={loading}
                className="w-full rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                🗑️ 清除所有記錄 (僅限前端)
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
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
