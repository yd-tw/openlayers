// Flutter 使用者模式
export type UserMode = 'pedestrian' | 'bicycle' | 'vehicle';

// 訊息優先級
export type MessagePriority = 'high' | 'medium' | 'low';

// 同步訊息
export interface SyncMessage {
  id: string;
  title: string;
  content: string;
  priority: MessagePriority;
  timestamp: number;
  icon?: string;
}

// 同步狀態
export interface SyncState {
  mode: UserMode;
  isSyncing: boolean;
  isDemoMode: boolean;
  enableNotifications: boolean;
  messages: SyncMessage[];
  position: {
    latitude: number;
    longitude: number;
  } | null;
  lastSyncTime: string;
}

// Request 資料
export interface SyncRequest {
  url: string;
  method: string;
  body: any;
  timestamp: string;
}

// Response 資料
export interface SyncResponse {
  statusCode: number;
  body: string;
  timestamp: string;
}

// Flutter 訊息格式
export interface FlutterMessage {
  name: string;
  data: any;
}

// Flutter 回覆格式
export interface FlutterReply {
  name: string;
  data: any;
}
