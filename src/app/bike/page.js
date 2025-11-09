"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat, toLonLat } from "ol/proj";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";
import { Point } from "ol/geom";
import { Feature } from "ol";
import { ArrowLeftIcon } from "lucide-react";

export default function MapComponent() {
  const searchParams = useSearchParams();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const isSelectingPathRef = useRef(false);
  const [isSelectingPath, setIsSelectingPath] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [pathStats, setPathStats] = useState(null); // 路徑統計資訊
  const [map, setMap] = useState(null);
  const [view, setView] = useState(null);
  const markersLayerRef = useRef(null);
  const pathLayerRef = useRef(null);
  const [center, setCenter] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 讀取 URL 參數
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const zoomParam = searchParams.get("zoom");

    // 設定預設值（若參數不存在或格式錯誤）
    const lat = latParam ? parseFloat(latParam) : 23.5;
    const lon = lonParam ? parseFloat(lonParam) : 121.0;
    const zoom = zoomParam ? parseFloat(zoomParam) : 18;

    const initialView = new View({
      center: fromLonLat([lon, lat]),
      zoom,
    });

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        attributions: "© OpenStreetMap © CARTO",
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer],
      view: initialView,
    });

    map.on("moveend", () => {
      const center = toLonLat(map.getView().getCenter());
      setCenter(center);
    });

    mapInstanceRef.current = map;
    setMap(map);
    setView(initialView);

    // 建立標記圖層（用於顯示起點和終點）
    const markersSource = new VectorSource();
    const markersLayer = new VectorLayer({
      source: markersSource,
      style: () => {
        return new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: "#fd853a" }),
            stroke: new Stroke({ color: "#ffffff", width: 2 }),
          }),
        });
      },
    });
    map.addLayer(markersLayer);
    markersLayerRef.current = markersLayer;

    // 建立路徑圖層
    const pathSource = new VectorSource();
    const pathLayer = new VectorLayer({
      source: pathSource,
      style: (feature) => {
        const isBikeLane = feature.get("isBikeLane");
        const color = isBikeLane ? "#fd853a" : "#5ab4c5";
        const zoom = mapInstanceRef.current?.getView()?.getZoom() ?? 18;
        const width = Math.max(1, (zoom - 10) * 0.8);
        return new Style({
          stroke: new Stroke({
            color: color,
            width,
          }),
        });
      },
    });
    map.addLayer(pathLayer);
    pathLayerRef.current = pathLayer;

    // 地圖點擊事件處理
    const handleMapClick = (event) => {
      if (!isSelectingPathRef.current) return;

      const coordinate = event.coordinate;
      const lonLat = toLonLat(coordinate);

      setSelectedPoints((prev) => {
        const newPoints = [...prev, { lng: lonLat[0], lat: lonLat[1] }];

        // 在地圖上添加標記（反轉：第一個點是終點，第二個點是起點）
        const marker = new Feature({
          geometry: new Point(coordinate),
          type: prev.length === 0 ? "end" : "start",
        });
        markersSource.addFeature(marker);

        if (newPoints.length === 2) {
          // 已選擇兩個點，開始尋路（注意：newPoints[0]是終點，newPoints[1]是起點）
          setStatusMessage("正在計算路徑...");
          findPath(newPoints[1], newPoints[0]); // 反轉參數順序
        } else {
          setStatusMessage("請點擊地圖選擇起點");
        }

        return newPoints;
      });
    };

    map.on("click", handleMapClick);

    return () => {
      map.un("click", handleMapClick);
      map.setTarget(null);
    };
  }, []);

  // 尋找路徑函數
  const findPath = async (start, end) => {
    try {
      const response = await fetch("/api/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ start, end, type: "bike" }),
      });

      setIsSelectingPath(false);
      isSelectingPathRef.current = false;

      if (!response.ok) {
        const error = await response.json();
        setStatusMessage(`錯誤: ${error.error || "無法計算路徑"}`);
        return;
      }

      const geojson = await response.json();

      // 儲存路徑統計資訊
      if (geojson.properties) {
        setPathStats({
          ...geojson.properties,
          pathType: "bike",
        });
      }

      // 在地圖上顯示路徑
      if (pathLayerRef.current) {
        const features = new GeoJSON().readFeatures(geojson, {
          featureProjection: "EPSG:3857",
        });

        const pathSource = pathLayerRef.current.getSource();
        pathSource.clear();
        pathSource.addFeatures(features);

        setStatusMessage("");
      }
    } catch (error) {
      console.error("路徑規劃錯誤:", error);
      setStatusMessage(`錯誤: ${error.message}`);
    }
  };

  // 開始路徑選擇
  const startPathSelection = () => {
    // 清除之前的標記和路徑
    if (markersLayerRef.current) {
      markersLayerRef.current.getSource().clear();
    }
    if (pathLayerRef.current) {
      pathLayerRef.current.getSource().clear();
    }

    setSelectedPoints([]);
    setPathStats(null);
    setStatusMessage("請點擊地圖選擇終點");
    setIsSelectingPath(true);
    isSelectingPathRef.current = true;
  };

  return (
    <div className="relative flex h-screen w-full flex-col">
      <div className="bg-[#5ab4c5] p-2.5 shadow-lg">
        <div className="align-button flex justify-around">
          {center && view && (
            <div
              className={`flex items-center border-b-3 border-transparent px-3 py-2`}
            >
              <a
                href={`/?lon=${center[0]}&lat=${center[1]}&zoom=${view?.getZoom()}`}
                className={`text-m flex items-center gap-1.5 font-bold text-white select-none`}
              >
                <span>
                  <ArrowLeftIcon className="h-4 w-4" />
                </span>
                <span>返回</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <div ref={mapRef} className="h-full w-full"></div>

        {!isSelectingPath && (
          <div className="absolute bottom-15 left-1/2 z-[1000] w-fit -translate-x-1/2 rounded-md bg-[#5ab4c5] p-2.5 px-10 font-bold text-white shadow-lg">
            <button onClick={startPathSelection}>開始路徑規劃</button>
          </div>
        )}

        {isSelectingPath && (
          <div className="absolute bottom-15 left-1/2 z-[1000] w-fit -translate-x-1/2 rounded-md bg-[#5ab4c5] p-2.5 px-10 font-bold text-white shadow-lg">
            選擇中...
          </div>
        )}

        {/* 控制面板 - 置中下方 */}
        {(isSelectingPath || pathStats) && (
          <div className="absolute bottom-30 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-white p-4 shadow-lg">
            {statusMessage && (
              <div className="mb-2 text-center text-sm text-gray-700">
                {statusMessage}
              </div>
            )}

            {pathStats && (
              <div>
                <div className="mb-3 border-b-2 border-green-600 pb-2 text-base font-bold">
                  路徑資訊
                </div>
                <div className="mb-2">
                  <span className="text-gray-600">總距離：</span>
                  <span className="font-bold text-gray-800">
                    {pathStats.totalDistanceKm} 公里
                  </span>
                </div>
                {pathStats.bikeLaneDistanceKm !== undefined && (
                  <>
                    <div className="mb-2">
                      <span className="text-gray-600">自行車道：</span>
                      <span className="font-bold text-green-600">
                        {pathStats.sidewalkDistanceKm} 公里
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-gray-600">佔比：</span>
                      <span className="font-bold text-green-600">
                        {pathStats.bikeLanePercentage}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedPoints.length > 0 && (
              <div className="mt-3 text-xs text-gray-600">
                <div>
                  終點:{" "}
                  {selectedPoints[0] &&
                    `${selectedPoints[0].lat.toFixed(6)}, ${selectedPoints[0].lng.toFixed(6)}`}
                </div>
                {selectedPoints[1] && (
                  <div>
                    起點: {selectedPoints[1].lat.toFixed(6)},{" "}
                    {selectedPoints[1].lng.toFixed(6)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
