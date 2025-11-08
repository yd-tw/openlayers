"use client";

import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import Geolocation from "ol/Geolocation";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Heatmap from "ol/layer/Heatmap";
import { fromLonLat } from "ol/proj";
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
  const features = data.lines.map(line => {
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
      sidewalk: line.sidewalk
    });
    
    return feature;
  });
  
  // 建立 Vector Source
  const vectorSource = new VectorSource({
    features: features
  });
  
  // 建立 Vector Layer 並設定動態樣式
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: (feature) => {
      const isBike = feature.get('bike') === 1;
      const hasSidewalk = feature.get('sidewalk') !== null && feature.get('sidewalk') !== undefined;
      
      let color = '#3b82f6'; // 預設藍色
      
      if (hasSidewalk) {
        color = '#00ff26'; // 綠色 (有人行道)
      } else if (isBike) {
        color = '#ff00ff'; // 紫色 (自行車道)
      }
      
      return new Style({
        stroke: new Stroke({
          color: color,
          width: 2
        })
      });
    }
  });
  
  return vectorLayer;
}

export default function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [layers, setLayers] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});

  useEffect(() => {
    if (!mapRef.current) return;

    // 載入事故資料熱力圖
    Promise.all([fetch("/a1_accident.json"), fetch("/a2_accident.json")])
      .then(([a1, a2]) => Promise.all([a1.json(), a2.json()]))
      .then(([a1Data, a2Data]) => {
        let features = [];

        // A1 事故資料
        features = a1Data.result.records.map((p) => {
          const f = new Feature({
            geometry: new Point(fromLonLat([p["經度"], p["緯度"]])),
          });
          f.set("weight", weightConfig.a1AccidentWeight);
          return f;
        });

        // A2 事故資料
        features = [
          ...features,
          ...a2Data.result.records.map((p) => {
            const f = new Feature({
              geometry: new Point(fromLonLat([p["經度"], p["緯度"]])),
            });
            f.set("weight", weightConfig.a2AccidentWeight);
            return f;
          }),
        ];

        // 建立熱力圖圖層
        const heatLayer = new Heatmap({
          source: new VectorSource({ features }),
          blur: 20,
          radius: 10,
          opacity: 0.8,
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

        map.addLayer(heatLayer);
      });

    // 初始化地圖
    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([121.5, 25.05]),
        zoom: 18,
      }),
    });

    mapInstanceRef.current = map;

    // 定位功能
    const geolocation = new Geolocation({
      tracking: true,
      projection: map.getView().getProjection(),
    });

    // 使用者位置圓點
    const positionFeature = new Feature();
    positionFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: "#0f53fe" }),
          stroke: new Stroke({ color: "#fff", width: 3 }),
        }),
      }),
    );

    // 建立位置圖層
    const vectorSource = new VectorSource({
      features: [positionFeature],
    });
    const positionLayer = new VectorLayer({ source: vectorSource });
    map.addLayer(positionLayer);

    // 位置變化監聽
    geolocation.on("change:position", () => {
      const coords = geolocation.getPosition();
      if (coords) {
        positionFeature.setGeometry(new Point(coords));
        // 地圖視角跟隨使用者位置
        map.getView().animate({ center: coords, duration: 800 });
      }
    });

    // === 載入其他圖層 ===
    LAYER_CONFIGS.forEach((config) => loadGeoJSONLayer(map, config));

    // === 載入 API 線段資料 ===
    loadAPILinesLayer(map);

    return () => {
      geolocation.setTracking(false);
      map.setTarget(null);
    };
  }, []);

  /**
   * 載入 API 線段圖層
   */
  const loadAPILinesLayer = async (map) => {
    try {
      const response = await fetch('https://tmp114514.ricecall.com/lines');
      const data = await response.json();
      
      // 使用轉換函數建立圖層
      const linesLayer = createLinesLayerFromAPI(data);
      
      map.addLayer(linesLayer);
      setLayers((prev) => ({ ...prev, apiLines: linesLayer }));
      linesLayer.set('displayName', '路況');
    } catch (error) {
      console.error('載入 API 線段圖層失敗:', error);
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
      });
      vectorLayer.set('displayName', config.displayName);
      map.addLayer(vectorLayer);
      setLayers((prev) => ({ ...prev, [config.name]: vectorLayer }));
    } catch (error) {
      console.error(`載入 ${config.name} 圖層失敗:`, error);
    }
  };

  // 同步圖層可見性狀態
  useEffect(() => {
    const visibility = {};
    Object.keys(layers).forEach((name) => {
      visibility[name] = layers[name]?.getVisible() ?? true;
    });
    setLayerVisibility(visibility);
  }, [layers]);

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
    </>
  );
}
