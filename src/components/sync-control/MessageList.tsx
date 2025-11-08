'use client';

import type { SyncMessage } from '@/types/townpass';

interface MessageListProps {
  messages: SyncMessage[];
  disabled?: boolean;
}

export function MessageList({ messages, disabled }: MessageListProps) {
  const getAlertIcon = (alertMethod?: string) => {
    switch (alertMethod) {
      case 'notification': return '🔔';
      case 'vibration': return '📳';
      case 'both': return '🔔📳';
      default: return '💬';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">訊息列表</h2>

      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          目前沒有訊息
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${getPriorityColor(message.priority)}
                ${disabled ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{message.icon || '📍'}</span>
                  <div>
                    <h3 className="font-semibold">{message.title}</h3>
                    <p className="text-xs text-gray-600">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="text-lg">{getAlertIcon(message.alertMethod)}</span>
                </div>
              </div>

              <p className="text-gray-700 whitespace-pre-wrap">
                {message.content}
              </p>

              <div className="flex gap-2 mt-2 text-xs">
                {message.targetModes && message.targetModes.length > 0 && (
                  <span className="bg-white px-2 py-1 rounded border">
                    {message.targetModes.map(mode => {
                      switch (mode) {
                        case 'pedestrian': return '🚶';
                        case 'bicycle': return '🚴';
                        case 'vehicle': return '🚗';
                        default: return mode;
                      }
                    }).join(' ')}
                  </span>
                )}
                {message.priority && (
                  <span className="bg-white px-2 py-1 rounded border capitalize">
                    {message.priority}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
