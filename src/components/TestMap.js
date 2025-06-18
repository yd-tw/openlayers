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
import { fromLonLat } from 'ol/proj'
import { Fill, Stroke, Style, Text } from 'ol/style'
import { click } from 'ol/events/condition'
import Select from 'ol/interaction/Select'
import { occupyGrid, getOccupiedGrids } from '@/action/occupy'

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
    const featureMap = new Map()

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
          id,
          label,
          owner: null
        })

        features.push(feature)
        featureMap.set(id, feature)
      }
    }

    const vectorSource = new VectorSource({ features })

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const owner = feature.get('owner')
        const label = feature.get('label')

        let strokeColor = 'red'
        let fillColor = 'rgba(255, 0, 0, 0.1)'
        let displayLabel = label

        if (owner === 'anonymous') {
          strokeColor = 'blue'
          fillColor = 'rgba(0, 0, 255, 0.1)'
          displayLabel = `${label}\n你已佔領`
        } else if (owner) {
          strokeColor = 'gray'
          fillColor = 'rgba(0, 0, 0, 0.1)'
          displayLabel = `${label}\n已被佔領`
        }

        return new Style({
          stroke: new Stroke({ color: strokeColor, width: 1 }),
          fill: new Fill({ color: fillColor }),
          text: new Text({
            text: displayLabel,
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({ color: 'white', width: 2 }),
            font: '12px sans-serif',
            overflow: true,
            placement: 'point',
            textAlign: 'center'
          })
        })
      },
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

    // ✅ 載入佔領資料
    getOccupiedGrids().then((occupiedMap) => {
      Object.entries(occupiedMap).forEach(([id, data]) => {
        const feature = featureMap.get(id)
        if (feature) {
          feature.set('owner', data.owner)
        }
      })
      vectorLayer.changed() // 重新觸發樣式渲染
    })

    // ✅ 點擊地塊觸發佔領
    const selectClick = new Select({ condition: click })
    map.addInteraction(selectClick)

    selectClick.on('select', async (e) => {
      const selected = e.selected[0]
      if (!selected) return

      const id = selected.get('id')
      const label = selected.get('label')

      try {
        await occupyGrid({ id, label })
        selected.set('owner', 'anonymous') // 立即更新畫面
        vectorLayer.changed()
        alert(`你佔領了格子 ${id}`)
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
