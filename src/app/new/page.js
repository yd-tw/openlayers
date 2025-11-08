"use client";

import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import Feature from "ol/Feature";
import { Point, Polygon } from "ol/geom";

export default function MapWithOrientation() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [view, setView] = useState(null);
  const positionFeature = useRef(null);
  const directionFeature = useRef(null);
  const [orientation, setOrientation] = useState(null);
  const [position, setPosition] = useState(null);

  // 初始化地圖
  useEffect(() => {
    if (!mapRef.current) return;

    const initialView = new View({
      center: fromLonLat([121.5, 25.05]),
      zoom: 14,
    });

    const mapObj = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: initialView,
    });

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({ source: vectorSource });
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

    setMap(mapObj);
    setView(initialView);

    return () => mapObj.setTarget(null);
  }, []);

  // 定位
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
        console.error,
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [map, view]);

  // 方向
  useEffect(() => {
    const handleOrientation = (event) => {
      // 修正方向，使 0° 為正北，順時針為正
      const alpha = event.alpha ?? 0;
      const corrected = 360 - alpha; // 修正為與地圖一致方向
      setOrientation(corrected);
    };

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
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

  return (
    <div className="relative w-full h-screen">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-xl text-sm">
        <p>方向角 α: {orientation?.toFixed(1) ?? "N/A"}°</p>
        <p>
          位置:{" "}
          {position
            ? `${position[0].toFixed(2)}, ${position[1].toFixed(2)}`
            : "定位中..."}
        </p>
      </div>
    </div>
  );
}
