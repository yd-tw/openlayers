# 地圖模式選擇器整合說明

## 功能概述

現在地圖首頁支援從 WebView 選擇使用者模式（行人/自行車/車輛），並將選擇結果傳送回 Flutter。

## 實現細節

### 網站端 (Next.js)

#### 1. 新增檔案

- **`src/components/MapModeSelector.tsx`** - 模式選擇器組件
  - 顯示三個按鈕：行人🚶、自行車🚴、車輛🚗
  - 使用 `useTownPass` hook 與 Flutter 通訊
  - 自動同步 Flutter 狀態

#### 2. 修改檔案

- **`src/components/TaipeiMap.js`**
  - 引入 `MapModeSelector` 組件
  - 將選擇器放置在地圖上方中央（absolute positioning）

- **`src/types/townpass.ts`**
  - 更新 `SyncMessage` 介面，新增：
    - `alertMethod?: string`
    - `vibrationPattern?: string`
    - `type?: string`
    - `targetModes?: UserMode[]`

- **`src/lib/townpass/client.ts`**
  - 修復 TypeScript 錯誤（`reply` 變數作用域）

### Flutter 端

無需修改！已有的 message handlers 完全支援：

- **`SyncTestSetModeMessageHandler`** (已註冊)
  - 接收模式：'pedestrian' | 'bicycle' | 'vehicle'
  - 更新 `SyncTestViewController` 的 `currentMode`

## 使用方式

### 1. 啟動網站開發伺服器

```bash
cd /Users/dada878/Documents/Frontend/taipei-codefest-2025
npm run dev
```

### 2. Flutter 端設定

確保 Flutter 應用中的 WebView 指向正確的 URL：

```dart
// 開發模式
destinationUrl: 'http://localhost:3000'

// 或使用本機 IP（真機測試）
destinationUrl: 'http://192.168.x.x:3000'
```

### 3. 測試流程

1. 在 Flutter 應用中打開地圖頁面
2. 頁面頂部會顯示三個模式按鈕
3. 點擊任一按鈕（行人/自行車/車輛）
4. 模式會立即傳送到 Flutter
5. Flutter 的 `SyncTestViewController.currentMode` 會更新
6. 後續的同步請求會使用新的模式（type: human/bicycle/car）

## 通訊流程

```
WebView (地圖頁面)
  ↓ 點擊模式按鈕
MapModeSelector 組件
  ↓ setMode('bicycle')
useTownPass hook
  ↓ townPassClient.setMode()
Flutter WebView Bridge
  ↓ sync_test_set_mode message
SyncTestSetModeMessageHandler
  ↓ controller.toggleMode()
SyncTestViewController
  ↓ currentMode.value = UserMode.bicycle
```

## UI 設計

### 按鈕狀態

- **選中狀態**：對應顏色高亮 + 放大 + 白色外框
  - 行人：綠色 (bg-green-500)
  - 自行車：藍色 (bg-blue-500)
  - 車輛：紫色 (bg-purple-500)

- **未選中狀態**：灰色 (bg-gray-400)

- **載入狀態**：半透明 + 禁用點擊

### 位置

- 置於地圖上方中央
- 使用 absolute positioning
- z-index: 10（確保在地圖之上）

## 離線模式

當不在 Flutter WebView 環境中時：

- 顯示「離線模式」標籤
- 按鈕僅更新本地狀態
- 不會嘗試與 Flutter 通訊

## 錯誤處理

- 如果 Flutter 回覆錯誤，會在 console 顯示
- 使用者界面不會卡住
- 可以繼續嘗試切換模式

## 開發注意事項

### 熱重載

修改模式選擇器組件後：

```bash
# Next.js 會自動熱重載
# Flutter 需要手動重載
flutter run
```

### 調試

在瀏覽器 DevTools Console 中可以看到：

```javascript
TownPass: Event handlers initialized
TownPass: Received reply from Flutter (type): string
TownPass: Parsed successfully: {...}
```

### 構建

生產環境構建：

```bash
npm run build
npm start
```

## 相關檔案

### 網站端

- `src/components/MapModeSelector.tsx`
- `src/components/TaipeiMap.js`
- `src/lib/townpass/client.ts`
- `src/lib/townpass/hooks/useTownPass.ts`
- `src/types/townpass.ts`

### Flutter 端

- `lib/util/web_message_handler/sync_test_message_handler.dart`
- `lib/util/web_message_handler/tp_web_message_listener.dart`
- `lib/page/sync_test/sync_test_view_controller.dart`

## 測試清單

- [ ] 在 Flutter WebView 中打開地圖頁面
- [ ] 點擊「行人」按鈕
  - [ ] 按鈕變為綠色高亮
  - [ ] Flutter 模式更新為 pedestrian
  - [ ] 後續請求 type 為 "human"
- [ ] 點擊「自行車」按鈕
  - [ ] 按鈕變為藍色高亮
  - [ ] Flutter 模式更新為 bicycle
  - [ ] 後續請求 type 為 "bicycle"
- [ ] 點擊「車輛」按鈕
  - [ ] 按鈕變為紫色高亮
  - [ ] Flutter 模式更新為 vehicle
  - [ ] 後續請求 type 為 "car"
- [ ] 在瀏覽器中打開（非 Flutter）
  - [ ] 顯示「離線模式」標籤
  - [ ] 按鈕可點擊但不會與 Flutter 通訊
