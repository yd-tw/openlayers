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
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [view, setView] = useState<View | null>(null);
  const positionFeature = useRef<Feature<Point> | null>(null);
  const directionFeature = useRef<Feature<Polygon> | null>(null);
  const [orientation, setOrientation] = useState<number | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);

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
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    mapObj.addLayer(vectorLayer);

    // 位置點
    positionFeature.current = new Feature(
      new Point(fromLonLat([121.5, 25.05])),
    );
    positionFeature.current.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: "#1151ff" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      }),
    );

    // 方向錐形
    directionFeature.current = new Feature(
      new Polygon([[]]), // 初始空
    );
    directionFeature.current.setStyle(
      new Style({
        fill: new Fill({
          color: "rgba(17, 81, 255, 0.25)",
        }),
        stroke: new Stroke({
          color: "#1151ff",
          width: 2,
        }),
      }),
    );

    vectorSource.addFeatures([
      positionFeature.current,
      directionFeature.current,
    ]);

    setMap(mapObj);
    setView(initialView);

    return () => {
      mapObj.setTarget(undefined);
    };
  }, []);

  // 取得定位資訊
  useEffect(() => {
    if (!map) return;

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = fromLonLat([
            pos.coords.longitude,
            pos.coords.latitude,
          ]) as [number, number];
          setPosition(coords);
          positionFeature.current?.getGeometry()?.setCoordinates(coords);
          view?.setCenter(coords);
        },
        (err) => console.error(err),
        { enableHighAccuracy: true },
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [map, view]);

  // 取得方向資訊
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alpha = event.alpha ?? 0;
      const corrected = (alpha + 270) % 360;
      setOrientation(corrected);
    };

    if (window.DeviceOrientationEvent) {
      // iOS 裝置需要請求權限
      const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };

      if (typeof DeviceOrientationEventTyped.requestPermission === "function") {
        // iOS
        DeviceOrientationEventTyped.requestPermission()
          .then((res) => {
            if (res === "granted") {
              window.addEventListener(
                "deviceorientationabsolute",
                handleOrientation as EventListener,
              );
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener(
          "deviceorientationabsolute",
          handleOrientation as EventListener,
        );
      }
    }

    return () => {
      window.removeEventListener(
        "deviceorientationabsolute",
        handleOrientation as EventListener,
      );
    };
  }, []);

  // 更新方向錐形
  useEffect(() => {
    if (!position || orientation === null) return;

    const [x, y] = position;
    const distance = 30; // 錐形長度
    const rad = (orientation * Math.PI) / 180;

    const frontX = x + Math.sin(rad) * distance;
    const frontY = y - Math.cos(rad) * distance;

    const leftX = x + Math.sin(rad - 0.3) * distance * 0.8;
    const leftY = y - Math.cos(rad - 0.3) * distance * 0.8;

    const rightX = x + Math.sin(rad + 0.3) * distance * 0.8;
    const rightY = y - Math.cos(rad + 0.3) * distance * 0.8;

    const coneCoords = [
      [
        [x, y],
        [leftX, leftY],
        [frontX, frontY],
        [rightX, rightY],
        [x, y],
      ],
    ];

    directionFeature.current?.getGeometry()?.setCoordinates(coneCoords);
  }, [position, orientation]);

  return (
    <div className="relative h-screen w-full">
      <div ref={mapRef} className="h-full w-full" />
      <div className="absolute bottom-4 left-4 rounded-xl bg-black/70 p-3 text-sm text-white">
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
