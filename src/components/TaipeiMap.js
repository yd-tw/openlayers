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
import Heatmap from "ol/layer/Heatmap";
import { fromLonLat } from "ol/proj";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";

import LayerSwitcher from "./LayerSwitcher";

// GeoJSON 圖層配置
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
      fill: new Fill({ color: "rgba(0, 255, 38, 0.74)" }),
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

// Configs
import weightConfig from "@/configs/weightConfig.json";

export default function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [layers, setLayers] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});

  useEffect(() => {
    if (!mapRef.current) return;

    Promise.all([fetch("/a1_accident.json"), fetch("/a2_accident.json")])
      .then(([a1, a2]) => Promise.all([a1.json(), a2.json()]))
      .then(([a1Data, a2Data]) => {
        let features = [];

        features = a1Data.result.records.map((p) => {
          const f = new Feature({
            geometry: new Point(fromLonLat([p["經度"], p["緯度"]])),
          });
          f.set("weight", weightConfig.a1AccidentWeight);
          return f;
        });

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

        const heatLayer = new Heatmap({
          source: new VectorSource({ features }),
          blur: 20,
          radius: 10,
          opacity: 0.8,
        });

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

    // 定位
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

    // 面朝方向錐形區域
    const coneFeature = new Feature();
    coneFeature.setStyle(
      new Style({
        fill: new Fill({
          color: "rgba(15, 83, 254, 0.25)", // 淺藍漸層
        }),
        stroke: new Stroke({
          color: "rgba(15, 83, 254, 0.4)",
          width: 1.5,
        }),
      }),
    );

    const vectorSource = new VectorSource({
      features: [positionFeature, coneFeature],
    });
    const positionLayer = new VectorLayer({ source: vectorSource });
    map.addLayer(positionLayer);

    // === 位置變化 ===
    geolocation.on("change:position", () => {
      const coords = geolocation.getPosition();
      if (coords) {
        positionFeature.setGeometry(new Point(coords));
        updateConeGeometry(coords, currentHeadingRef.current);
        map.getView().animate({ center: coords, duration: 800 });
      }
    });

    // === 方向變化 ===
    const currentHeadingRef = { current: 0 };

    const updateConeGeometry = (coords, heading) => {
      if (!coords || heading == null) return;

      const radius = 30; // 錐形長度（公尺）
      const halfAngle = (30 * Math.PI) / 180; // 左右各 30°
      const steps = 10;
      const points = [coords];

      for (let i = -halfAngle; i <= halfAngle; i += (halfAngle * 2) / steps) {
        const angle = heading + i;
        const dx = radius * Math.sin(angle);
        const dy = radius * Math.cos(angle);
        points.push([coords[0] + dx, coords[1] + dy]);
      }
      points.push(coords);
      coneFeature.setGeometry(new Polygon([points]));
    };

    // === DeviceOrientation API ===
    const handleOrientation = (event) => {
      // alpha 是相對於北方的角度（度數）
      let heading = event.alpha;
      if (heading != null) {
        const rad = (heading * Math.PI) / 180;
        currentHeadingRef.current = rad;
        const coords = geolocation.getPosition();
        updateConeGeometry(coords, rad);
      }
    };

    window.addEventListener("deviceorientationabsolute", handleOrientation);
    window.addEventListener("deviceorientation", handleOrientation);

    // === 載入其他圖層 ===
    LAYER_CONFIGS.forEach((config) => loadGeoJSONLayer(map, config));

    return () => {
      geolocation.setTracking(false);
      map.setTarget(null);
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
      );
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // 載入 GeoJSON 圖層
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
      map.addLayer(vectorLayer);
      setLayers((prev) => ({ ...prev, [config.name]: vectorLayer }));
    } catch (error) {
      console.error(`載入 ${config.name} 圖層失敗:`, error);
    }
  };

  // 同步圖層可見性
  useEffect(() => {
    const visibility = {};
    Object.keys(layers).forEach((name) => {
      visibility[name] = layers[name]?.getVisible() ?? true;
    });
    setLayerVisibility(visibility);
  }, [layers]);

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
