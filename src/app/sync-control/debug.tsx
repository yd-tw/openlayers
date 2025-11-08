"use client";

import { useState } from "react";
import { getTownPassClient } from "@/lib/townpass";

export function DebugPanel() {
  const [rawReply, setRawReply] = useState<string>("");
  const [error, setError] = useState<string>("");

  const testGetState = async () => {
    const client = getTownPassClient();

    if (!client.isFlutterEnvironment()) {
      setError("Not in Flutter environment");
      return;
    }

    try {
      // 直接呼叫 Flutter，不經過 JSON 解析
      const message = { name: "sync_test_get_state", data: null };
      const reply = await (window as any).flutterObject.postMessage(
        JSON.stringify(message),
      );

      console.log("Raw reply from Flutter:", reply);
      setRawReply(reply);
      setError("");

      // 嘗試解析
      try {
        const parsed = JSON.parse(reply);
        console.log("Parsed successfully:", parsed);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        setError(`Parse error: ${parseError}`);
      }
    } catch (e) {
      console.error("Error:", e);
      setError(`Error: ${e}`);
    }
  };

  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Debug 工具</h2>

      <button
        onClick={testGetState}
        className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        測試 getState 原始回傳
      </button>

      {error && (
        <div className="mt-4 rounded-lg border-2 border-red-500 bg-red-50 p-3">
          <p className="font-mono text-sm whitespace-pre-wrap text-red-700">
            {error}
          </p>
        </div>
      )}

      {rawReply && (
        <div className="mt-4">
          <h3 className="mb-2 font-semibold">原始回傳內容：</h3>
          <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-xs">
            {rawReply}
          </pre>
        </div>
      )}
    </div>
  );
}
