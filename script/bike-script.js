// 先安裝套件：npm install proj4 fs

const fs = require("fs");
const proj4 = require("proj4");

// 定義 TWD97 二度分帶座標系（TM2，中央經線 121度）
const twd97 = "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

// 定義 WGS84 經緯度座標系
const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";

// 讀取原始 JSON（直接是陣列格式）
const data = JSON.parse(fs.readFileSync("data.json", "utf8"));

// 將資料轉成 GeoJSON Feature
const features = data.map((item, index) => {
  // 檢查必要欄位是否存在
  if (!item["路徑（X）"] || !item["路徑（Y）"]) {
    console.warn(`路段 ${item["路段序號"]} 缺少座標資料，已跳過`);
    return null;
  }

  // 處理座標（逗號分隔）
  const xCoords = item["路徑（X）"].split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && isFinite(n));
  const yCoords = item["路徑（Y）"].split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && isFinite(n));

  // 檢查座標數量是否一致
  if (xCoords.length === 0 || yCoords.length === 0) {
    console.warn(`路段 ${item["路段序號"]} 座標資料無效，已跳過`);
    return null;
  }

  if (xCoords.length !== yCoords.length) {
    console.warn(`路段 ${item["路段序號"]} X 和 Y 座標數量不一致 (X:${xCoords.length}, Y:${yCoords.length})，已跳過`);
    return null;
  }

  // TWD97 -> WGS84 經緯度轉換
  const coordinates = xCoords.map((x, i) => {
    const y = yCoords[i];
    try {
      // proj4 輸入是 [x, y]，輸出是 [經度, 緯度]
      return proj4(twd97, wgs84, [x, y]);
    } catch (error) {
      console.error(`路段 ${item["路段序號"]} 座標轉換失敗 (X:${x}, Y:${y}):`, error.message);
      return null;
    }
  }).filter(coord => coord !== null);

  if (coordinates.length === 0) {
    console.warn(`路段 ${item["路段序號"]} 所有座標轉換失敗，已跳過`);
    return null;
  }

  // 建立 LineString geometry
  const geometry = {
    type: "LineString",
    coordinates
  };

  return {
    type: "Feature",
    properties: {
      路段序號: item["路段序號"],
      自行車道路線編號: item["自行車道路線編號"],
      路段名稱: item["路段名稱"],
      路段起點描述: item["路段起點描述"],
      路段迄點描述: item["路段迄點描述"],
      縣市別: item["縣市別"],
      鄉鎮別: item["鄉鎮別"],
      管養單位: item["管養單位"],
      所屬道路寬度: item["所屬道路寬度（M）"],
      自行車道車行方向: item["自行車道車行方向"],
      自行車道類型: item["自行車道類型"],
      自行車道鋪面類別: item["自行車道鋪面類別"],
      自行車道長度: item["自行車道長度（M）"],
      自行車道寬度: item["自行車道寬度（M）"],
      自行車道道路結構: item["自行車道道路結構"],
      補助經費: item["補助經費（百萬元）"],
      補助機關: item["補助機關"],
      完工日期: item["完工日期"],
      備註: item["備註"]
    },
    geometry
  };
}).filter(feature => feature !== null); // 移除無效的資料

// 組成 GeoJSON（使用 WGS84）
const geojson = {
  type: "FeatureCollection",
  crs: {
    type: "name",
    properties: {
      name: "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  features
};

// 輸出到檔案
fs.writeFileSync("output.geojson", JSON.stringify(geojson, null, 2));

console.log("\n=== 轉換完成 ===");
console.log(`總路段數: ${data.length}`);
console.log(`成功轉換: ${features.length}`);
console.log(`失敗或跳過: ${data.length - features.length}`);
console.log("輸出檔案: output.geojson");
