"use client";

import { useEffect, useState, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/TileLayer";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/VectorLayer";
import VectorSource from "ol/source/VectorSource";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Style, Icon, Circle, Fill, Stroke } from "ol/style";

export default function OrientationMapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const vectorSourceRef = useRef(null);

  const [orientation, setOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [location, setLocation] = useState(null);
  const [supported, setSupported] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // 取得使用者位置
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lon: position.coords.longitude,
            lat: position.coords.latitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("無法取得位置資訊");
          // 預設位置：台北 101
          setLocation({ lon: 121.5654, lat: 25.0330 });
        }
      );
    } else {
      setLocationError("此瀏覽器不支援地理位置");
      setLocation({ lon: 121.5654, lat: 25.0330 });
    }
  }, []);

  // 初始化地圖
  useEffect(() => {
    if (!mapRef.current || !location) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    // 建立方向標記
    const marker = new Feature({
      geometry: new Point(fromLonLat([location.lon, location.lat])),
    });

    // 建立箭頭樣式
    marker.setStyle(
      new Style({
        image: new Icon({
          src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <g transform="translate(20,20)">
                <path d="M 0,-15 L 5,10 L 0,5 L -5,10 Z" fill="%234F46E5" stroke="%23FFFFFF" stroke-width="2"/>
                <circle cx="0" cy="0" r="3" fill="%23FFFFFF"/>
              </g>
            </svg>
          `),
          scale: 1,
          rotation: 0,
          anchor: [0.5, 0.5],
        }),
      })
    );

    markerRef.current = marker;
    vectorSource.addFeature(marker);

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([location.lon, location.lat]),
        zoom: 16,
      }),
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(null);
    };
  }, [location]);

  // 監聽裝置方向
  useEffect(() => {
    if ("DeviceOrientationEvent" in window) {
      const handleOrientation = (e) => {
        // alpha 就是指南針方向（0-360度）
        const alpha = e.alpha ?? 0;
        
        setOrientation({
          alpha: alpha.toFixed(2),
          beta: e.beta?.toFixed(2) ?? 0,
          gamma: e.gamma?.toFixed(2) ?? 0,
        });

        // 更新地圖標記方向（直接使用 alpha）
        if (markerRef.current) {
          const currentStyle = markerRef.current.getStyle();
          const icon = currentStyle.getImage();
          icon.setRotation((-alpha * Math.PI) / 180);
          markerRef.current.changed();
        }
      };

      window.addEventListener("deviceorientation", handleOrientation);
      return () => window.removeEventListener("deviceorientation", handleOrientation);
    } else {
      setSupported(false);
    }
  }, []);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* 地圖容器 */}
      <div ref={mapRef} className="flex-1 w-full" />

      {/* 資訊面板 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h2 className="text-lg font-bold text-gray-800 mb-3">裝置資訊</h2>
        
        {supported ? (
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="font-medium">方向 (Alpha):</span>
              <span className="text-indigo-600 font-mono">{orientation.alpha}°</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">前後傾斜 (Beta):</span>
              <span className="text-indigo-600 font-mono">{orientation.beta}°</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">左右傾斜 (Gamma):</span>
              <span className="text-indigo-600 font-mono">{orientation.gamma}°</span>
            </div>
          </div>
        ) : (
          <p className="text-red-500 text-sm">此裝置不支援方向感測</p>
        )}

        {locationError && (
          <p className="text-amber-600 text-xs mt-2">{locationError}</p>
        )}

        {location && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
            <p>經度: {location.lon.toFixed(4)}</p>
            <p>緯度: {location.lat.toFixed(4)}</p>
          </div>
        )}
      </div>

      {/* 指南針視覺化 */}
      <div className="absolute bottom-4 right-4 bg-white rounded-full shadow-lg p-2 w-24 h-24">
        <div className="relative w-full h-full flex items-center justify-center">
          <div 
            className="absolute w-full h-full transition-transform duration-100"
            style={{ transform: `rotate(${orientation.alpha}deg)` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-red-500 rounded-full" />
          </div>
          <div className="absolute text-xs font-bold text-gray-700">N</div>
          <div className="absolute bottom-0 text-xs text-gray-400">S</div>
          <div className="absolute right-0 text-xs text-gray-400">E</div>
          <div className="absolute left-0 text-xs text-gray-400">W</div>
        </div>
      </div>
    </div>
  );
}
