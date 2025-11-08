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
import Polygon from "ol/geom/Polygon";
import CircleGeom from "ol/geom/Circle";
import { fromLonLat } from "ol/proj";
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from "ol/style";
import LayerSwitcher from "../../components/LayerSwitcher";

// === GeoJSON 圖層設定 ===
const LAYER_CONFIGS = [
  {
    name: "highway",
    url: "/highway.geojson",
    style: new Style({
      stroke: new Stroke({ color: "#ff6600", width: 2 }),
      fill: new Fill({ color: "rgba(255, 165, 0, 0.3)" }),
    }),
  },
  {
    name: "walk",
    url: "/osm-walk.geojson",
    style: new Style({
      stroke: new Stroke({ color: "rgba(0, 255, 38, 0.74)", width: 5 }),
    }),
  },
  {
    name: "bike",
    url: "/bike.geojson",
    style: new Style({
      stroke: new Stroke({ color: "rgba(255, 0, 255, 0.74)", width: 5 }),
    }),
  },
];

export default function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [layers, setLayers] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});

  useEffect(() => {
    if (!mapRef.current) return;

    // === 初始化地圖 ===
    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([121.5, 25.05]),
        zoom: 17,
      }),
    });
    mapInstanceRef.current = map;

    // === 定位功能 ===
    const geolocation = new Geolocation({
      tracking: true,
      projection: map.getView().getProjection(),
    });

    // === 三個圖層元素 ===
    const accuracyFeature = new Feature(); // 定位誤差圈
    const positionFeature = new Feature(); // 使用者位置圓點
    const coneFeature = new Feature(); // 面向方向錐形

    // === 樣式 ===
    accuracyFeature.setStyle(
      new Style({
        fill: new Fill({
          color: "rgba(17, 81, 255, 0.15)", // 淺藍透明圈
        }),
        stroke: new Stroke({
          color: "rgba(17, 81, 255, 0.4)",
          width: 1.5,
        }),
      }),
    );

    positionFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: "#1151ff" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      }),
    );

    coneFeature.setStyle(
      new Style({
        fill: new Fill({
          color: "rgba(17, 81, 255, 0.25)", // 面向錐形半透明
        }),
        stroke: new Stroke({
          color: "#1151ff",
          width: 2,
        }),
      }),
    );

    const vectorSource = new VectorSource({
      features: [accuracyFeature, positionFeature, coneFeature],
    });

    const positionLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 1000,
    });
    map.addLayer(positionLayer);

    // === 狀態保存 ===
    const currentHeadingRef = { current: 0 };

    // === 更新面向扇形 ===
    const updateConeGeometry = (coords, headingRad) => {
      if (!coords || headingRad == null) return;

      const radius = 30; // 錐形長度
      const halfAngle = (30 * Math.PI) / 180; // 左右各 30 度
      const steps = 10;
      const points = [coords];

      for (let i = -halfAngle; i <= halfAngle; i += (halfAngle * 2) / steps) {
        const angle = headingRad + i;
        const dx = radius * Math.sin(angle);
        const dy = radius * Math.cos(angle);
        points.push([coords[0] + dx, coords[1] + dy]);
      }

      points.push(coords);
      coneFeature.setGeometry(new Polygon([points]));
    };

    // === 監聽定位 ===
    geolocation.on("change:position", () => {
      const coords = geolocation.getPosition();
      const accuracy = geolocation.getAccuracy() ?? 0;

      if (coords) {
        // 誤差圈
        accuracyFeature.setGeometry(new CircleGeom(coords, accuracy));

        // 使用者位置
        positionFeature.setGeometry(new Point(coords));

        // 更新方向錐形
        updateConeGeometry(coords, currentHeadingRef.current);

        // 讓地圖跟隨使用者
        map.getView().animate({ center: coords, duration: 800 });
      }
    });

    // === 監聽裝置方向 ===
    const handleOrientation = (event) => {
      const heading = event.alpha;
      if (heading != null) {
        const rad = (heading * Math.PI) / 180;
        currentHeadingRef.current = rad;
        const coords = geolocation.getPosition();
        if (coords) updateConeGeometry(coords, rad);
      }
    };

    // iOS 權限要求
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
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
      window.addEventListener("deviceorientation", handleOrientation);
    }

    // === 載入 GeoJSON 圖層 ===
    LAYER_CONFIGS.forEach((cfg) => loadGeoJSONLayer(map, cfg));

    return () => {
      geolocation.setTracking(false);
      map.un("singleclick", handleMapClick);
      map.setTarget(null);
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
      );
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // === 載入 GeoJSON ===
  const loadGeoJSONLayer = async (map, config) => {
    try {
      const res = await fetch(config.url);
      const data = await res.json();
      const features = new GeoJSON().readFeatures(data, {
        featureProjection: "EPSG:3857",
      });

      const source = new VectorSource({ features });
      const layer = new VectorLayer({
        source,
        style: config.style,
      });

      map.addLayer(layer);
      setLayers((prev) => ({ ...prev, [config.name]: layer }));
    } catch (err) {
      console.error(`載入 ${config.name} 圖層失敗:`, err);
    }
  };

  // === 圖層顯示控制 ===
  useEffect(() => {
    const visibility = {};
    Object.keys(layers).forEach((n) => {
      visibility[n] = layers[n]?.getVisible() ?? true;
    });
    setLayerVisibility(visibility);
  }, [layers]);

  const toggleLayer = (name) => {
    const layer = layers[name];
    if (layer) {
      const visible = !layer.getVisible();
      layer.setVisible(visible);
      setLayerVisibility((prev) => ({ ...prev, [name]: visible }));
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      <LayerSwitcher
        layers={layers}
        layerVisibility={layerVisibility}
        toggleLayer={toggleLayer}
      />
    </div>
  );
}
