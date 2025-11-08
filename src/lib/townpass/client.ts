import type {
  FlutterMessage,
  FlutterReply,
  UserMode,
  SyncState,
  SyncMessage,
  SyncRequest,
  SyncResponse,
} from "@/types/townpass";

declare global {
  interface Window {
    flutterObject?: {
      postMessage: (message: string) => Promise<string>;
    };
    flutter_inappwebview?: {
      callHandler: (handlerName: string, ...args: any[]) => Promise<any>;
    };
    townpassEventHandlers?: boolean;
  }
}

export class TownPassClient {
  private flutter: Window["flutterObject"];
  private eventHandlersInitialized = false;

  constructor() {
    this.flutter =
      typeof window !== "undefined" ? window.flutterObject : undefined;

    if (!this.flutter) {
      console.warn("TownPass: flutterObject not found. Running in web mode.");
    } else {
      console.log("TownPass: Using JavaScriptHandler bridge");
    }

    this.initEventHandlers();
  }

  private initEventHandlers() {
    if (this.eventHandlersInitialized || typeof window === "undefined") return;

    // Mark event handlers as initialized for Flutter to detect
    window.townpassEventHandlers = true;

    this.eventHandlersInitialized = true;
    console.log("TownPass: Event handlers initialized");
  }

  /**
   * 檢查是否在 Flutter WebView 環境中
   */
  isFlutterEnvironment(): boolean {
    return !!this.flutter;
  }

  /**
   * 發送訊息到 Flutter（使用 JavaScriptHandler - 更可靠）
   */
  private async sendMessage(name: string, data: any = null): Promise<any> {
    // 優先使用 JavaScriptHandler API（更可靠）
    if (typeof window !== "undefined" && window.flutter_inappwebview) {
      try {
        console.log(`TownPass: Calling handler '${name}' with data:`, data);
        const result = await window.flutter_inappwebview.callHandler(
          name,
          data,
        );
        console.log(`TownPass: Handler '${name}' returned:`, result);
        return result?.data ?? result;
      } catch (e) {
        console.error(`TownPass: Error calling handler '${name}':`, e);
        throw e;
      }
    }

    // Fallback: 使用舊的 WebMessageListener API
    if (!this.flutter) {
      throw new Error("Not running in Flutter WebView");
    }

    let reply: string | undefined;
    try {
      const message: FlutterMessage = { name, data };
      reply = await this.flutter.postMessage(JSON.stringify(message));

      console.log(
        "TownPass: Received reply from Flutter (type):",
        typeof reply,
      );
      console.log(
        "TownPass: Received reply from Flutter (length):",
        reply?.length,
      );
      console.log(
        "TownPass: Received reply from Flutter (first 200 chars):",
        reply?.substring(0, 200),
      );

      // 檢查 reply 是否有效
      if (!reply || typeof reply !== "string") {
        throw new Error(`Invalid reply type: ${typeof reply}`);
      }

      // 嘗試找出問題字符
      const problematicChars = reply.match(/undefined|null(?![a-z])|NaN/gi);
      if (problematicChars) {
        console.error("TownPass: Found problematic values:", problematicChars);
      }

      const parsed: FlutterReply = JSON.parse(reply);
      console.log("TownPass: Parsed successfully:", parsed);
      return parsed.data;
    } catch (e) {
      console.error("TownPass: Error in sendMessage:", e);
      console.error("TownPass: Message name:", name);
      console.error("TownPass: Message data:", data);
      if (e instanceof SyntaxError) {
        console.error("TownPass: This is a JSON parse error");
        // 嘗試顯示錯誤位置附近的內容
        console.error("TownPass: Reply content:", reply);
      }
      throw e;
    }
  }

  // === 控制功能（WebView → Flutter） ===

  /**
   * 設定使用者模式
   */
  async setMode(mode: UserMode): Promise<void> {
    await this.sendMessage("sync_test_set_mode", mode);
  }

  /**
   * 設定同步間隔（毫秒）
   */
  async setSyncInterval(intervalMs: number): Promise<void> {
    await this.sendMessage("sync_test_set_sync_interval", intervalMs);
  }

  /**
   * 開始/停止同步
   */
  async toggleSync(start: boolean): Promise<void> {
    await this.sendMessage("sync_test_toggle_sync", start);
  }

  /**
   * 取得當前狀態
   */
  async getState(): Promise<SyncState> {
    return await this.sendMessage("sync_test_get_state");
  }

  /**
   * 清除訊息
   */
  async clearMessages(): Promise<void> {
    await this.sendMessage("sync_test_clear_messages");
  }

  /**
   * 切換 Demo 模式
   */
  async toggleDemo(): Promise<void> {
    await this.sendMessage("sync_test_toggle_demo");
  }

  /**
   * 切換推送通知
   */
  async toggleNotifications(): Promise<void> {
    await this.sendMessage("sync_test_toggle_notifications");
  }

  // === 事件監聽（Flutter → WebView） ===

  /**
   * 監聽 Request 事件
   */
  onRequest(callback: (data: SyncRequest) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        if (customEvent.detail) {
          callback(customEvent.detail);
        }
      } catch (e) {
        console.error("TownPass: Error in onRequest handler:", e);
      }
    };

    window.addEventListener("townpass_sync_request", handler);
    console.log("TownPass: onRequest listener registered");

    return () => {
      window.removeEventListener("townpass_sync_request", handler);
    };
  }

  /**
   * 監聽 Response 事件
   */
  onResponse(callback: (data: SyncResponse) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        if (customEvent.detail) {
          callback(customEvent.detail);
        }
      } catch (e) {
        console.error("TownPass: Error in onResponse handler:", e);
      }
    };

    window.addEventListener("townpass_sync_response", handler);
    console.log("TownPass: onResponse listener registered");

    return () => {
      window.removeEventListener("townpass_sync_response", handler);
    };
  }

  /**
   * 監聽新訊息
   */
  onMessage(callback: (message: SyncMessage) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        if (customEvent.detail) {
          callback(customEvent.detail);
        }
      } catch (e) {
        console.error("TownPass: Error in onMessage handler:", e);
      }
    };

    window.addEventListener("townpass_sync_message", handler);
    console.log("TownPass: onMessage listener registered");

    return () => {
      window.removeEventListener("townpass_sync_message", handler);
    };
  }

  /**
   * 監聽狀態變更
   */
  onStateChange(callback: (state: Partial<SyncState>) => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    window.addEventListener("townpass_state_update", handler);
    console.log("TownPass: onStateChange listener registered");

    return () => {
      window.removeEventListener("townpass_state_update", handler);
    };
  }
}

// 單例模式
let instance: TownPassClient | null = null;

export function getTownPassClient(): TownPassClient {
  if (!instance) {
    instance = new TownPassClient();
  }
  return instance;
}
