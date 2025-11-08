'use client';

import { useState } from 'react';

interface Point {
  lat: number;
  lng: number;
}

interface PathPoint extends Point {
  segmentId?: number;
}

interface Statistics {
  totalDistance: number;
  bikeDistance: number;
  bikePercentage: number;
  segmentCount: number;
}

interface Segment {
  id: number;
  name: string;
  bike: number;
  distance: number;
}

interface PathfindingResponse {
  success: boolean;
  path: PathPoint[];
  statistics: Statistics;
  segments: Segment[];
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default function PathfindingTest() {
  const [startLat, setStartLat] = useState<string>('25.0169482');
  const [startLng, setStartLng] = useState<string>('121.5337558');
  const [endLat, setEndLat] = useState<string>('25.0455956');
  const [endLng, setEndLng] = useState<string>('121.5195799');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PathfindingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/pathfinding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: {
            lat: parseFloat(startLat),
            lng: parseFloat(startLng),
          },
          end: {
            lat: parseFloat(endLat),
            lng: parseFloat(endLng),
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        const errorData = data as ErrorResponse;
        setError(errorData.error + (errorData.details ? `: ${errorData.details}` : ''));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setStartLat('25.0169482');
    setStartLng('121.5337558');
    setEndLat('25.0455956');
    setEndLng('121.5195799');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Pathfinding API 測試頁面
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 起點 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">起點座標</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    緯度 (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={startLat}
                    onChange={(e) => setStartLat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    經度 (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={startLng}
                    onChange={(e) => setStartLng(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* 終點 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">終點座標</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    緯度 (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={endLat}
                    onChange={(e) => setEndLat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    經度 (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={endLng}
                    onChange={(e) => setEndLng(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '尋找路徑中...' : '尋找路徑'}
              </button>
              <button
                type="button"
                onClick={loadExample}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                載入範例
              </button>
            </div>
          </form>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-1">錯誤</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 結果顯示 */}
        {result && (
          <div className="space-y-6">
            {/* 統計資訊 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">統計資訊</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">總距離</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.statistics.totalDistance.toFixed(2)} m
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">自行車道距離</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.statistics.bikeDistance.toFixed(2)} m
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">自行車道佔比</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {result.statistics.bikePercentage.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">路段數量</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {result.statistics.segmentCount}
                  </p>
                </div>
              </div>
            </div>

            {/* 路徑點列表 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                路徑點 ({result.path.length} 個點)
              </h2>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        緯度
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        經度
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        路段 ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.path.map((point, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {point.lat.toFixed(7)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {point.lng.toFixed(7)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {point.segmentId || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 路段詳細資訊 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                路段詳細資訊 ({result.segments.length} 個路段)
              </h2>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        名稱
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        自行車道
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        距離 (m)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.segments.map((segment) => (
                      <tr key={segment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{segment.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{segment.name}</td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              segment.bike === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {segment.bike === 1 ? '是' : '否'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {segment.distance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* JSON 原始資料 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">JSON 原始資料</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
