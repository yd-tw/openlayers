"use client";

import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import LineString from "ol/geom/LineString";
import Heatmap from "ol/layer/Heatmap";
import { fromLonLat, toLonLat } from "ol/proj";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";

// Components
import LayerSwitcher from "./LayerSwitcher";
import MapModeSelector from "./MapModeSelector";

// Libraries
import { getTownPassClient } from "@/lib/townpass/client";

// Configs
import weightConfig from "@/configs/weightConfig.json";

/**
 * 從 API 資料建立線段圖層
 */
function createLinesLayerFromAPI(data) {}

export default function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const positionFeatureRef = useRef(null);
  const directionFeatureRef = useRef(null);
  const [layers, setLayers] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});
  const [copyNotification, setCopyNotification] = useState(null);
  const [map, setMap] = useState(null);
  const [view, setView] = useState(null);
  const [position, setPosition] = useState(null);
  const [orientation, setOrientation] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initialView = new View({
      center: fromLonLat([121.534, 25.021]),
      zoom: 20,
    });

    const mapObj = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: initialView,
    });

    mapInstanceRef.current = mapObj;
    setMap(mapObj);
    setView(initialView);

    // === 載入位置圖層 ===
    loadPositionLayer().then((positionLayer) => {
      mapObj.addLayer(positionLayer);
      setLayers((prev) => ({ ...prev, position: positionLayer }));
      positionLayer.set("displayName", "當前位置");
    });

    // === 載入 API 線段資料 ===
    loadLinesLayer().then((linesLayer) => {
      mapObj.addLayer(linesLayer);
      setLayers((prev) => ({ ...prev, lines: linesLayer }));
      linesLayer.set("displayName", "路況");
    });

    // === 載入事故圖層 ===
    loadAccidentLayer().then((accidentLayer) => {
      mapObj.addLayer(accidentLayer);
      setLayers((prev) => ({ ...prev, accident: accidentLayer }));
      accidentLayer.set("displayName", "交通事故熱點");
    });

    // === 點擊地圖複製經緯度功能 ===
    const clickMarkerSource = new VectorSource();
    const clickMarkerLayer = new VectorLayer({
      source: clickMarkerSource,
      zIndex: 9999,
    });

    mapObj.addLayer(clickMarkerLayer);

    mapObj.on("singleclick", (evt) => {
      const coords = evt.coordinate;
      const lonLat = toLonLat(coords);
      const [lon, lat] = lonLat;

      // 格式化經緯度（6位小數）
      const coordText = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

      // 複製到剪貼簿
      navigator.clipboard
        .writeText(coordText)
        .then(() => {
          setCopyNotification(coordText);
          setTimeout(() => setCopyNotification(null), 2000);
        })
        .catch((err) => {
          setCopyNotification(coordText);
          setTimeout(() => setCopyNotification(null), 2000);
        });

      // 清除舊標記
      clickMarkerSource.clear();

      // 添加新標記
      const marker = new Feature({
        geometry: new Point(coords),
      });

      marker.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: "rgba(255, 0, 0, 0.7)" }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
        }),
      );

      clickMarkerSource.addFeature(marker);

      // 2秒後移除標記
      setTimeout(() => {
        clickMarkerSource.clear();
      }, 2000);
    });

    // === 監聽 Flutter 位置更新 ===
    const townpassClient = getTownPassClient();

    const unsubscribeLocation = townpassClient.onLocationUpdate((location) => {
      // 轉換為 OpenLayers 座標
      const coords = fromLonLat([location.longitude, location.latitude]);

      // 更新位置標記
      if (positionFeatureRef.current) {
        positionFeatureRef.current.setGeometry(new Point(coords));
      }

      // 更新地圖視角
      if (mapInstanceRef.current) {
        mapInstanceRef.current.getView().animate({
          center: coords,
          duration: 800,
        });
      }
    });

    return () => {
      unsubscribeLocation();
      mapObj.setTarget(null);
    };
  }, []);

  /**
   * 載入線段圖層
   * API URL: https://tmp114514.ricecall.com/lines
   * API Response:
   * {
   *   "lines": [
   *     {
   *       "id": 1,
   *       "name": "line1",
   *       "start_lng": 121.5340424,
   *       "start_lat": 25.0226465,
   *       "end_lng": 121.5335406,
   *       "end_lat": 25.0226608,
   *       "bike": 1,
   *       "rd_from": "rd1",
   *       "sidewalk": "sidewalk1"
   *     }
   *   ]
   * }
   * @returns {VectorLayer} 線段圖層
   */
  const loadLinesLayer = async () => {
    try {
      const response = await fetch("https://tmp114514.ricecall.com/lines");
      const data = await response.json();

      // 建立 Features
      const features = data.lines.map((line) => {
        const startCoord = fromLonLat([line.start_lng, line.start_lat]);
        const endCoord = fromLonLat([line.end_lng, line.end_lat]);

        const lineGeometry = new LineString([startCoord, endCoord]);

        const feature = new Feature({
          geometry: lineGeometry,
          id: line.id,
          name: line.name,
          bike: line.bike,
          rd_from: line.rd_from,
          sidewalk: line.sidewalk,
        });

        return feature;
      });

      // 建立 Vector Source
      const vectorSource = new VectorSource({
        features: features,
      });

      // 建立 Vector Layer 並設定動態樣式
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        visible: false,
        style: (feature) => {
          const isBike = feature.get("bike") === 1;
          const hasSidewalk =
            feature.get("sidewalk") !== null &&
            feature.get("sidewalk") !== undefined;

          let color = "#3b82f6";

          if (hasSidewalk) color = "#00ff26";
          else if (isBike) color = "#ff00ff";

          return new Style({
            stroke: new Stroke({
              color: color,
              width: 2,
            }),
          });
        },
      });

      return vectorLayer;
    } catch (error) {
      console.error("載入 API 線段圖層失敗:", error);
    }
  };

  /**
   * 載入事故圖層
   * API URL: /accident_a1.json, /accident_a2.json
   * API Response:
   * {
   *   "data": [
   *     { "lon": 121.5340424, "lat": 25.0226465 },
   *     { "lon": 121.5335406, "lat": 25.0226608 },
   *   ]
   * }
   * @returns {VectorLayer} 事故圖層
   */
  const loadAccidentLayer = async () => {
    try {
      const datas = await Promise.all([
        fetch("/accident_a1.json").then((res) => res.json()),
        fetch("/accident_a2.json").then((res) => res.json()),
      ]).then(([a1, a2]) => [...a1, ...a2]);

      // 建立 Features
      const features = datas.map((p) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([p.lon + 100, p.lat + 20])),
        });

        feature.set("weight", weightConfig.a2AccidentWeight);

        return feature;
      });

      // 建立熱力圖圖層
      const heatLayer = new Heatmap({
        source: new VectorSource({ features }),
        blur: 20,
        radius: 10,
        opacity: 0.8,
        visible: false, // 預設關閉
      });

      // 設定熱力圖漸層色
      heatLayer.setGradient([
        "#fff0f5", // very light pink (LavenderBlush)
        "#ffb6c1", // lightpink
        "#ff69b4", // hotpink
        "#ff1493", // deeppink
        "#c71585", // mediumvioletred
        "#8b008b", // darkmagenta
      ]);

      return heatLayer;
    } catch (error) {
      console.error("載入事故圖層失敗:", error);
    }
  };

  /**
   * 載入當前位置圖層
   * @returns {VectorLayer} 當前位置圖層
   */
  const loadPositionLayer = async () => {
    try {
      // 建立 Feature
      const positionFeature = new Feature();
      positionFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: "#1151ff" }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
        }),
      );

      // 方向扇形 Feature
      const directionFeature = new Feature(new Polygon([[]]));
      directionFeature.setStyle(
        new Style({
          fill: new Fill({ color: "rgba(17, 81, 255, 0.25)" }),
          stroke: new Stroke({ color: "#1151ff", width: 2 }),
        }),
      );

      // 儲存 Feature 引用供 Flutter 方向更新使用
      positionFeatureRef.current = positionFeature;
      directionFeatureRef.current = directionFeature;

      // 建立 Vector Source
      const vectorSource = new VectorSource({
        features: [positionFeature, directionFeature],
      });

      // 建立 Vector Layer
      const positionLayer = new VectorLayer({ source: vectorSource });

      return positionLayer;
    } catch (error) {
      console.error("載入當前位置圖層失敗:", error);
    }
  };

  /**
   * 切換圖層顯示/隱藏
   */
  const toggleLayer = (layerName) => {
    const layer = layers[layerName];
    if (layer) {
      const newVisible = !layer.getVisible();
      layer.setVisible(newVisible);
      setLayerVisibility((prev) => ({ ...prev, [layerName]: newVisible }));
    }
  };

  // 取得定位資訊
  useEffect(() => {
    if (!map) return;

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = fromLonLat([
            pos.coords.longitude,
            pos.coords.latitude,
          ]);

          setPosition(coords);

          if (positionFeatureRef.current) {
            positionFeatureRef.current.setGeometry(new Point(coords));
          }

          if (view) {
            view.setCenter(coords);
          }
        },
        (err) => console.error(`取得定位資訊失敗: ${err}`),
        { enableHighAccuracy: true },
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [map, view]);

  // 取得方向資訊
  useEffect(() => {
    const handleOrientation = (event) => {
      const alpha = event.alpha ?? 0;
      const corrected = (alpha + 270) % 360;

      setOrientation(corrected);
    };

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS
        DeviceOrientationEvent.requestPermission()
          .then((res) => {
            if (res === "granted") {
              window.addEventListener(
                "deviceorientationabsolute",
                handleOrientation,
              );
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener("deviceorientationabsolute", handleOrientation);
      }
    }

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
      );
    };
  }, []);

  // 更新扇形方向
  useEffect(() => {
    if (!position || orientation === null) return;

    const [x, y] = position;
    const radius = 40; // 扇形半徑
    const spread = 40; // 夾角（度）
    const steps = 20; // 圓弧細分數量
    const rad = (orientation * Math.PI) / 180;
    const half = (spread * Math.PI) / 360;

    const coords = [[x, y]];

    // 生成圓弧座標（順時針方向）
    for (let i = -half; i <= half; i += (spread * Math.PI) / (180 * steps)) {
      const px = x + Math.sin(rad + i) * radius;
      const py = y - Math.cos(rad + i) * radius;
      coords.push([px, py]);
    }

    coords.push([x, y]); // 封閉
    directionFeatureRef.current?.getGeometry()?.setCoordinates([coords]);
  }, [position, orientation]);

  // 同步圖層可見性狀態
  useEffect(() => {
    const visibility = {};
    Object.keys(layers).forEach((name) => {
      visibility[name] = layers[name]?.getVisible() ?? false;
    });
    setLayerVisibility(visibility);
  }, [layers]);

  return (
    <div className="relative h-screen w-full">
      {/* 地圖 */}
      <div ref={mapRef} className="h-screen w-full" />

      {/* 圖層切換器 */}
      <LayerSwitcher
        layers={layers}
        layerVisibility={layerVisibility}
        toggleLayer={toggleLayer}
      />

      {/* 模式選擇器 - 置於地圖左下方 */}
      <div className="absolute bottom-2.5 left-2.5 z-[1000]">
        <MapModeSelector />
      </div>

      {/* 複製通知 */}
      {copyNotification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#16a34a",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
          }}
        >
          <svg
            style={{ width: "20px", height: "20px", flexShrink: 0 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <div>
            <div style={{ fontWeight: "600" }}>已複製經緯度</div>
            <div style={{ fontSize: "13px", opacity: 0.95 }}>
              {copyNotification}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
