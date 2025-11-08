'use client';

import { useState } from 'react';
import { getTownPassClient } from '@/lib/townpass';

export function DebugPanel() {
  const [rawReply, setRawReply] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testGetState = async () => {
    const client = getTownPassClient();

    if (!client.isFlutterEnvironment()) {
      setError('Not in Flutter environment');
      return;
    }

    try {
      // 直接呼叫 Flutter，不經過 JSON 解析
      const message = { name: 'sync_test_get_state', data: null };
      const reply = await (window as any).flutterObject.postMessage(JSON.stringify(message));

      console.log('Raw reply from Flutter:', reply);
      setRawReply(reply);
      setError('');

      // 嘗試解析
      try {
        const parsed = JSON.parse(reply);
        console.log('Parsed successfully:', parsed);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        setError(`Parse error: ${parseError}`);
      }
    } catch (e) {
      console.error('Error:', e);
      setError(`Error: ${e}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">Debug 工具</h2>

      <button
        onClick={testGetState}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        測試 getState 原始回傳
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm font-mono whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {rawReply && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">原始回傳內容：</h3>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
            {rawReply}
          </pre>
        </div>
      )}
    </div>
  );
}
