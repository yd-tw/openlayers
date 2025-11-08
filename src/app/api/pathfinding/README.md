# A* 尋路 API 端點

這個 API 端點使用 A* 演算法來尋找兩點之間的最佳路徑，並優先選擇自行車道（bike=1）。

## 端點

```
POST /api/pathfinding
```

## 請求格式

```json
{
  "start": {
    "lat": 25.0169482,
    "lng": 121.5337558
  },
  "end": {
    "lat": 25.0455956,
    "lng": 121.5195799
  }
}
```

## 回應格式

### 成功回應 (200)

```json
{
  "success": true,
  "path": [
    {
      "lat": 25.0169482,
      "lng": 121.5337558,
      "segmentId": 1
    },
    {
      "lat": 25.0168832,
      "lng": 121.5336882,
      "segmentId": 2
    }
  ],
  "statistics": {
    "totalDistance": 1234.56,
    "bikeDistance": 987.65,
    "bikePercentage": 80.0,
    "segmentCount": 10
  },
  "segments": [
    {
      "id": 1,
      "name": "uiiai1",
      "bike": 1,
      "distance": 123.45
    }
  ]
}
```

### 錯誤回應

```json
{
  "error": "錯誤訊息"
}
```

## 使用範例

### JavaScript/Fetch

```javascript
const response = await fetch('/api/pathfinding', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    start: { lat: 25.0169482, lng: 121.5337558 },
    end: { lat: 25.0455956, lng: 121.5195799 }
  })
});

const data = await response.json();
console.log(data);
```

### cURL

```bash
curl -X POST http://localhost:3000/api/pathfinding \
  -H "Content-Type: application/json" \
  -d '{
    "start": {"lat": 25.0169482, "lng": 121.5337558},
    "end": {"lat": 25.0455956, "lng": 121.5195799}
  }'
```

## 演算法說明

### A* 尋路演算法

此 API 使用 A* 演算法來尋找最佳路徑：

1. **啟發式函數 (Heuristic)**：使用 Haversine 公式計算兩點之間的直線距離
2. **成本函數 (Cost)**：
   - `bike=1` 的路段：實際距離 × 1.0
   - `bike=0` 的路段：實際距離 × 3.0

   這樣的設計使演算法會優先選擇自行車道，只有在必要時才使用非自行車道

### 圖形建構

- 將每個道路段落的起點和終點視為圖形節點
- 道路段落視為雙向邊（可雙向通行）
- 使用經緯度的 6 位小數精度來合併接近的節點

### 效能優化

- 對於大型資料集（41,790 條道路段落），建議考慮：
  - 預先建立圖形並快取
  - 使用空間索引（如 R-tree）加速最近節點查找
  - 限制搜尋範圍

## 回應欄位說明

- `path`: 路徑上的所有節點座標和對應的道路段落 ID
- `statistics.totalDistance`: 總距離（公尺）
- `statistics.bikeDistance`: 自行車道距離（公尺）
- `statistics.bikePercentage`: 自行車道佔比（%）
- `statistics.segmentCount`: 經過的道路段落數量
- `segments`: 詳細的道路段落資訊
