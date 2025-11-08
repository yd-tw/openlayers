# TownPass WebView 整合說明

這份文件說明 TownPass Flutter App 與 Next.js 前端控制台的雙向通訊整合。

## 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                     Flutter App                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SyncTestViewController                              │   │
│  │  - 管理同步狀態、位置、訊息                         │   │
│  │  - 與後端 API 通訊                                   │   │
│  │  - 推送事件到 WebView                                │   │
│  └───────────┬──────────────────────────────────────────┘   │
│              │                                              │
│  ┌───────────▼──────────────────────────────────────────┐   │
│  │  WebView Message Handlers (7個)                      │   │
│  │  - sync_test_set_mode                                │   │
│  │  - sync_test_set_sync_interval                       │   │
│  │  - sync_test_toggle_sync                             │   │
│  │  - sync_test_get_state                               │   │
│  │  - sync_test_clear_messages                          │   │
│  │  - sync_test_toggle_demo                             │   │
│  │  - sync_test_toggle_notifications                    │   │
│  └───────────┬──────────────────────────────────────────┘   │
│              │                                              │
│  ┌───────────▼──────────────────────────────────────────┐   │
│  │  WebViewPushService                                  │   │
│  │  - 推送 Request/Response/Message 事件                │   │
│  │  - 使用 CustomEvent 機制                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬──────────────┬────────────────────────┘
                     │              │
                     │  flutterObject.postMessage()
                     │  CustomEvent dispatch
                     │              │
┌────────────────────▼──────────────▼────────────────────────┐
│                  Next.js WebView                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TownPassClient (SDK)                                │  │
│  │  - 發送指令到 Flutter                                │  │
│  │  - 監聽 Flutter 事件                                 │  │
│  └───────────┬──────────────────────────────────────────┘  │
│              │                                             │
│  ┌───────────▼──────────────────────────────────────────┐  │
│  │  React Hooks                                         │  │
│  │  - useTownPass: 同步狀態管理                         │  │
│  │  - useSyncMessages: 訊息監聽                         │  │
│  └───────────┬──────────────────────────────────────────┘  │
│              │                                             │
│  ┌───────────▼──────────────────────────────────────────┐  │
│  │  UI Components (5個)                                 │  │
│  │  - ModeSelector: 模式選擇                            │  │
│  │  - SyncControls: 同步控制                            │  │
│  │  - StatePanel: 狀態顯示                              │  │
│  │  - MessageList: 訊息列表                             │  │
│  │  - RequestViewer: Request/Response 檢視器            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 通訊流程

### 1. WebView → Flutter（控制指令）

```typescript
// 前端呼叫
const client = getTownPassClient();
await client.setMode('bicycle');
```

```dart
// Flutter 接收
class SyncTestSetModeMessageHandler extends TPWebMessageHandler {
  @override
  String get name => 'sync_test_set_mode';

  @override
  Future<void> handle({...}) async {
    final controller = Get.find<SyncTestViewController>();
    controller.toggleMode(mode);
    onReply?.call(replyWebMessage(data: {'success': true}));
  }
}
```

### 2. Flutter → WebView（即時事件推送）

```dart
// Flutter 推送事件
final pushService = Get.find<WebViewPushService>();
await pushService.pushRequest(
  url: apiEndpoint,
  method: 'PUT',
  body: requestData,
);
```

```typescript
// 前端監聽事件
const client = getTownPassClient();
client.onRequest((data) => {
  console.log('收到 Request:', data);
});
```

## 功能清單

### WebView 可以控制的 Flutter 功能

| 功能 | 方法 | 說明 |
|-----|------|-----|
| 設定模式 | `setMode(mode)` | 切換行人/自行車/車輛模式 |
| 調整間隔 | `setSyncInterval(ms)` | 設定同步間隔時間 |
| 開始/停止同步 | `toggleSync(start)` | 控制同步開關 |
| 取得狀態 | `getState()` | 取得當前完整狀態 |
| 清除訊息 | `clearMessages()` | 清除所有訊息 |
| Demo 模式 | `toggleDemo()` | 切換 Demo 模式 |
| 通知開關 | `toggleNotifications()` | 切換通知功能 |

### Flutter 推送到 WebView 的事件

| 事件類型 | 事件名稱 | 資料格式 |
|---------|---------|---------|
| Request | `townpass_sync_request` | `{ url, method, body, timestamp }` |
| Response | `townpass_sync_response` | `{ statusCode, body, timestamp }` |
| Message | `townpass_sync_message` | `SyncMessage` 物件 |
| State Update | `townpass_state_update` | `SyncState` 物件 |

## 使用範例

### 在 Next.js 頁面中使用

```typescript
'use client';

import { useTownPass, useSyncMessages } from '@/lib/townpass';

export default function ControlPage() {
  const {
    state,
    loading,
    error,
    setMode,
    toggleSync,
  } = useTownPass();

  const {
    requests,
    responses,
    messages,
  } = useSyncMessages();

  return (
    <div>
      <button onClick={() => setMode('bicycle')}>
        切換到自行車模式
      </button>

      <button onClick={() => toggleSync(true)}>
        開始同步
      </button>

      <div>
        訊息數量: {messages.length}
      </div>
    </div>
  );
}
```

### 完整控制台頁面

已建立的完整控制台位於：`/app/sync-control/page.tsx`

功能包含：
- 模式選擇器（行人/自行車/汽車）
- 同步控制面板（開始/停止、間隔設定）
- 狀態面板（顯示當前狀態）
- 訊息列表（顯示接收到的訊息）
- Request/Response 檢視器（查看 API 通訊記錄）

## 檔案結構

### 前端（Next.js）

```
src/
├── types/
│   └── townpass.ts              # TypeScript 型別定義
├── lib/
│   └── townpass/
│       ├── client.ts            # SDK 客戶端
│       ├── hooks/
│       │   ├── useTownPass.ts   # 狀態管理 Hook
│       │   └── useSyncMessages.ts # 訊息監聽 Hook
│       └── index.ts             # 入口檔案
├── components/
│   └── sync-control/
│       ├── ModeSelector.tsx     # 模式選擇器
│       ├── SyncControls.tsx     # 同步控制
│       ├── StatePanel.tsx       # 狀態面板
│       ├── MessageList.tsx      # 訊息列表
│       ├── RequestViewer.tsx    # Request/Response 檢視器
│       └── index.ts             # 元件入口
└── app/
    └── sync-control/
        └── page.tsx             # 控制台頁面
```

### 後端（Flutter）

```
lib/
├── page/
│   └── sync_test/
│       ├── sync_test_view_controller.dart  # 主控制器
│       └── webview_push_service.dart       # WebView 推送服務
└── util/
    └── web_message_handler/
        ├── tp_web_message_listener.dart    # 訊息監聽器
        └── sync_test_message_handler.dart  # 同步測試處理器 (7個)
```

## 測試建議

1. **在 Flutter App 中載入 WebView**
   - URL: `http://localhost:3000/sync-control`（開發環境）
   - 確認 `flutterObject` 已正確注入

2. **測試控制功能**
   - 切換模式（行人/自行車/汽車）
   - 調整同步間隔（2秒/5秒/10秒）
   - 開始/停止同步

3. **測試即時推送**
   - 開啟同步後，觀察 Request/Response 是否即時出現
   - 後端回傳訊息時，檢查訊息列表是否更新

4. **檢查 Console 輸出**
   - 前端：查看事件監聽是否正確註冊
   - Flutter：查看 debug print 輸出

## 注意事項

1. **CORS 問題**
   - 開發時建議使用 `localhost` 或 Flutter 可存取的本地 IP
   - 正式環境需設定正確的 CORS policy

2. **事件清理**
   - React hooks 已實作 cleanup，元件卸載時會自動取消監聽

3. **錯誤處理**
   - 所有 async 操作都包含 try-catch
   - 錯誤會顯示在 UI 上

4. **效能考量**
   - 訊息/Request/Response 都限制最多保留 50 筆
   - 避免記憶體溢位

## 未來擴展

可以考慮新增的功能：

1. **更多控制選項**
   - 手動觸發單次同步
   - 匯出 debug log
   - 自訂通知音效/震動模式

2. **統計資料**
   - 同步成功率
   - 平均回應時間
   - 訊息類型分布圖表

3. **進階除錯**
   - Network waterfall 顯示
   - 效能監控
   - 錯誤追蹤

## 技術支援

如有問題，請檢查：
1. Flutter debug console 輸出
2. WebView console 輸出（使用 Chrome DevTools）
3. 確認 `flutterObject` 和 `window.townpassEventHandlers` 是否存在
