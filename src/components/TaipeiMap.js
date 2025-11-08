"use client";

import { useEffect, useRef } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import { Style, Stroke, Fill } from "ol/style";
import { Feature } from "ol";
import Heatmap from "ol/layer/Heatmap";
import Point from "ol/geom/Point";

// Configs
import weightConfig from "@/configs/weightConfig.json";

export default function MapComponent() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([121.5, 25.05]),
        zoom: 12,
      }),
    });

    fetch("/highway.geojson")
      .then((res) => res.json())
      .then((data) => {
        const features = new GeoJSON().readFeatures(data, {
          featureProjection: "EPSG:3857",
        });

        const vectorSource = new VectorSource({ features });

        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: new Style({
            stroke: new Stroke({ color: "#ff6600", width: 2 }),
            fill: new Fill({ color: "rgba(255, 165, 0, 0.3)" }),
          }),
        });

        map.addLayer(vectorLayer);
      });

    // fetch("/bike.geojson")
    //   .then((res) => res.json())
    //   .then((data) => {
    //     const features = new GeoJSON().readFeatures(data, {
    //       featureProjection: "EPSG:3857",
    //     });

    //     const bikeSource = new VectorSource({ features });

    //     const vLayer = new VectorLayer({
    //       source: bikeSource,
    //       style: new Style({
    //         stroke: new Stroke({ color: "rgba(0, 255, 38, 0.74)", width: 5 }),
    //         fill: new Fill({ color: "rgba(0, 255, 38, 0.74)" }),
    //       }),
    //     });

    //     map.addLayer(vLayer);
    //   });

    fetch("/bike.geojson")
      .then((res) => res.json())
      .then((data) => {
        const features = new GeoJSON().readFeatures(data, {
          featureProjection: "EPSG:3857",
        });

        const bikeSource = new VectorSource({ features });

        // 定義不同類型對應的顏色
        const typeColors = {
          1: "rgba(255, 0, 0, 0.74)", // 類型 1 - 紅色
          2: "rgba(0, 255, 0, 0.74)", // 類型 2 - 綠色
          3: "rgba(0, 0, 255, 0.74)", // 類型 3 - 藍色
          4: "rgba(255, 255, 0, 0.74)", // 類型 4 - 黃色
          5: "rgba(255, 0, 255, 0.74)", // 類型 5 - 洋紅色
          6: "rgba(0, 255, 255, 0.74)", // 類型 6 - 青色
          // 可以繼續添加更多類型...
        };

        const vLayer = new VectorLayer({
          source: bikeSource,
          style: function (feature) {
            // 取得自行車道類型
            const bikeType = feature.get("自行車道類型");

            // 根據類型選擇顏色，如果類型不存在則使用預設顏色
            const color = typeColors[bikeType] || "rgba(128, 128, 128, 0.74)";

            return new Style({
              stroke: new Stroke({
                color: color,
                width: 5,
              }),
              fill: new Fill({
                color: color,
              }),
            });
          },
        });

        map.addLayer(vLayer);
      });

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

    return () => map.setTarget(null);
  }, []);

  return <div ref={mapRef} className="h-screen w-full"></div>;
}
