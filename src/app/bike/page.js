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
  const [isSelectingPath, setIsSelectingPath] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [pathStats, setPathStats] = useState(null); // 路徑統計資訊
  const markersLayerRef = useRef(null);
  const pathLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 讀取 URL 參數
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const zoomParam = searchParams.get("zoom");

    // 設定預設值（若參數不存在或格式錯誤）
    const lat = latParam ? parseFloat(latParam) : 23.5;
    const lon = lonParam ? parseFloat(lonParam) : 121.0;
    const zoom = zoomParam ? parseFloat(zoomParam) : 8;

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        attributions: "© OpenStreetMap © CARTO",
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer],
      view: new View({
        center: fromLonLat([lon, lat]),
        zoom,
      }),
    });

    mapInstanceRef.current = map;

    // 建立標記圖層（用於顯示起點和終點）
    const markersSource = new VectorSource();
    const markersLayer = new VectorLayer({
      source: markersSource,
      style: (feature) => {
        const type = feature.get("type");
        return new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: type === "start" ? "#00ff00" : "#ff0000" }),
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
      if (!isSelectingPath) return;

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
          setIsSelectingPath(false);
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
  }, [isSelectingPath]);

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

        setStatusMessage("路徑規劃完成！");
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
    setIsSelectingPath(true);
    setStatusMessage("請點擊地圖選擇終點");
  };

  return (
    <div className="relative flex h-screen w-full flex-col">
      <div className="bg-[#5ab4c5] p-2.5 shadow-lg">
        <div className="align-button flex justify-around">
          <div
            className={`flex items-center border-b-3 border-transparent px-3 py-2`}
          >
            <a
              href="/"
              className={`text-m flex items-center gap-1.5 font-bold text-white select-none`}
            >
              <span>
                <ArrowLeftIcon className="h-4 w-4" />
              </span>
              <span>返回</span>
            </a>
          </div>
        </div>
      </div>

      <div className="relative flex-1">
        <div ref={mapRef} className="h-full w-full"></div>

        {/* 控制面板 - 置中下方 */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-white p-4 shadow-lg">
          <button
            onClick={startPathSelection}
            disabled={isSelectingPath}
            className={`rounded px-4 py-2 font-medium ${
              isSelectingPath
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isSelectingPath ? "選擇中..." : "路徑規劃"}
          </button>

          {statusMessage && (
            <div className="mt-3 text-center text-sm text-gray-700">
              {statusMessage}
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
      </div>
    </div>
  );
}
