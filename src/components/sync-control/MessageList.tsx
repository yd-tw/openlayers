"use client";

import type { SyncMessage } from "@/types/townpass";

interface MessageListProps {
  messages: SyncMessage[];
  disabled?: boolean;
}

export function MessageList({ messages, disabled }: MessageListProps) {
  const getAlertIcon = (alertMethod?: string) => {
    switch (alertMethod) {
      case "notification":
        return "🔔";
      case "vibration":
        return "📳";
      case "both":
        return "🔔📳";
      default:
        return "💬";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">訊息列表</h2>

      {messages.length === 0 ? (
        <div className="py-8 text-center text-gray-500">目前沒有訊息</div>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border-2 p-4 transition-all ${getPriorityColor(message.priority)} ${disabled ? "opacity-50" : ""} `}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{message.icon || "📍"}</span>
                  <div>
                    <h3 className="font-semibold">{message.title}</h3>
                    <p className="text-xs text-gray-600">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="text-lg">
                    {getAlertIcon(message.alertMethod)}
                  </span>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-gray-700">
                {message.content}
              </p>

              <div className="mt-2 flex gap-2 text-xs">
                {message.targetModes && message.targetModes.length > 0 && (
                  <span className="rounded border bg-white px-2 py-1">
                    {message.targetModes
                      .map((mode) => {
                        switch (mode) {
                          case "pedestrian":
                            return "🚶";
                          case "bicycle":
                            return "🚴";
                          case "vehicle":
                            return "🚗";
                          default:
                            return mode;
                        }
                      })
                      .join(" ")}
                  </span>
                )}
                {message.priority && (
                  <span className="rounded border bg-white px-2 py-1 capitalize">
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
