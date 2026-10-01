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

    // 1. Thu thập danh sách các điểm nút đồ thị
    const rawPoints = [];
    rawPoints.push({ x: startLoc.x, y: startLoc.y });

    routeResult.path.forEach(nodeId => {
      const n = this.nodes[nodeId];
      if (n) {
        const last = rawPoints[rawPoints.length - 1];
        if (!last || Math.hypot(last.x - n.x, last.y - n.y) > 6) {
          rawPoints.push({ x: n.x, y: n.y });
        }
      }
    });

    const lastRaw = rawPoints[rawPoints.length - 1];
    if (Math.hypot(lastRaw.x - destLoc.x, lastRaw.y - destLoc.y) > 6) {
      rawPoints.push({ x: destLoc.x, y: destLoc.y });
    }

    // 2. KHỬ HOÀN TOÀN CÁC ĐOẠN ĐƯỜNG XIÊN VẸO: BẺ GÓC 90 ĐỘ THẲNG HÀNG CHUẨN GOOGLE MAPS
    const svgPoints = this.orthogonalizePoints(rawPoints);

    // 3. Tính toán tổng khoảng cách thực tế (theo lối đi vuông góc)
    let totalPixelDist = 0;
    for (let i = 0; i < svgPoints.length - 1; i++) {
      totalPixelDist += Math.hypot(
        svgPoints[i + 1].x - svgPoints[i].x,
        svgPoints[i + 1].y - svgPoints[i].y
      );
    }

    const totalDistanceMeters = Math.max(10, Math.round(totalPixelDist * this.PIXEL_TO_METERS));
    // Tốc độ đi bộ học sinh ~1.2 m/s (~72m/phút). Mỗi tầng cầu thang cộng thêm ~0.4 phút
    const floorDiff = Math.abs(this.getFloorNumber(startLoc.floor) - this.getFloorNumber(destLoc.floor));
    const rawWalkMinutes = (totalDistanceMeters / 70) + (floorDiff * 0.4);
    const estimatedMinutes = Math.max(1, Math.round(rawWalkMinutes * 10) / 10);
    const estimatedSeconds = Math.round(rawWalkMinutes * 60);
    
    // Định dạng thời gian di chuyển kiểu Google Maps
    let formattedTime = "";
    if (estimatedSeconds < 60) {
      formattedTime = `< 1 phút (${estimatedSeconds} giây)`;
    } else {
      const mins = Math.floor(estimatedSeconds / 60);
      const secs = estimatedSeconds % 60;
      formattedTime = secs > 10 ? `${mins} phút ${secs}s` : `~${mins} phút`;
    }

    // Số bước chân & calo tiêu thụ
    const estimatedSteps = Math.round(totalDistanceMeters * 1.35);
    const calorieBurn = Math.round(totalDistanceMeters * 0.042 * 10) / 10;

    // 4. Tạo chỉ dẫn từng bước chi tiết theo phong cách Google Maps
    const instructions = this.generateStepInstructions(startLoc, destLoc, routeResult.steps, svgPoints);

    return {
      success: true,
      startLoc,
      destLoc,
      points: svgPoints,
      totalDistanceMeters,
      estimatedMinutes,
      formattedTime,
      estimatedSteps,
      calorieBurn,
      optimalBadge: "Tuyến đường tối ưu nhất (Ngắn & Nhanh nhất)",
      instructions
    };
  }

  // Thuật toán nắn thẳng mọi đoạn đường thành các trục ngang - dọc vuông góc 90° (không xiên vẹo)
  orthogonalizePoints(points) {
    if (!points || points.length <= 1) return points;
    const clean = [];
    clean.push({ x: points[0].x, y: points[0].y });

    for (let i = 1; i < points.length; i++) {
      const prev = clean[clean.length - 1];
      const curr = points[i];

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;

      // Nếu cả X và Y đều lệch nhau (đoạn xiên chéo), chèn điểm bẻ góc 90 độ
      if (Math.abs(dx) > 3 && Math.abs(dy) > 3) {
        // Nhận diện xem điểm đích có nằm trên hành lang ngang (y cố định) hay trục dọc không
        const isHorizontalCorridor = [918, 835, 777, 697, 612, 576, 538, 500, 378, 304, 260, 216, 186].some(y => Math.abs(curr.y - y) <= 6);
        if (isHorizontalCorridor) {
          // Đi thẳng trục dọc trước để nhập vào hành lang ngang, rồi đi ngang
          clean.push({ x: prev.x, y: curr.y });
        } else {
          // Đi ngang trước rồi rẽ vào trục dọc
          clean.push({ x: curr.x, y: prev.y });
        }
      }
      clean.push({ x: curr.x, y: curr.y });
    }

    // Đơn giản hóa: bỏ các điểm thẳng hàng liên tiếp
    const simplified = [clean[0]];
    for (let i = 1; i < clean.length - 1; i++) {
      const pPrev = simplified[simplified.length - 1];
      const pCurr = clean[i];
      const pNext = clean[i + 1];

      const isCollinearX = Math.abs(pPrev.x - pCurr.x) < 1 && Math.abs(pCurr.x - pNext.x) < 1;
      const isCollinearY = Math.abs(pPrev.y - pCurr.y) < 1 && Math.abs(pCurr.y - pNext.y) < 1;
      if (!isCollinearX && !isCollinearY) {
        simplified.push(pCurr);
      }
    }
    simplified.push(clean[clean.length - 1]);
    return simplified;
  }

  getFloorNumber(floorStr) {
    if (!floorStr) return 0;
    if (floorStr.includes("3")) return 3;
    if (floorStr.includes("2")) return 2;
    if (floorStr.includes("1")) return 1;
    return 0;
  }

  // Tạo chỉ dẫn chi tiết từng bước chuẩn Google Maps
  generateStepInstructions(startLoc, destLoc, pathSteps, svgPoints) {
    const steps = [];

    // Bước 1: Khởi hành
    steps.push({
      icon: "🟢",
      badge: "Xuất phát",
      title: `Bắt đầu tại: ${startLoc.name}`,
      detail: `Vị trí: ${startLoc.floor} • ${startLoc.building}. Chuẩn bị di chuyển theo đường kẻ xanh.`
    });

    // Các bước di chuyển dọc theo hành lang
    if (pathSteps && pathSteps.length > 0) {
      pathSteps.forEach((desc, idx) => {
        let icon = "⬆️";
        if (desc.includes("Cầu Thang") || desc.includes("Cầu thang") || desc.includes("Leo")) {
          icon = "🪜";
        } else if (desc.includes("Rẽ trái") || desc.includes("trái")) {
          icon = "↰";
        } else if (desc.includes("Rẽ phải") || desc.includes("phải")) {
          icon = "↱";
        } else if (desc.includes("Cổng")) {
          icon = "🚪";
        } else if (desc.includes("Cột Cờ") || desc.includes("Sân")) {
          icon = "🚩";
        }

        steps.push({
          icon,
          badge: `Chặng ${idx + 1}`,
          title: desc,
          detail: "Đi theo lối kẻ thẳng màu xanh trên bản đồ"
        });
      });
    }

    // Xử lý thông tin chuyển tầng
    const floorInstruction = this.getFloorTransition(startLoc, destLoc);
    if (floorInstruction) {
      steps.push(floorInstruction);
    }

    // Bước cuối: Đến nơi
    steps.push({
      icon: "🎯",
      badge: "Đích đến",
      title: `Đến: ${destLoc.name}`,
      detail: `${destLoc.floor} • ${destLoc.description || 'Bạn đã đến nơi cần tìm.'}`
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
