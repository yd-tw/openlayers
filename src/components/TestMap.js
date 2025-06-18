'use client'

import { useEffect, useRef } from 'react'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Polygon from 'ol/geom/Polygon'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Fill, Stroke, Style, Text } from 'ol/style'
import { click } from 'ol/events/condition'
import Select from 'ol/interaction/Select'
import { occupyGrid } from '@/action/occupy'

export default function OLMap() {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return

    const lonMin = 120.0
    const latMin = 20.0
    const lonMax = 122.5
    const latMax = 25.5
    const gridSize = 0.01

    const features = []
    for (let lon = lonMin; lon < lonMax; lon += gridSize) {
      for (let lat = latMin; lat < latMax; lat += gridSize) {
        const coordinates = [
          [
            [lon, lat],
            [lon + gridSize, lat],
            [lon + gridSize, lat + gridSize],
            [lon, lat + gridSize],
            [lon, lat]
          ].map(coord => fromLonLat(coord))
        ]

        const polygon = new Polygon(coordinates)
        const centerLon = lon + gridSize / 2
        const centerLat = lat + gridSize / 2
        const id = `grid_${(centerLon * 1000).toFixed(0)}_${(centerLat * 1000).toFixed(0)}`
        const label = `${centerLon.toFixed(3)}, ${centerLat.toFixed(3)}`

        const feature = new Feature({
          geometry: polygon,
          label,
          id
        })

        features.push(feature)
      }
    }

    const vectorSource = new VectorSource({ features })

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) =>
        new Style({
          stroke: new Stroke({ color: 'red', width: 1 }),
          fill: new Fill({ color: 'rgba(255, 0, 0, 0.1)' }),
          text: new Text({
            text: feature.get('label'),
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: 'white', width: 2 }),
            font: '12px sans-serif',
            overflow: true,
            placement: 'point',
            textAlign: 'center'
          })
        }),
      visible: false
    })

    const view = new View({
      center: fromLonLat([121.0, 23.5]),
      zoom: 8
    })

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer
      ],
      view: view
    })

    const updateGridVisibility = () => {
      const zoom = view.getZoom()
      vectorLayer.setVisible(zoom >= 14)
    }

    updateGridVisibility()
    view.on('change:resolution', updateGridVisibility)

    // ✅ 點擊地塊觸發 Firestore 寫入
    const selectClick = new Select({ condition: click })
    map.addInteraction(selectClick)

    selectClick.on('select', async (e) => {
      const selected = e.selected[0]
      if (!selected) return

      const id = selected.get('id')
      const label = selected.get('label')

      try {
        await occupyGrid({ id, label }) // ✅ 寫入 Firestore
        alert(`你佔領了格子 ${id}`)
        // 🚀 你可以在這裡進一步更新地圖樣式
      } catch (err) {
        console.error('佔領失敗', err)
        alert('佔領失敗，請稍後再試')
      }
    })

    return () => {
      map.setTarget(null)
    }
  }, [])

  return <div ref={mapRef} className="w-full h-screen" />
}
