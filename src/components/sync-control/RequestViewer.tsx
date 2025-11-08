'use client';

import { useState } from 'react';
import type { SyncRequest, SyncResponse } from '@/types/townpass';

interface RequestViewerProps {
  requests: SyncRequest[];
  responses: SyncResponse[];
  disabled?: boolean;
}

export function RequestViewer({ requests, responses, disabled }: RequestViewerProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'responses'>('requests');
  const [selectedItem, setSelectedItem] = useState<SyncRequest | SyncResponse | null>(null);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Request / Response 記錄</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('requests')}
          disabled={disabled}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium transition-all
            ${activeTab === 'requests'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          disabled={disabled}
          className={`
            flex-1 px-4 py-2 rounded-lg font-medium transition-all
            ${activeTab === 'responses'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          Responses ({responses.length})
        </button>
      </div>

      {/* Request List */}
      {activeTab === 'requests' && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              目前沒有 Request 記錄
            </div>
          ) : (
            requests.map((req, index) => (
              <div
                key={index}
                onClick={() => setSelectedItem(req)}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedItem === req
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-green-600">{req.method}</span>
                    <span className="ml-2 text-sm text-gray-600 font-mono">
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
      {activeTab === 'responses' && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {responses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              目前沒有 Response 記錄
            </div>
          ) : (
            responses.map((res, index) => (
              <div
                key={index}
                onClick={() => setSelectedItem(res)}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedItem === res
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`
                      font-semibold
                      ${res.statusCode >= 200 && res.statusCode < 300
                        ? 'text-green-600'
                        : res.statusCode >= 400
                        ? 'text-red-600'
                        : 'text-yellow-600'
                      }
                    `}>
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                {'method' in selectedItem ? 'Request 詳情' : 'Response 詳情'}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">時間戳記</span>
                  <button
                    onClick={() => copyToClipboard(selectedItem.timestamp)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    複製
                  </button>
                </div>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                  {selectedItem.timestamp}
                </pre>
              </div>

              {'method' in selectedItem && (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Method</span>
                    <pre className="bg-gray-50 p-3 rounded text-sm mt-2">
                      {selectedItem.method}
                    </pre>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">URL</span>
                      <button
                        onClick={() => copyToClipboard(selectedItem.url)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        複製
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      {selectedItem.url}
                    </pre>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Body</span>
                      <button
                        onClick={() => copyToClipboard(formatJson(selectedItem.body))}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        複製
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      {formatJson(selectedItem.body)}
                    </pre>
                  </div>
                </>
              )}

              {'statusCode' in selectedItem && (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status Code</span>
                    <pre className="bg-gray-50 p-3 rounded text-sm mt-2">
                      {selectedItem.statusCode}
                    </pre>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Body</span>
                      <button
                        onClick={() => copyToClipboard(selectedItem.body)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        複製
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      {selectedItem.body}
                    </pre>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
