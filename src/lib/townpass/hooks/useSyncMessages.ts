'use client';

import { useEffect, useState } from 'react';
import { getTownPassClient } from '../client';
import type { SyncRequest, SyncResponse, SyncMessage } from '@/types/townpass';

export function useSyncMessages() {
  const [client] = useState(() => getTownPassClient());
  const [requests, setRequests] = useState<SyncRequest[]>([]);
  const [responses, setResponses] = useState<SyncResponse[]>([]);
  const [messages, setMessages] = useState<SyncMessage[]>([]);

  useEffect(() => {
    if (!client.isFlutterEnvironment()) return;

    // 監聽 Request
    const unsubRequest = client.onRequest((data) => {
      setRequests(prev => [data, ...prev].slice(0, 20)); // 保留最近 20 筆（減少記憶體使用）
    });

    // 監聽 Response
    const unsubResponse = client.onResponse((data) => {
      setResponses(prev => [data, ...prev].slice(0, 20));
    });

    // 監聽訊息
    const unsubMessage = client.onMessage((message) => {
      setMessages(prev => [message, ...prev].slice(0, 20));
    });

    return () => {
      unsubRequest();
      unsubResponse();
      unsubMessage();
    };
  }, [client]);

  const clearAll = () => {
    setRequests([]);
    setResponses([]);
    setMessages([]);
  };

  return {
    requests,
    responses,
    messages,
    clearAll,
  };
}
