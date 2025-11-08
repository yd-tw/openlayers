const fs = require('fs');
const path = require('path');

// 讀取原始 JSON 檔案
const inputFile = path.join(__dirname, 'linesTmp.json');
const outputFile = path.join(__dirname, 'output.geojson');

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error('讀取檔案錯誤:', err);
    return;
  }

  const jsonData = JSON.parse(data);

  // 轉換成 GeoJSON
  const geojson = {
    type: "FeatureCollection",
    features: jsonData.map(item => ({
      type: "Feature",
      properties: {
        id: item.id,
        name: item.name
      },
      geometry: {
        type: "LineString",
        coordinates: [item.start, item.end]
      }
    }))
  };

  // 寫入 GeoJSON 檔案
  fs.writeFile(outputFile, JSON.stringify(geojson, null, 2), 'utf8', err => {
    if (err) {
      console.error('寫入檔案錯誤:', err);
      return;
    }
    console.log('已成功轉換為 GeoJSON:', outputFile);
  });
});
