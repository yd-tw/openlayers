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
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";

export default function MapComponent() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([121.5, 25.05]),
        rotation: Math.PI / 5,
        zoom: 12,
      }),
    });

    fetch("/bike.geojson")
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
            image: new CircleStyle({
              radius: 6,
              fill: new Fill({ color: "#ff6600" }),
            }),
          }),
        });

        map.addLayer(vectorLayer);
      });

      // fetch("/bike.geojson")
      // .then((res) => res.json())
      // .then((data) => {
      //   const features = new GeoJSON().readFeatures(data, {
      //     featureProjection: "EPSG:3826",
      //   });

      //   const bikeSource = new VectorSource({ features });

      //   const vLayer = new VectorLayer({
      //     source: bikeSource,
      //     style: new Style({
      //       stroke: new Stroke({ color: "#ff6600", width: 2 }),
      //       fill: new Fill({ color: "rgba(255, 165, 0, 0.3)" }),
      //       image: new CircleStyle({
      //         radius: 6,
      //         fill: new Fill({ color: "#ff6600" }),
      //       }),
      //     }),
      //   });

      //   map.addLayer(vLayer);
      // });

    return () => map.setTarget(null);
  }, []);

  return <div ref={mapRef} className="h-screen w-full"></div>;
}
