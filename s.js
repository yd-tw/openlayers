/*
  將使用者提供的資料（含「路徑（x）」、「路徑（y）」欄位）轉為標準 GeoJSON。
  - 若同一筆資料的路徑中包含「#」，視為多段（MultiLineString）。
  - 預設會保留原始座標 (x,y) 為 GeoJSON 座標 ( [x, y] )。
  - 如果你要把投影座標 (例如 TWD97 TM2) 轉回 WGS84 經緯度，請安裝並啟用 proj4。

  使用方式 (Node.js):
    1. 準備好 data.json
    2. node convert_to_geojson.js
    3. 輸出檔案會是 output.geojson
*/

const fs = require('fs');

// 主轉換函式
function convertToGeoJSON(data, options = {}) {
  const records = data.results || (data.result && data.result.results);
  if (!records) throw new Error('輸入格式錯誤：找不到 data.results 或 data.result.results');
  const features = records.map(item => {
    const rawX = item['路徑（x）'] || item['路徑(x)'] || '';
    const rawY = item['路徑（y）'] || item['路徑(y)'] || '';

    if (!rawX || !rawY) {
      return {
        type: 'Feature',
        properties: filterProps(item),
        geometry: null
      };
    }

    const xSegments = rawX.split('#').map(s => s.trim()).filter(Boolean);
    const ySegments = rawY.split('#').map(s => s.trim()).filter(Boolean);

    let segments = [];
    if (xSegments.length === ySegments.length) {
      for (let i = 0; i < xSegments.length; i++) {
        const xs = xSegments[i].split(',').map(t => t.trim()).filter(Boolean);
        const ys = ySegments[i].split(',').map(t => t.trim()).filter(Boolean);
        const coords = pairXY(xs, ys, options);
        if (coords.length) segments.push(coords);
      }
    } else {
      const xs = rawX.split(',').map(t => t.trim()).filter(Boolean);
      const ys = rawY.split(',').map(t => t.trim()).filter(Boolean);
      const coords = pairXY(xs, ys, options);
      if (coords.length) segments.push(coords);
    }

    let geometry = null;
    if (segments.length === 1) {
      geometry = { type: 'LineString', coordinates: segments[0] };
    } else if (segments.length > 1) {
      geometry = { type: 'MultiLineString', coordinates: segments };
    } else {
      geometry = null;
    }

    return {
      type: 'Feature',
      properties: filterProps(item),
      geometry
    };
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

function pairXY(xs, ys, options) {
  const n = Math.min(xs.length, ys.length);
  const coords = [];
  for (let i = 0; i < n; i++) {
    const xi = parseFloat(xs[i]);
    const yi = parseFloat(ys[i]);
    if (Number.isFinite(xi) && Number.isFinite(yi)) {
      if (options.transform && typeof options.transformFn === 'function') {
        coords.push(options.transformFn([xi, yi]));
      } else {
        coords.push([xi, yi]);
      }
    }
  }
  return coords;
}

function filterProps(item) {
  const props = {};
  for (const k in item) {
    if (Object.prototype.hasOwnProperty.call(item, k)) {
      if (k === '路徑（x）' || k === '路徑（y）' || k === '路徑(x)' || k === '路徑(y)') continue;
      props[k] = item[k];
    }
  }
  return props;
}

// 主執行區塊
(async () => {
  try {
    const inputPath = './data.json';
    const outputPath = './output.geojson';

    if (!fs.existsSync(inputPath)) {
      console.error(`找不到輸入檔案 ${inputPath}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(raw);

    const options = { transform: false, transformFn: null };

    const geojson = convertToGeoJSON(data, options);
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2), 'utf8');

    console.log(`✅ 轉換完成！輸出檔案：${outputPath}`);
  } catch (err) {
    console.error('轉換失敗：', err);
    process.exit(1);
  }
})();

module.exports = { convertToGeoJSON };
