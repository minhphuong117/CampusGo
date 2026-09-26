/**
 * router.js - Thuật toán Tìm đường Đi Bộ Tối Ưu (Dijkstra) & Tạo Chỉ Dẫn Chi Tiết
 */

class CampusRouter {
  constructor(nodes, edges, locations) {
    this.nodes = nodes || window.CAMPUS_GRAPH_NODES;
    this.edges = edges || window.CAMPUS_GRAPH_EDGES;
    this.locations = locations || window.CAMPUS_LOCATIONS;
    this.locationMap = new Map();
    this.locations.forEach(loc => this.locationMap.set(loc.id, loc));

    // Hệ số quy đổi: 1 pixel SVG ~ 0.12 mét thực tế
    this.PIXEL_TO_METERS = 0.12;
    // Tốc độ đi bộ trung bình: ~75 mét/phút (~1.25 m/s)
    this.WALKING_SPEED_MPM = 75;

    this.adjList = new Map();
    this.buildGraph();
  }

  // Xây dựng danh sách kề có trọng số (khoảng cách Euclidean)
  buildGraph() {
    for (const nodeId in this.nodes) {
      this.adjList.set(nodeId, []);
    }

    this.edges.forEach(edge => {
      const n1 = this.nodes[edge.from];
      const n2 = this.nodes[edge.to];
      if (!n1 || !n2) return;

      const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);

      // Đồ thị vô hướng (người đi bộ có thể đi cả 2 chiều)
      this.adjList.get(edge.from).push({
        to: edge.to,
        weight: dist,
        desc: edge.desc
      });

      this.adjList.get(edge.to).push({
        to: edge.from,
        weight: dist,
        // Khi đi ngược lại, mô tả đi từ n2 sang n1
        desc: edge.descRev || this.reverseDescription(edge.desc, n2.name, n1.name)
      });
    });
  }

  // Đảo ngữ hướng dẫn khi đi chiều ngược lại
  reverseDescription(desc, fromName, toName) {
    return `Đi theo lối từ ${fromName} hướng về ${toName}`;
  }

  // Thuật toán Dijkstra tìm đường đi ngắn nhất
  findShortestPath(startNodeId, endNodeId) {
    if (startNodeId === endNodeId) {
      return { path: [startNodeId], distance: 0, steps: [] };
    }

    const distances = new Map();
    const previous = new Map();
    const edgeUsed = new Map();
    const unvisited = new Set();

    for (const nodeId in this.nodes) {
      distances.set(nodeId, Infinity);
      unvisited.add(nodeId);
    }
    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      // Tìm đỉnh chưa thăm có khoảng cách nhỏ nhất
      let curr = null;
      let minDst = Infinity;
      for (const node of unvisited) {
        const dst = distances.get(node);
        if (dst < minDst) {
          minDst = dst;
          curr = node;
        }
      }

      if (!curr || minDst === Infinity) break;
      if (curr === endNodeId) break;

      unvisited.delete(curr);

      const neighbors = this.adjList.get(curr) || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.to)) continue;

        const alt = distances.get(curr) + neighbor.weight;
        if (alt < distances.get(neighbor.to)) {
          distances.set(neighbor.to, alt);
          previous.set(neighbor.to, curr);
          edgeUsed.set(neighbor.to, neighbor.desc);
        }
      }
    }

    // Tái cấu trúc lại đường đi
    const path = [];
    const stepsDesc = [];
    let curr = endNodeId;

    if (!previous.has(curr) && curr !== startNodeId) {
      return null; // Không tìm thấy đường
    }

    while (curr) {
      path.unshift(curr);
      if (edgeUsed.has(curr)) {
        stepsDesc.unshift(edgeUsed.get(curr));
      }
      curr = previous.get(curr);
    }

    return {
      path,
      distance: distances.get(endNodeId),
      steps: stepsDesc
    };
  }

  // Hàm điều hướng chính nhận vào 2 Location ID
  navigate(startLocId, destLocId) {
    const startLoc = this.locationMap.get(startLocId);
    const destLoc = this.locationMap.get(destLocId);

    if (!startLoc || !destLoc) {
      return { success: false, message: "Không tìm thấy thông tin vị trí." };
    }

    if (startLocId === destLocId) {
      return {
        success: true,
        isSameLocation: true,
        startLoc,
        destLoc,
        points: [{ x: startLoc.x, y: startLoc.y }],
        totalDistanceMeters: 0,
        estimatedMinutes: 0,
        instructions: [
          {
            icon: "📍",
            text: `Bạn đang ở ngay tại ${startLoc.name}!`,
            detail: "Không cần di chuyển."
          }
        ]
      };
    }

    const routeResult = this.findShortestPath(startLoc.node, destLoc.node);
    if (!routeResult) {
      return { success: false, message: "Không thể tìm thấy tuyến đường kết nối 2 điểm này." };
    }

    // Tạo danh sách điểm tọa độ vẽ trên SVG
    const svgPoints = [];

    // Điểm đầu là tọa độ chính xác của startLoc
    svgPoints.push({ x: startLoc.x, y: startLoc.y });

    // Các điểm nút trên đồ thị
    routeResult.path.forEach(nodeId => {
      const n = this.nodes[nodeId];
      // Tránh lặp lại điểm quá gần
      const last = svgPoints[svgPoints.length - 1];
      if (!last || Math.hypot(last.x - n.x, last.y - n.y) > 8) {
        svgPoints.push({ x: n.x, y: n.y });
      }
    });

    // Điểm cuối là tọa độ chính xác của destLoc
    const lastPoint = svgPoints[svgPoints.length - 1];
    if (Math.hypot(lastPoint.x - destLoc.x, lastPoint.y - destLoc.y) > 8) {
      svgPoints.push({ x: destLoc.x, y: destLoc.y });
    }

    // Tính toán tổng khoảng cách
    let totalPixelDist = 0;
    for (let i = 0; i < svgPoints.length - 1; i++) {
      totalPixelDist += Math.hypot(
        svgPoints[i + 1].x - svgPoints[i].x,
        svgPoints[i + 1].y - svgPoints[i].y
      );
    }

    const totalDistanceMeters = Math.round(totalPixelDist * this.PIXEL_TO_METERS);
    const estimatedMinutes = Math.max(1, Math.round((totalDistanceMeters / this.WALKING_SPEED_MPM) * 10) / 10);

    // Tạo chỉ dẫn từng bước trực quan
    const instructions = this.generateStepInstructions(startLoc, destLoc, routeResult.steps);

    return {
      success: true,
      startLoc,
      destLoc,
      points: svgPoints,
      totalDistanceMeters,
      estimatedMinutes,
      instructions
    };
  }

  // Tạo chỉ dẫn chi tiết bằng chữ tiếng Việt
  generateStepInstructions(startLoc, destLoc, pathSteps) {
    const steps = [];

    // Bước 1: Khởi hành
    steps.push({
      icon: "🟢",
      badge: "Xuất phát",
      title: `Bắt đầu từ: ${startLoc.name}`,
      detail: `Vị trí: ${startLoc.floor} • ${startLoc.building}. Chuẩn bị di chuyển.`
    });

    // Các bước di chuyển qua khuôn viên
    if (pathSteps && pathSteps.length > 0) {
      pathSteps.forEach((desc, idx) => {
        let icon = "🚶‍♂️";
        if (desc.includes("Cầu Thang") || desc.includes("Cầu thang")) icon = "🪜";
        else if (desc.includes("Rẽ") || desc.includes("khúc cua")) icon = "↪️";
        else if (desc.includes("Cổng")) icon = "🚪";
        else if (desc.includes("Sân") || desc.includes("Cột Cờ")) icon = "🚩";

        steps.push({
          icon,
          badge: `Chặng ${idx + 1}`,
          title: desc,
          detail: "Đi theo lối chỉ dẫn trên bản đồ"
        });
      });
    }

    // Xử lý thông tin thay đổi tầng lầu (nếu có)
    const floorInstruction = this.getFloorTransition(startLoc, destLoc);
    if (floorInstruction) {
      steps.push(floorInstruction);
    }

    // Bước cuối: Đến nơi
    steps.push({
      icon: "🎯",
      badge: "Đích đến",
      title: `Đến: ${destLoc.name}`,
      detail: `${destLoc.floor} • ${destLoc.description || 'Bạn đã đến nơi.'}`
    });

    return steps;
  }

  // Tính toán việc lên/xuống cầu thang giữa các tầng
  getFloorTransition(startLoc, destLoc) {
    const floorRank = {
      "Sân trường": 0,
      "Mặt đất": 0,
      "Tầng trệt": 0,
      "Cầu thang": 0,
      "Tầng 1": 1,
      "Tầng 2": 2,
      "Tầng 3": 3
    };

    const sRank = floorRank[startLoc.floor] ?? 0;
    const dRank = floorRank[destLoc.floor] ?? 0;

    if (sRank === dRank) {
      return null;
    }

    if (dRank > sRank) {
      const diff = dRank - sRank;
      return {
        icon: "🪜",
        badge: "Leo lầu",
        title: `Đi lên ${destLoc.floor} (Lên ${diff} tầng)`,
        detail: `Sử dụng cầu thang của dãy nhà để lên ${destLoc.floor}. Đi dọc hành lang theo chỉ dẫn.`
      };
    } else {
      const diff = sRank - dRank;
      return {
        icon: "🪜",
        badge: "Xuống lầu",
        title: `Đi xuống ${destLoc.floor} (Xuống ${diff} tầng)`,
        detail: `Sử dụng cầu thang để di chuyển xuống ${destLoc.floor}.`
      };
    }
  }
}

window.CampusRouter = CampusRouter;
