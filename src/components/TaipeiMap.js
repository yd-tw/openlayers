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
import { LineString, Polygon } from "ol/geom";

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

    fetch("/water.geojson")
      .then((res) => res.json())
      .then((data) => {
        const features = new GeoJSON().readFeatures(data, {
          featureProjection: "EPSG:3857",
        });

        features.forEach((f) => {
          const geom = f.getGeometry();
          if (geom instanceof LineString) {
            const coords = geom.getCoordinates();

            const first = coords[0];
            const last = coords[coords.length - 1];
            const isClosed =
              first.length === last.length &&
              first.every((v, i) => v === last[i]);
            if (!isClosed) {
              coords.push(first);
            }

            f.setGeometry(new Polygon([coords]));
          }
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

    return () => map.setTarget(null);
  }, []);

  return <div ref={mapRef} className="w-full h-screen"></div>;
}
