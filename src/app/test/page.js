// 'use client';

// import { useEffect, useRef } from 'react';
// import Map from 'ol/Map';
// import View from 'ol/View';
// import TileLayer from 'ol/layer/Tile';
// import OSM from 'ol/source/OSM';
// import { fromLonLat } from 'ol/proj';
// import Geolocation from 'ol/Geolocation';
// import Overlay from 'ol/Overlay';
// import DeviceOrientation from 'ol/DeviceOrientation';
// import 'ol/ol.css';

// export default function GeolocationMap() {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const markerRef = useRef<HTMLDivElement>(null);
//   const mapInstanceRef = useRef<Map | null>(null);

//   useEffect(() => {
//     if (!mapRef.current || !markerRef.current || mapInstanceRef.current) return;

//     // 創建圖層
//     const layer = new TileLayer({
//       source: new OSM()
//     });

//     // 設置倫敦座標
//     const london = fromLonLat([-0.12755, 51.507222]);

//     // 創建視圖
//     const view = new View({
//       center: london,
//       zoom: 6
//     });

//     // 創建地圖
//     const map = new Map({
//       target: mapRef.current,
//       layers: [layer],
//       view: view
//     });

//     mapInstanceRef.current = map;

//     // 設置地理定位追蹤
//     const geolocation = new Geolocation({
//       tracking: true,
//       projection: view.getProjection()
//     });

//     // 監聽位置變化並更新視圖中心
//     geolocation.on('change:position', function() {
//       const position = geolocation.getPosition();
//       if (position) {
//         view.setCenter(position);
//       }
//     });

//     // 創建位置標記
//     const marker = new Overlay({
//       element: markerRef.current,
//       positioning: 'center-center'
//     });

//     map.addOverlay(marker);

//     // 綁定標記到地理定位位置
//     geolocation.on('change:position', function() {
//       const position = geolocation.getPosition();
//       if (position) {
//         marker.setPosition(position);
//       }
//     });

//     // 創建設備方向追蹤
//     const deviceOrientation = new DeviceOrientation({
//       tracking: true
//     });

//     // 監聽方向變化並旋轉視圖
//     deviceOrientation.on('change:heading', function(event) {
//       const heading = event.target.getHeading();
//       if (heading !== undefined) {
//         view.setRotation(-heading);
//       }
//     });

//     // 處理地理定位錯誤
//     geolocation.on('error', function(error) {
//       console.error('Geolocation error:', error.message);
//     });

//     // 清理函數
//     return () => {
//       if (mapInstanceRef.current) {
//         mapInstanceRef.current.setTarget(undefined);
//         mapInstanceRef.current = null;
//       }
//     };
//   }, []);

//   return (
//     <div className="relative w-full h-screen">
//       <div ref={mapRef} className="w-full h-full" />

//       {/* 位置標記 */}
//       <div
//         ref={markerRef}
//         className="w-10 h-10 bg-blue-500/80 border-4 border-white rounded-full flex items-center justify-center shadow-lg"
//       >
//         <svg
//           className="w-5 h-5 text-white"
//           fill="currentColor"
//           viewBox="0 0 20 20"
//         >
//           <path
//             fillRule="evenodd"
//             d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z"
//             clipRule="evenodd"
//             transform="rotate(90 10 10)"
//           />
//         </svg>
//       </div>
//     </div>
//   );
// }
