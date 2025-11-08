"use client";

import { useState } from "react";

interface ErrorResponse {
  error: string;
  details?: string;
}

export default function PathfindingTest() {
  const [startLat, setStartLat] = useState<string>("25.0169482");
  const [startLng, setStartLng] = useState<string>("121.5337558");
  const [endLat, setEndLat] = useState<string>("25.0455956");
  const [endLng, setEndLng] = useState<string>("121.5195799");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/pathfinding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        setError(
          errorData.error + (errorData.details ? `: ${errorData.details}` : ""),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知錯誤");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setStartLat("25.0169482");
    setStartLng("121.5337558");
    setEndLat("25.0455956");
    setEndLng("121.5195799");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Pathfinding API 測試頁面
        </h1>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* 起點 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  起點座標
                </h2>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    緯度 (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={startLat}
                    onChange={(e) => setStartLat(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    經度 (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={startLng}
                    onChange={(e) => setStartLng(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* 終點 */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  終點座標
                </h2>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    緯度 (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={endLat}
                    onChange={(e) => setEndLat(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    經度 (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={endLng}
                    onChange={(e) => setEndLng(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? "尋找路徑中..." : "尋找路徑"}
              </button>
              <button
                type="button"
                onClick={loadExample}
                className="rounded-md bg-gray-200 px-6 py-2 text-gray-800 transition-colors hover:bg-gray-300"
              >
                載入範例
              </button>
            </div>
          </form>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-1 font-semibold text-red-800">錯誤</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 結果顯示 */}
        {result && (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              API 回傳結果 (GeoJSON)
            </h2>
            <pre className="max-h-[600px] overflow-x-auto overflow-y-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
