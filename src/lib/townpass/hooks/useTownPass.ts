'use client';

import { useEffect, useState } from 'react';
import { getTownPassClient } from '../client';
import type { SyncState, UserMode } from '@/types/townpass';

export function useTownPass() {
  const [client] = useState(() => getTownPassClient());
  const [isFlutter, setIsFlutter] = useState(false);
  const [state, setState] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsFlutter(client.isFlutterEnvironment());

    if (client.isFlutterEnvironment()) {
      // 初始載入狀態
      loadState();
    }
  }, [client]);

  const loadState = async () => {
    try {
      setLoading(true);
      const currentState = await client.getState();
      console.log('TownPass: Loaded state:', currentState);
      setState(currentState);
      setError(null);
    } catch (e) {
      console.error('TownPass: Failed to load state:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to load state';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const setMode = async (mode: UserMode) => {
    try {
      setLoading(true);
      await client.setMode(mode);
      await loadState(); // 重新載入狀態
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set mode');
    } finally {
      setLoading(false);
    }
  };

  const setSyncInterval = async (intervalMs: number) => {
    try {
      await client.setSyncInterval(intervalMs);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set interval');
    }
  };

  const toggleSync = async (start: boolean) => {
    try {
      await client.toggleSync(start);
      await loadState();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle sync');
    }
  };

  const clearMessages = async () => {
    try {
      await client.clearMessages();
      await loadState();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear messages');
    }
  };

  const toggleDemo = async () => {
    try {
      await client.toggleDemo();
      await loadState();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle demo');
    }
  };

  const toggleNotifications = async () => {
    try {
      await client.toggleNotifications();
      await loadState();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle notifications');
    }
  };

  return {
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
    refresh: loadState,
  };
}
