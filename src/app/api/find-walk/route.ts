import { NextRequest, NextResponse } from "next/server";

interface RoadSegment {
  id: number;
  name: string;
  rd_from: string;
  sidewalk: string | null;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  bike: number;
}

interface Point {
  lat: number;
  lng: number;
}

interface Node {
  lat: number;
  lng: number;
  g: number; // 從起點到目前節點的實際成本
  h: number; // 從目前節點到終點的啟發式估計成本
  f: number; // g + h
  parent: Node | null;
  segmentId?: number;
  key?: string; // 節點的唯一識別 key
}

// Min-Heap 實作，用於 A* 演算法的 openSet
class MinHeap {
  private heap: Node[] = [];

  // 取得堆的大小
  size(): number {
    return this.heap.length;
  }

  // 檢查堆是否為空
  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  // 插入新節點
  push(node: Node): void {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  // 取出最小值節點（f 值最小）
  pop(): Node | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  // 檢查堆中是否包含特定 key 的節點
  contains(key: string): boolean {
    return this.heap.some((node) => node.key === key);
  }

  // 更新節點（如果新的 f 值更小）
  update(node: Node): boolean {
    const index = this.heap.findIndex((n) => n.key === node.key);
    if (index === -1) return false;

    const oldF = this.heap[index].f;
    this.heap[index] = node;

    if (node.f < oldF) {
      this.bubbleUp(index);
    } else if (node.f > oldF) {
      this.bubbleDown(index);
    }
    return true;
  }

  // 向上調整（用於插入）
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].f >= this.heap[parentIndex].f) break;

      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  // 向下調整（用於刪除）
  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (
        leftChild < this.heap.length &&
        this.heap[leftChild].f < this.heap[smallest].f
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < this.heap.length &&
        this.heap[rightChild].f < this.heap[smallest].f
      ) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ];
      index = smallest;
    }
  }
}

// 計算兩點之間的距離（使用 Haversine 公式）
function calculateDistance(point1: Point, point2: Point): number {
  const R = 6371e3; // 地球半徑（公尺）
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 建立圖形結構
class Graph {
  private segments: RoadSegment[];
  private nodes: Map<string, Point>;
  private edges: Map<string, Array<{ to: string; segment: RoadSegment }>>;

  constructor(segments: RoadSegment[]) {
    this.segments = segments;
    this.nodes = new Map();
    this.edges = new Map();
    this.buildGraph();
  }

  private getNodeKey(lat: number, lng: number): string {
    // 使用較低的精度來合併接近的點
    return `${lat.toFixed(6)},${lng.toFixed(6)}`;
  }

  private buildGraph(): void {
    // 建立節點和邊
    for (const segment of this.segments) {
      const startKey = this.getNodeKey(segment.start_lat, segment.start_lng);
      const endKey = this.getNodeKey(segment.end_lat, segment.end_lng);

      // 加入節點
      if (!this.nodes.has(startKey)) {
        this.nodes.set(startKey, {
          lat: segment.start_lat,
          lng: segment.start_lng,
        });
      }
      if (!this.nodes.has(endKey)) {
        this.nodes.set(endKey, {
          lat: segment.end_lat,
          lng: segment.end_lng,
        });
      }

      // 加入雙向邊（假設道路是雙向的）
      if (!this.edges.has(startKey)) {
        this.edges.set(startKey, []);
      }
      if (!this.edges.has(endKey)) {
        this.edges.set(endKey, []);
      }

      this.edges.get(startKey)!.push({ to: endKey, segment });
      this.edges.get(endKey)!.push({ to: startKey, segment });
    }
  }

  // 尋找最接近給定座標的節點
  findNearestNode(point: Point): string | null {
    let nearestKey: string | null = null;
    let minDistance = Infinity;

    for (const [key, node] of this.nodes.entries()) {
      const distance = calculateDistance(point, node);
      if (distance < minDistance) {
        minDistance = distance;
        nearestKey = key;
      }
    }

    return nearestKey;
  }

  getNode(key: string): Point | undefined {
    return this.nodes.get(key);
  }

  getNeighbors(key: string): Array<{ to: string; segment: RoadSegment }> {
    return this.edges.get(key) || [];
  }

  // 計算邊的成本，優先選擇有人行道的路徑
  calculateEdgeCost(segment: RoadSegment): number {
    const distance = calculateDistance(
      { lat: segment.start_lat, lng: segment.start_lng },
      { lat: segment.end_lat, lng: segment.end_lng },
    );

    // 如果有人行道（sidewalk 不為 null），成本較低；如果沒有人行道，成本增加
    // 使用權重因子來調整偏好程度
    const sidewalkWeight =
      segment.sidewalk !== null && segment.sidewalk !== "" ? 1.0 : 3.0; // 無人行道的路徑成本是 3 倍

    return distance * sidewalkWeight;
  }
}

// A* 演算法實作（使用 MinHeap 優化）
function aStar(
  graph: Graph,
  startKey: string,
  endKey: string,
): Array<{ lat: number; lng: number; segmentId?: number }> | null {
  const startNode = graph.getNode(startKey);
  const endNode = graph.getNode(endKey);

  if (!startNode || !endNode) {
    return null;
  }

  const openSet = new MinHeap();
  const closedSet = new Set<string>();
  const gScores = new Map<string, number>();

  const startAStarNode: Node = {
    lat: startNode.lat,
    lng: startNode.lng,
    g: 0,
    h: calculateDistance(startNode, endNode),
    f: calculateDistance(startNode, endNode),
    parent: null,
    key: startKey,
  };

  openSet.push(startAStarNode);
  gScores.set(startKey, 0);

  while (!openSet.isEmpty()) {
    // 取出 f 值最小的節點 - O(log n) 而非 O(n log n)
    const current = openSet.pop()!;
    const currentKey = current.key!;

    // 到達終點
    if (currentKey === endKey) {
      const path: Array<{ lat: number; lng: number; segmentId?: number }> = [];
      let node: Node | null = current;
      while (node) {
        path.unshift({
          lat: node.lat,
          lng: node.lng,
          segmentId: node.segmentId,
        });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(currentKey);

    // 檢查所有鄰居
    const neighbors = graph.getNeighbors(currentKey);
    for (const { to: neighborKey, segment } of neighbors) {
      if (closedSet.has(neighborKey)) {
        continue;
      }

      const neighborNode = graph.getNode(neighborKey)!;
      const edgeCost = graph.calculateEdgeCost(segment);
      const tentativeG = current.g + edgeCost;

      const existingG = gScores.get(neighborKey);
      if (existingG === undefined || tentativeG < existingG) {
        gScores.set(neighborKey, tentativeG);

        const h = calculateDistance(neighborNode, endNode);
        const neighborAStarNode: Node = {
          lat: neighborNode.lat,
          lng: neighborNode.lng,
          g: tentativeG,
          h: h,
          f: tentativeG + h,
          parent: current,
          segmentId: segment.id,
          key: neighborKey,
        };

        // 使用 MinHeap 的 update 或 push
        if (!openSet.update(neighborAStarNode)) {
          openSet.push(neighborAStarNode);
        }
      }
    }
  }

  return null; // 找不到路徑
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { start, end } = body;

    // 驗證輸入
    if (
      !start ||
      !end ||
      typeof start.lat !== "number" ||
      typeof start.lng !== "number" ||
      typeof end.lat !== "number" ||
      typeof end.lng !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "請提供有效的起點和終點座標 (start.lat, start.lng, end.lat, end.lng)",
        },
        { status: 400 },
      );
    }

    const res = await fetch("https://tmp114514.ricecall.com/lines");
    const data = await res.json();
    const segments: RoadSegment[] = data?.lines || [];

    // 建立圖形
    const graph = new Graph(segments);

    // 尋找最接近起點和終點的節點
    const startKey = graph.findNearestNode(start);
    const endKey = graph.findNearestNode(end);

    if (!startKey || !endKey) {
      return NextResponse.json(
        { error: "無法找到接近起點或終點的道路節點" },
        { status: 404 },
      );
    }

    // 執行 A* 尋路
    const routePath = aStar(graph, startKey, endKey);

    if (!routePath) {
      return NextResponse.json({ error: "找不到路徑" }, { status: 404 });
    }

    // 計算統計資訊
    let totalDistance = 0;
    let sidewalkDistance = 0;
    const segmentDetails: Array<{
      id: number;
      name: string;
      sidewalk: string | null;
      distance: number;
    }> = [];

    for (let i = 0; i < routePath.length - 1; i++) {
      const segmentId = routePath[i + 1].segmentId;
      if (segmentId) {
        const segment = segments.find((s) => s.id === segmentId);
        if (segment) {
          const distance = calculateDistance(
            { lat: segment.start_lat, lng: segment.start_lng },
            { lat: segment.end_lat, lng: segment.end_lng },
          );
          totalDistance += distance;
          if (segment.sidewalk !== null && segment.sidewalk !== "") {
            sidewalkDistance += distance;
          }
          segmentDetails.push({
            id: segment.id,
            name: segment.name,
            sidewalk: segment.sidewalk,
            distance: Math.round(distance * 100) / 100,
          });
        }
      }
    }

    // 建立 GeoJSON 格式的路徑，將每個路段分開以便標記不同顏色
    const features = [];

    for (let i = 0; i < routePath.length - 1; i++) {
      const segmentId = routePath[i + 1].segmentId;
      let hasSidewalk = false;

      if (segmentId) {
        const segment = segments.find((s) => s.id === segmentId);
        if (segment && segment.sidewalk !== null && segment.sidewalk !== "") {
          hasSidewalk = true;
        }
      }

      features.push({
        type: "Feature",
        properties: {
          hasSidewalk: hasSidewalk,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [routePath[i].lng, routePath[i].lat],
            [routePath[i + 1].lng, routePath[i + 1].lat],
          ],
        },
      });
    }

    const geojson = {
      type: "FeatureCollection",
      features: features,
    };

    return NextResponse.json(geojson);
  } catch (error) {
    console.error("尋路錯誤:", error);
    return NextResponse.json(
      {
        error: "伺服器錯誤",
        details: error instanceof Error ? error.message : "未知錯誤",
      },
      { status: 500 },
    );
  }
}
