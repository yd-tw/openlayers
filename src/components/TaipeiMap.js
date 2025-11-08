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

export default function MapComponent() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [layers, setLayers] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});

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

  // 初始化地圖和圖層
  useEffect(() => {
    if (!mapRef.current) return;

    // 創建地圖實例
    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([121.5, 25.05]),
        zoom: 18,
      }),
    });

    mapInstanceRef.current = map;

    // 設置定位功能
    const geolocation = new Geolocation({
      tracking: true,
      projection: map.getView().getProjection(),
    });

    // 創建位置標記
    const positionFeature = new Feature();
    positionFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 15,
          fill: new Fill({ color: "#3399CC" }),
          stroke: new Stroke({ color: "#fff", width: 3 }),
        }),
      })
    );

    // 當位置更新時觸發
    geolocation.on("change:position", () => {
      const coordinates = geolocation.getPosition();
      positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
      
      // 首次定位時移動視角
      if (coordinates) {
        map.getView().animate({
          center: coordinates,
          duration: 1000,
        });
      }
    });

    // 添加位置圖層
    const positionLayer = new VectorLayer({
      source: new VectorSource({
        features: [positionFeature],
      }),
    });
    map.addLayer(positionLayer);

    // 載入所有 GeoJSON 圖層
    LAYER_CONFIGS.forEach((config) => {
      loadGeoJSONLayer(map, config);
    });

    // 清理函數
    return () => {
      geolocation.setTracking(false);
      map.setTarget(null);
    };
  }, []);

  // 同步圖層可見性狀態
  useEffect(() => {
    const visibility = {};
    Object.keys(layers).forEach((layerName) => {
      visibility[layerName] = layers[layerName]?.getVisible() ?? true;
    });
    setLayerVisibility(visibility);
  }, [layers]);

  // 切換圖層可見性
  const toggleLayer = (layerName) => {
    const layer = layers[layerName];
    if (layer) {
      const newVisibility = !layer.getVisible();
      layer.setVisible(newVisibility);
      
      setLayerVisibility((prev) => ({
        ...prev,
        [layerName]: newVisibility,
      }));
    }
  };

  return (
    <>
      <div ref={mapRef} className="h-screen w-full"></div>
      <LayerSwitcher 
        layers={layers} 
        layerVisibility={layerVisibility}
        toggleLayer={toggleLayer} 
      />
    </>
  );
}
