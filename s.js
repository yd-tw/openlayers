// 先安裝套件：npm install proj4 fs

const fs = require("fs");
const proj4 = require("proj4");

// 定義 TM2 坐標系（以台北市常用 TM2/TWD97為例）
const tm2 = "+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs";
const epsg3857 = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs";

// 讀取原始 JSON
const data = JSON.parse(fs.readFileSync("data.json", "utf8"));

// 將資料轉成 GeoJSON Feature
const features = data.result.results.map(item => {
  // 處理多段（# 分隔）
  const xSegments = item["路徑（x）"].split("#").map(s => s.split(",").map(Number));
  const ySegments = item["路徑（y）"].split("#").map(s => s.split(",").map(Number));

  const coordinates = xSegments.map((xSeg, idx) => {
    return xSeg.map((x, i) => {
      const y = ySegments[idx][i];
      // TM2 -> EPSG:3857
      return proj4(tm2, epsg3857, [x, y]);
    });
  });

  // 如果只有一段，使用 LineString；多段使用 MultiLineString
  const geometry = coordinates.length === 1
    ? { type: "LineString", coordinates: coordinates[0] }
    : { type: "MultiLineString", coordinates };

  return {
    type: "Feature",
    properties: {
      _id: item._id,
      路段序號: item["路段序號"],
      路段名稱: item["路段名稱"],
      起點描述: item["路段起點描述"],
      迄點描述: item["路段迄點描述"],
      自行車道長度: item["自行車道長度（m）"],
      自行車道寬度: item["自行車道寬度（m）"]
    },
    geometry
  };
});

// 組成 GeoJSON
const geojson = {
  type: "FeatureCollection",
  features
};

// 輸出到檔案
fs.writeFileSync("output.geojson", JSON.stringify(geojson, null, 2));

console.log("GeoJSON 已生成完成：output.geojson");
