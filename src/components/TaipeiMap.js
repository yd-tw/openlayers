"use client";

import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Polygon } from "ol/geom";
import LineString from "ol/geom/LineString";
import Heatmap from "ol/layer/Heatmap";
import { fromLonLat, toLonLat } from "ol/proj";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";
import LayerSwitcher from "./LayerSwitcher";

// GeoJSON 圖層配置
const LAYER_CONFIGS = [
  {
    name: "highway",
    displayName: "公路",
    url: "/highway.geojson",
    style: new Style({
      stroke: new Stroke({ color: "#ff6600", width: 2 }),
      fill: new Fill({ color: "rgba(255, 165, 0, 0.3)" }),
    }),
  },
  {
    name: "walk",
    displayName: "人行道",
    url: "/osm-walk.geojson",
    style: new Style({
      stroke: new Stroke({ color: "rgba(0, 255, 38, 0.74)", width: 5 }),
      fill: new Fill({ color: "rgba(0, 255, 38, 0.74)" }),
    }),
  },
  {
    name: "bike",
    displayName: "自行車道",
    url: "/bike.geojson",
    style: new Style({
      stroke: new Stroke({ color: "rgba(255, 0, 255, 0.74)", width: 5 }),
    }),
  },
];

// Configs
import weightConfig from "@/configs/weightConfig.json";

/**
 * 從 API 資料建立線段圖層
 * 根據 bike 和 sidewalk 屬性決定顏色
 */
function createLinesLayerFromAPI(data) {
  const features = data.lines.map((line) => {
    // 將經緯度轉換為 OpenLayers 投影座標
    const startCoord = fromLonLat([line.start_lng, line.start_lat]);
    const endCoord = fromLonLat([line.end_lng, line.end_lat]);

    // 建立線段幾何
    const lineGeometry = new LineString([startCoord, endCoord]);

    // 建立 Feature 並儲存所有屬性
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
    visible: false, // 預設關閉
    style: (feature) => {
      const isBike = feature.get("bike") === 1;
      const hasSidewalk =
        feature.get("sidewalk") !== null &&
        feature.get("sidewalk") !== undefined;

      let color = "#3b82f6"; // 預設藍色

      if (hasSidewalk) {
        color = "#00ff26"; // 綠色 (有人行道)
      } else if (isBike) {
        color = "#ff00ff"; // 紫色 (自行車道)
      }

      return new Style({
        stroke: new Stroke({
          color: color,
          width: 2,
        }),
      });
    },
  });

  return vectorLayer;
}

export default function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const positionFeature = useRef(null);
  const directionFeature = useRef(null);
  const [map, setMap] = useState(null);
  const [view, setView] = useState(null);
  const [orientation, setOrientation] = useState(null);
  const [position, setPosition] = useState(null);
  const [layers, setLayers] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});
  const [a1AccidentDatas, setA1AccidentDatas] = useState([]);
  const [a2AccidentDatas, setA2AccidentDatas] = useState([]);
  const [copyNotification, setCopyNotification] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    fetch("/accident_a1.json")
      .then((res) => res.json())
      .then((data) => {
        setA1AccidentDatas(data);
      });

    fetch("/accident_a2.json")
      .then((res) => res.json())
      .then((data) => {
        setA2AccidentDatas(data);
      });

    // 初始化地圖
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

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    mapObj.addLayer(vectorLayer);

    // 位置點
    positionFeature.current = new Feature(new Point(fromLonLat([121.5, 25.05])));
    positionFeature.current.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: "#1151ff" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      })
    );

    // 方向扇形
    directionFeature.current = new Feature(new Polygon([[]]));
    directionFeature.current.setStyle(
      new Style({
        fill: new Fill({ color: "rgba(17, 81, 255, 0.25)" }),
        stroke: new Stroke({ color: "#1151ff", width: 2 }),
      })
    );

    vectorSource.addFeatures([positionFeature.current, directionFeature.current]);

    // === 載入其他圖層 ===
    LAYER_CONFIGS.forEach((config) => loadGeoJSONLayer(mapObj, config));

    // === 載入 API 線段資料 ===
    loadAPILinesLayer(mapObj);

    // === 點擊地圖複製經緯度功能 ===
    const clickMarkerSource = new VectorSource();
    const clickMarkerLayer = new VectorLayer({
      source: clickMarkerSource,
      zIndex: 9999,
    });
    mapObj.addLayer(clickMarkerLayer);

    // 地圖點擊事件
    mapObj.on("singleclick", (evt) => {
      const coords = evt.coordinate;
      const lonLat = toLonLat(coords);
      const [lon, lat] = lonLat;

      // 格式化經緯度（6位小數）
      const coordText = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

      console.log("點擊座標:", coordText);

      // 複製到剪貼簿
      navigator.clipboard
        .writeText(coordText)
        .then(() => {
          console.log("複製成功");
          setCopyNotification(coordText);
          setTimeout(() => setCopyNotification(null), 2000);
        })
        .catch((err) => {
          console.error("複製失敗:", err);
          // 即使複製失敗也顯示通知
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

    return () => {
      mapObj.setTarget(null);
    };
  }, []);

  /**
   * 載入 API 線段圖層
   */
  const loadAPILinesLayer = async (map) => {
    try {
      const response = await fetch("https://tmp114514.ricecall.com/lines");
      const data = await response.json();

      // 使用轉換函數建立圖層
      const linesLayer = createLinesLayerFromAPI(data);

      map.addLayer(linesLayer);
      setLayers((prev) => ({ ...prev, apiLines: linesLayer }));
      linesLayer.set("displayName", "路況");
    } catch (error) {
      console.error("載入 API 線段圖層失敗:", error);
    }
  };

  /**
   * 載入 GeoJSON 圖層
   */
  const loadGeoJSONLayer = async (map, config) => {
    try {
      const response = await fetch(config.url);
      const data = await response.json();
      const features = new GeoJSON().readFeatures(data, {
        featureProjection: "EPSG:3857",
      });
      const vectorSource = new VectorSource({ features });
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: config.style,
        visible: false, // 預設關閉
      });
      vectorLayer.set("displayName", config.displayName);
      map.addLayer(vectorLayer);
      setLayers((prev) => ({ ...prev, [config.name]: vectorLayer }));
    } catch (error) {
      console.error(`載入 ${config.name} 圖層失敗:`, error);
    }
  };

  // 取得定位資訊
  useEffect(() => {
    if (!map) return;

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
          setPosition(coords);
          positionFeature.current?.getGeometry()?.setCoordinates(coords);
          view?.setCenter(coords);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [map, view]);

  // 取得方向資訊
  useEffect(() => {
    const handleOrientation = (event) => {
    let alpha = event.alpha ?? event.webkitCompassHeading ?? 0;
    const corrected = (360 - alpha + 360) % 360;

    setOrientation(corrected);
  };

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS
        DeviceOrientationEvent.requestPermission()
          .then((res) => {
            if (res === "granted") {
              window.addEventListener("deviceorientationabsolute", handleOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener("deviceorientationabsolute", handleOrientation);
      }
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
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
    directionFeature.current?.getGeometry()?.setCoordinates([coords]);
  }, [position, orientation]);

  // 同步圖層可見性狀態
  useEffect(() => {
    const visibility = {};
    Object.keys(layers).forEach((name) => {
      visibility[name] = layers[name]?.getVisible() ?? false;
    });
    setLayerVisibility(visibility);
  }, [layers]);

  useEffect(() => {
    let features = [];

    // A1 事故資料
    if (a1AccidentDatas.length > 0) {
      features.push(
        ...a1AccidentDatas.map((p) => {
          const f = new Feature({
            geometry: new Point(fromLonLat([p.lon + 100, p.lat + 20])),
          });
          f.set("weight", weightConfig.a1AccidentWeight);
          return f;
        }),
      );
    }

    // A2 事故資料
    if (a2AccidentDatas.length > 0) {
      features.push(
        ...a2AccidentDatas.map((p) => {
          const f = new Feature({
            geometry: new Point(fromLonLat([p.lon + 100, p.lat + 20])),
          });
          f.set("weight", weightConfig.a2AccidentWeight);
          return f;
        }),
      );
    }

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

    // 移除舊的圖層
    if (heatmapLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
    }
    mapInstanceRef.current.addLayer(heatLayer);
    heatmapLayerRef.current = heatLayer; // 儲存新的圖層參考

    // Add heatmap to layer switcher
    heatLayer.set("displayName", "交通事故熱點");
    setLayers((prev) => ({ ...prev, heatmap: heatLayer }));
  }, [a1AccidentDatas, a2AccidentDatas]);

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

  return (
    <>
      <div ref={mapRef} className="h-screen w-full" />
      <LayerSwitcher
        layers={layers}
        layerVisibility={layerVisibility}
        toggleLayer={toggleLayer}
      />

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
    </>
  );
}
