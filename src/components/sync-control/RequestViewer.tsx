"use client";

import { useState } from "react";
import type { SyncRequest, SyncResponse } from "@/types/townpass";

interface RequestViewerProps {
  requests: SyncRequest[];
  responses: SyncResponse[];
  disabled?: boolean;
}

export function RequestViewer({
  requests,
  responses,
  disabled,
}: RequestViewerProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "responses">(
    "requests",
  );
  const [selectedItem, setSelectedItem] = useState<
    SyncRequest | SyncResponse | null
  >(null);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      });
    } catch {
      return timestamp;
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">Request / Response 記錄</h2>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab("requests")}
          disabled={disabled}
          className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${
            activeTab === "requests"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("responses")}
          disabled={disabled}
          className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${
            activeTab === "responses"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Responses ({responses.length})
        </button>
      </div>

      {/* Request List */}
      {activeTab === "requests" && (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              目前沒有 Request 記錄
            </div>
          ) : (
            requests.map((req, index) => (
              <div
                key={index}
                onClick={() => setSelectedItem(req)}
                className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                  selectedItem === req
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""} `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-green-600">
                      {req.method}
                    </span>
                    <span className="ml-2 font-mono text-sm text-gray-600">
                      {req.url}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(req.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Response List */}
      {activeTab === "responses" && (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {responses.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              目前沒有 Response 記錄
            </div>
          ) : (
            responses.map((res, index) => (
              <div
                key={index}
                onClick={() => setSelectedItem(res)}
                className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                  selectedItem === res
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""} `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`font-semibold ${
                        res.statusCode >= 200 && res.statusCode < 300
                          ? "text-green-600"
                          : res.statusCode >= 400
                            ? "text-red-600"
                            : "text-yellow-600"
                      } `}
                    >
                      {res.statusCode}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {res.body.substring(0, 50)}...
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(res.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-semibold">
                {"method" in selectedItem ? "Request 詳情" : "Response 詳情"}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    時間戳記
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedItem.timestamp)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    複製
                  </button>
                </div>
                <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
                  {selectedItem.timestamp}
                </pre>
              </div>

              {"method" in selectedItem && (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Method
                    </span>
                    <pre className="mt-2 rounded bg-gray-50 p-3 text-sm">
                      {selectedItem.method}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        URL
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedItem.url)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        複製
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
                      {selectedItem.url}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Body
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(formatJson(selectedItem.body))
                        }
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        複製
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
                      {formatJson(selectedItem.body)}
                    </pre>
                  </div>
                </>
              )}

              {"statusCode" in selectedItem && (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Status Code
                    </span>
                    <pre className="mt-2 rounded bg-gray-50 p-3 text-sm">
                      {selectedItem.statusCode}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Body
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedItem.body)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        複製
                      </button>
                    </div>
                    <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
                      {selectedItem.body}
                    </pre>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="mt-6 w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
