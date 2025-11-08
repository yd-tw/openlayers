"use client";

import { useEffect, useRef, useState } from "react";
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
import LayerSwitcher from "./LayerSwitcher";

export default function MapComponent() {
  const mapRef = useRef(null);
  const [layers, setLayers] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});

  useEffect(() => {
    const visibility = {};
    Object.keys(layers).forEach(layerName => {
      visibility[layerName] = layers[layerName]?.getVisible() ?? true;
    });
    setLayerVisibility(visibility);
  }, [layers]);

  const toggleLayer = (layerName) => {
    const layer = layers[layerName];
    if (layer) {
      const newVisibility = !layer.getVisible();
      layer.setVisible(newVisibility);
      // Force a re-render by updating the layer visibility state
      setLayerVisibility((prev) => ({
        ...prev,
        [layerName]: newVisibility,
      }));
    }
  };

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
        setLayers((prev) => ({ ...prev, highway: vectorLayer }));
      });

    fetch("/osm-walk.geojson")
      .then((res) => res.json())
      .then((data) => {
        const features = new GeoJSON().readFeatures(data, {
          featureProjection: "EPSG:3857",
        });

        const bikeSource = new VectorSource({ features });

        const vLayer = new VectorLayer({
          source: bikeSource,
          style: new Style({
            stroke: new Stroke({ color: "rgba(0, 255, 38, 0.74)", width: 5 }),
            fill: new Fill({ color: "rgba(0, 255, 38, 0.74)" }),
          }),
        });

        map.addLayer(vLayer);
        setLayers((prev) => ({ ...prev, walk: vLayer }));
      });

    fetch("/bike.geojson")
      .then((res) => res.json())
      .then((data) => {
        const features = new GeoJSON().readFeatures(data, {
          featureProjection: "EPSG:3857",
        });

        const bikeSource = new VectorSource({ features });

        const vLayer = new VectorLayer({
          source: bikeSource,
          style: new Style({
            stroke: new Stroke({ color: "rgba(255, 0, 255, 0.74)", width: 5 }),
          }),
        });

        map.addLayer(vLayer);
        setLayers((prev) => ({ ...prev, bike: vLayer }));
      });

    return () => map.setTarget(null);
  }, []);

  return (
    <>
      <div ref={mapRef} className="h-screen w-full"></div>
      <LayerSwitcher layers={layers} toggleLayer={toggleLayer} />
    </>
  );
}
