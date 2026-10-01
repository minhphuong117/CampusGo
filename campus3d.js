/**
 * campus3d.js - Trình Diễn Sơ Đồ 3D Không Gian Khuôn Viên Trường Học
 * Trực quan hóa kết cấu các tầng, cầu thang nội bộ và hệ thống hành lang liên tòa nhà:
 * - Hành lang Tầng trệt nối Dãy Lớp Trước (đối diện P.01 vàng) sang Dãy Hội Đồng.
 * - Cầu hành lang Lầu 1 nối Dãy Lớp Trước (đối diện P.05) sang Dãy Hội Đồng (ngay phía trên song song).
 * - Hành lang nối Dãy Lớp Sau với Dãy Lớp Trước & Dãy Thiết Bị.
 * - Cầu thang 3D kết nối các tầng (Trệt, 1, 2, 3).
 */

class Campus3DViewer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Không tìm thấy phần tử #${containerId}`);
      return;
    }

    this.options = options;
    this.currentFloorFilter = 'all'; // 'all', 'g', 't1', 't2', 't3'
    this.buildingGroups = [];
    this.labels = [];
    this.corridorObjects = [];
    this.interactiveRooms = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initScene();
    this.buildCampus();
    this.setupEvents();
    this.animate();
  }

  initScene() {
    const width = this.container.clientWidth || 1200;
    const height = this.container.clientHeight || 750;

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf1f5f9);
    this.scene.fog = new THREE.FogExp2(0xf1f5f9, 0.0035);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 1000);
    // Vị trí mặc định: Góc nhìn Isometric từ phía Nam - Tây Nam
    this.camera.position.set(-65, 55, 75);

    // 3. OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // Không chui xuống dưới đất
    this.controls.minDistance = 15;
    this.controls.maxDistance = 250;
    this.controls.target.set(0, 5, 5);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xf1f5f9, 0.45);
    hemiLight.position.set(0, 100, 0);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 0.85);
    sunLight.position.set(-50, 90, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    const d = 80;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.35);
    fillLight.position.set(60, 40, -50);
    this.scene.add(fillLight);
  }

  // Tạo texture chữ viết sắc nét cho phòng và nhãn
  createCanvasLabel(text, subtext = '', bgColor = '#ffffff', textColor = '#0f172a', borderColor = '#94a3b8', width = 256, height = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Nền
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, height - 8, 12);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // Tiêu đề
    ctx.fillStyle = textColor;
    ctx.font = `bold ${subtext ? 36 : 44}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = subtext ? 'bottom' : 'middle';
    ctx.fillText(text, width / 2, subtext ? height / 2 + 6 : height / 2);

    // Phụ đề
    if (subtext) {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(subtext, width / 2, height / 2 + 10);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  buildCampus() {
    this.buildGround();
    this.buildBackBuilding();      // 1. Dãy Lớp Sau (Phía Bắc - 4 tầng)
    this.buildFrontClassBuilding(); // 2. Dãy Lớp Trước (Phía Tây - 4 tầng)
    this.buildAdminBuilding();      // 3. Dãy Phòng Hội Đồng / Hành Chính (Phía Tây Nam - 2 tầng)
    this.buildEastBuilding();       // 4. Dãy Nhà Thiết Bị & Khối Chức Năng (Phía Đông)
    this.buildWestConnectingBridges(); // 5. CÁC HÀNH LANG NỐI 2 DÃY TÂY (Trệt & Lầu 1 - Yêu cầu chính)
    this.buildCentralCanopyAndFlag();  // 6. Mái Che Tam Giác & Cột Cờ
    this.buildCampusEnvironment();     // 7. Cổng trường, Sân bóng, Nhà xe & Cây xanh
  }

  // Sân trường và mặt đất
  buildGround() {
    // Mặt sân chính
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Kẻ lưới gạch sân trường nhẹ
    const grid = new THREE.GridHelper(150, 50, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // Sân cờ trung tâm (bán kính tròn lát đá màu nổi bật)
    const plazaGeo = new THREE.CircleGeometry(16, 48);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.7 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.03, 12);
    plaza.receiveShadow = true;
    this.scene.add(plaza);
  }

  // Helper tạo khối phòng học chuẩn 3D
  createRoomBlock(name, x, y, z, w, h, d, options = {}) {
    const isHighlight = options.isHighlight || false;
    const bgColor = options.color || (isHighlight ? 0xfef08a : 0xffffff);
    const strokeColor = options.stroke || (isHighlight ? '#ca8a04' : '#94a3b8');
    const textColor = options.textColor || (isHighlight ? '#854d0e' : '#1e293b');
    const floorKey = options.floorKey || 'g';

    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData = { name, floorKey, info: options.info || '' };

    // Khối tường/thân phòng
    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const boxMat = new THREE.MeshStandardMaterial({
      color: bgColor,
      roughness: 0.5,
      metalness: 0.05
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    // Viền khung sắc nét
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: isHighlight ? 0xd97706 : 0x94a3b8, linewidth: 1.5 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    group.add(wireframe);

    // Mặt nhãn hiển thị tên phòng trên mái/mặt trước
    if (name && name !== '-') {
      const labelMat = new THREE.MeshBasicMaterial({
        map: this.createCanvasLabel(name, options.subtext || '', isHighlight ? '#fef08a' : '#ffffff', textColor, strokeColor),
        transparent: true
      });
      // Nhãn trên nóc phòng
      const topLabelGeo = new THREE.PlaneGeometry(w * 0.85, d * 0.7);
      const topLabel = new THREE.Mesh(topLabelGeo, labelMat);
      topLabel.rotation.x = -Math.PI / 2;
      topLabel.position.y = h / 2 + 0.05;
      group.add(topLabel);

      // Nhãn mặt trước phòng (hướng ra hành lang)
      const frontLabelGeo = new THREE.PlaneGeometry(w * 0.8, h * 0.45);
      const frontLabel = new THREE.Mesh(frontLabelGeo, labelMat);
      frontLabel.position.set(0, 0, d / 2 + 0.05);
      group.add(frontLabel);
    }

    this.interactiveRooms.push(group);
    return group;
  }

  // Helper tạo cầu thang kết nối các tầng trong 3D
  createStairTower(x, z, totalFloors = 4, floorHeight = 4, width = 6, depth = 8, name = "CẦU THANG") {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const totalHeight = totalFloors * floorHeight;

    // Vỏ kính trong suốt bảo vệ lồng cầu thang
    const towerGeo = new THREE.BoxGeometry(width, totalHeight, depth);
    const towerMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 1.2
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = totalHeight / 2;
    group.add(tower);

    // Khung cột thép 4 góc
    const frameGeo = new THREE.EdgesGeometry(towerGeo);
    const frameMat = new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 2 });
    const frame = new THREE.LineSegments(frameGeo, frameMat);
    frame.position.y = totalHeight / 2;
    group.add(frame);

    // Các bậc thang 3D gián đoạn giữa các tầng
    const stepCount = 8;
    for (let f = 0; f < totalFloors; f++) {
      const baseY = f * floorHeight;
      // Chiếu nghỉ giữa tầng
      const landingGeo = new THREE.BoxGeometry(width * 0.85, 0.25, depth * 0.35);
      const landingMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
      const landing = new THREE.Mesh(landingGeo, landingMat);
      landing.position.set(0, baseY + floorHeight * 0.5, 0);
      landing.receiveShadow = true;
      group.add(landing);

      // Các bậc thang chéo vươn lên
      for (let s = 0; s < stepCount; s++) {
        const stepY = baseY + (s / stepCount) * floorHeight;
        const stepZ = (s / stepCount - 0.5) * (depth * 0.7);
        const stepGeo = new THREE.BoxGeometry(width * 0.75, 0.2, 0.45);
        const step = new THREE.Mesh(stepGeo, landingMat);
        step.position.set(0, stepY, stepZ);
        step.castShadow = true;
        group.add(step);
      }

      // Biển báo tầng ở lồng cầu thang
      const labelMat = new THREE.MeshBasicMaterial({
        map: this.createCanvasLabel(`Cầu Thang`, f === 0 ? 'Tầng trệt' : `Tầng ${f}`, '#e2e8f0', '#1e293b', '#64748b', 256, 128),
        transparent: true
      });
      const lbl = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.7, 1.8), labelMat);
      lbl.position.set(0, baseY + 2.2, depth / 2 + 0.08);
      group.add(lbl);
    }

    return group;
  }

  // 1. DÃY LỚP HỌC SAU (Phía Bắc - 4 Tầng: Trệt, 1, 2, 3)
  buildBackBuilding() {
    const building = new THREE.Group();
    building.name = "Dãy Lớp Học Sau";
    const floorH = 3.6;
    const roomW = 5.2;
    const roomD = 6.2;
    const zPos = -32;

    // Dữ liệu phòng theo hình chuẩn
    // 4 tầng xếp chồng
    const floorsData = [
      // Tầng trệt
      {
        floor: 0, label: "Tầng trệt", rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: 0x0f766e },
          { name: "P.03", isHighlight: true },
          { name: "P.04", isHighlight: true },
          { isStair1: true },
          { name: "THƯ VIỆN", isLibrary: true, w: roomW * 3 + 1, color: 0xe0f2fe, textColor: 0x0284c7 },
          { isStair2: true },
          { name: "P.05", isHighlight: true },
          { name: "P.06", isHighlight: true }
        ]
      },
      // Tầng 1
      {
        floor: 1, label: "Tầng 1", rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: 0x0f766e },
          { name: "P.15" },
          { name: "P.16" },
          { isStair1: true },
          { name: "P.17" },
          { name: "P.18" },
          { name: "P.19" },
          { isStair2: true },
          { name: "P.08", isHighlight: true },
          { name: "P.07", isHighlight: true }
        ]
      },
      // Tầng 2
      {
        floor: 2, label: "Tầng 2", rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: 0x0f766e },
          { name: "P.09", isHighlight: true },
          { name: "P.10", isHighlight: true },
          { isStair1: true },
          { name: "P.11", isHighlight: true },
          { name: "P.12", isHighlight: true },
          { name: "P.20" },
          { isStair2: true },
          { name: "P.13", isHighlight: true },
          { name: "P.14", isHighlight: true }
        ]
      },
      // Tầng 3
      {
        floor: 3, label: "Tầng 3", rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: 0x0f766e },
          { name: "-" },
          { name: "-" },
          { isStair1: true },
          { name: "-" },
          { name: "P.18", isHighlight: true },
          { name: "P.17", isHighlight: true },
          { isStair2: true },
          { name: "P.16", isHighlight: true },
          { name: "P.15", isHighlight: true }
        ]
      }
    ];

    floorsData.forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let startX = -32;

      // Sàn hành lang phía trước phòng
      const slabGeo = new THREE.BoxGeometry(68, 0.4, roomD + 3);
      const slabMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, fl.floor * floorH, zPos + 1.5);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang
      const railGeo = new THREE.BoxGeometry(68, 0.9, 0.15);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, fl.floor * floorH + 0.5, zPos + roomD / 2 + 3);
      building.add(rail);

      fl.rooms.forEach(r => {
        if (r.isStair1) {
          startX += 6;
          return;
        }
        if (r.isStair2) {
          startX += 6;
          return;
        }

        const rw = r.w || roomW;
        const roomBox = this.createRoomBlock(r.name, startX + rw / 2, y, zPos, rw, floorH * 0.9, roomD, {
          isHighlight: r.isHighlight,
          color: r.color,
          textColor: r.textColor,
          floorKey: `fl_${fl.floor}`
        });
        building.add(roomBox);
        startX += rw + 0.4;
      });
    });

    // 2 Tháp Cầu thang Dãy Sau
    const stair1 = this.createStairTower(-14, zPos, 4, floorH, 5.5, roomD + 2.5, "CẦU THANG 1");
    const stair2 = this.createStairTower(14, zPos, 4, floorH, 5.5, roomD + 2.5, "CẦU THANG 2");
    building.add(stair1);
    building.add(stair2);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 2. DÃY LỚP HỌC TRƯỚC (Phía Tây - 4 Tầng: Trệt, 1, 2, 3)
  buildFrontClassBuilding() {
    const building = new THREE.Group();
    building.name = "Dãy Lớp Học Trước";
    const floorH = 3.6;
    const xPos = -26;
    const roomW = 6.2;
    const roomD = 5.2;

    // Các tầng Dãy Lớp Trước
    // Cầu thang nằm giữa, cụm Nam (hướng sang Dãy Hội Đồng) chứa P.01 vàng và P.05!
    const floors = [
      { floor: 0, label: "Tầng trệt", north: [{ name: "WC" }, { name: "P.01" }, { name: "P.02" }], south: [{ name: "P.01", isHighlight: true, isP01Yellow: true }, { name: "P.03" }] },
      { floor: 1, label: "Tầng 1", north: [{ name: "WC" }, { name: "P.07" }, { name: "P.06" }], south: [{ name: "P.05", isP05Bridge: true }, { name: "P.04" }] },
      { floor: 2, label: "Tầng 2", north: [{ name: "WC" }, { name: "P.08" }, { name: "P.02", isHighlight: true }], south: [{ name: "P.09" }, { name: "P.10" }] },
      { floor: 3, label: "Tầng 3", north: [{ name: "WC" }, { name: "P.14" }, { name: "P.13" }], south: [{ name: "P.12" }, { name: "P.11" }] }
    ];

    floors.forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;

      // Sàn mỗi tầng
      const slabGeo = new THREE.BoxGeometry(roomW + 3, 0.4, 38);
      const slabMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(xPos + 1.5, fl.floor * floorH, -6);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang Đông (hướng ra sân trường)
      const railGeo = new THREE.BoxGeometry(0.15, 0.9, 38);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(xPos + roomW / 2 + 3, fl.floor * floorH + 0.5, -6);
      building.add(rail);

      // Cụm phía Bắc (gần Dãy Sau)
      let zN = -21;
      fl.north.forEach(r => {
        const isWc = r.name === 'WC';
        const box = this.createRoomBlock(r.name, xPos, y, zN, roomW, floorH * 0.9, isWc ? 3.5 : roomD, {
          isHighlight: r.isHighlight,
          color: isWc ? 0xccfbf1 : (r.isHighlight ? 0xfef08a : 0xffffff),
          textColor: isWc ? 0x0f766e : '#0f172a',
          floorKey: `fl_${fl.floor}`
        });
        building.add(box);
        zN += (isWc ? 3.5 : roomD) + 0.4;
      });

      // Cụm phía Nam (hướng sang Dãy Hội Đồng - NƠI NỐI HÀNH LANG!)
      let zS = 2;
      fl.south.forEach(r => {
        const box = this.createRoomBlock(r.name, xPos, y, zS, roomW, floorH * 0.9, roomD, {
          isHighlight: r.isHighlight,
          color: r.isP01Yellow ? 0xfde047 : (r.isHighlight ? 0xfef08a : (r.isP05Bridge ? 0xfef9c3 : 0xffffff)),
          textColor: r.isP01Yellow ? 0x854d0e : (r.isP05Bridge ? 0x1e3a8a : '#0f172a'),
          floorKey: `fl_${fl.floor}`
        });

        // Đánh dấu trực quan P.01 vàng và P.05 để người dùng nhận diện ngay điểm nối
        if (r.isP01Yellow) {
          const pin = this.createConnectionMarker(xPos + roomW / 2 + 1.2, y + 1.2, zS, "VỊ TRÍ P.01 (VÀNG) - NỐI HÀNH LANG TRỆT", "#ca8a04");
          building.add(pin);
        }
        if (r.isP05Bridge) {
          const pin = this.createConnectionMarker(xPos + roomW / 2 + 1.2, y + 1.2, zS, "VỊ TRÍ P.05 - NỐI CẦU HÀNH LANG LẦU 1", "#2563eb");
          building.add(pin);
        }

        building.add(box);
        zS += roomD + 0.4;
      });
    });

    // Cầu thang giữa Dãy Lớp Trước
    const stairMid = this.createStairTower(xPos, -8.5, 4, floorH, roomW + 2, 5.5, "CẦU THANG GIỮA");
    building.add(stairMid);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 3. DÃY PHÒNG HỘI ĐỒNG & HÀNH CHÍNH (Phía Tây Nam - 2 Tầng: Trệt, Lầu 1)
  buildAdminBuilding() {
    const building = new THREE.Group();
    building.name = "Dãy Hành Chính & Phòng Hội Đồng";
    const floorH = 3.6;
    const xPos = -26;
    const zPos = 24; // Nằm phía Nam, đối diện cụm P.01 & P.05 của Dãy Trước
    const roomW = 6.2;
    const roomD = 5.2;

    // Tầng trệt: Văn phòng Hành chính (Đối diện P.01 vàng qua hành lang trệt)
    const gY = floorH / 2;
    const gSlab = new THREE.Mesh(new THREE.BoxGeometry(roomW + 3, 0.4, 26), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    gSlab.position.set(xPos + 1.5, 0, zPos);
    building.add(gSlab);

    const adminOffice1 = this.createRoomBlock("HÀNH CHÍNH", xPos, gY, zPos - 6, roomW, floorH * 0.9, roomD * 1.5, {
      color: 0xf1f5f9,
      textColor: 0x334155,
      subtext: "Văn thư - Kế toán",
      floorKey: 'fl_0'
    });
    const adminOffice2 = this.createRoomBlock("TIẾP DÂN", xPos, gY, zPos + 5, roomW, floorH * 0.9, roomD * 1.5, {
      color: 0xf1f5f9,
      textColor: 0x334155,
      subtext: "Sảnh đón tiếp",
      floorKey: 'fl_0'
    });
    building.add(adminOffice1);
    building.add(adminOffice2);

    // Tầng 1: PHÒNG HỘI ĐỒNG (Đối diện P.05 qua cầu hành lang lầu 1)
    const t1Y = floorH + floorH / 2;
    const t1Slab = new THREE.Mesh(new THREE.BoxGeometry(roomW + 3, 0.4, 26), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    t1Slab.position.set(xPos + 1.5, floorH, zPos);
    building.add(t1Slab);

    // Phòng Hội Đồng lớn sang trọng (vàng gỗ ấm)
    const hoiDongBox = this.createRoomBlock("PHÒNG HỘI ĐỒNG", xPos, t1Y, zPos - 3, roomW, floorH * 0.95, roomD * 2.2, {
      color: 0xfef3c7,
      textColor: 0xb45309,
      stroke: 0xd97706,
      subtext: "Hội họp & Sự kiện",
      floorKey: 'fl_1'
    });
    building.add(hoiDongBox);

    // Cầu thang Dãy Hội Đồng
    const adminStair = this.createStairTower(xPos, zPos + 7.5, 2, floorH, roomW + 1.5, 5, "CẦU THANG");
    building.add(adminStair);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 4. DÃY NHÀ THIẾT BỊ, KHỐI CHỨC NĂNG & HỘI TRƯỜNG (Phía Đông)
  buildEastBuilding() {
    const building = new THREE.Group();
    building.name = "Dãy Nhà Thiết Bị & Khối Chức Năng";
    const floorH = 3.6;
    const xPos = 28;
    const zPos = 2;
    const bW = 10;
    const bD = 24;

    // Tầng trệt: Phòng Y Tế & Phòng Thí Nghiệm
    const gY = floorH / 2;
    const yteBox = this.createRoomBlock("+ Y TẾ", xPos - 2.5, gY, zPos - 6, bW * 0.45, floorH * 0.9, bD * 0.4, {
      color: 0xfee2e2,
      textColor: 0xb91c1c,
      stroke: 0xef4444,
      subtext: "Tầng trệt",
      floorKey: 'fl_0'
    });
    const labBox = this.createRoomBlock("PHÒNG THÍ NGHIỆM", xPos + 2.5, gY, zPos - 6, bW * 0.45, floorH * 0.9, bD * 0.4, {
      color: 0xfef3c7,
      textColor: 0xb45309,
      stroke: 0xd97706,
      subtext: "Lý - Hóa - Sinh",
      floorKey: 'fl_0'
    });
    building.add(yteBox);
    building.add(labBox);

    // Tầng 1: VP Đoàn & 2 Phòng Tin Học
    const t1Y = floorH + floorH / 2;
    const vpDoan = this.createRoomBlock("VP ĐOÀN", xPos - 2.8, t1Y, zPos - 6, bW * 0.35, floorH * 0.9, bD * 0.4, {
      color: 0xe0f2fe,
      textColor: 0x0369a1,
      subtext: "Thanh niên",
      floorKey: 'fl_1'
    });
    const tinHoc1 = this.createRoomBlock("TIN HỌC 1", xPos + 0.8, t1Y, zPos - 6, bW * 0.32, floorH * 0.9, bD * 0.4, {
      color: 0xede9fe,
      textColor: 0x6d28d9,
      stroke: 0x7c3aed,
      subtext: "Máy tính 1",
      floorKey: 'fl_1'
    });
    const tinHoc2 = this.createRoomBlock("TIN HỌC 2", xPos + 4.2, t1Y, zPos - 6, bW * 0.32, floorH * 0.9, bD * 0.4, {
      color: 0xede9fe,
      textColor: 0x6d28d9,
      stroke: 0x7c3aed,
      subtext: "Máy tính 2",
      floorKey: 'fl_1'
    });
    building.add(vpDoan);
    building.add(tinHoc1);
    building.add(tinHoc2);

    // Tầng 2: Dãy Nhà Thiết Bị (Mái gạch chéo đặc trưng)
    const t2Y = floorH * 2 + floorH / 2;
    const thietBiBox = this.createRoomBlock("DÃY NHÀ THIẾT BỊ", xPos, t2Y, zPos - 6, bW - 1, floorH * 0.9, bD * 0.4, {
      color: 0xf8fafc,
      textColor: 0x0284c7,
      stroke: 0x0284c7,
      subtext: "Tầng 2 - Dụng cụ dạy học",
      floorKey: 'fl_2'
    });
    building.add(thietBiBox);

    // Cầu thang Dãy Thiết Bị ở cạnh Tây
    const eastStair = this.createStairTower(xPos - bW / 2 - 2.5, zPos - 6, 3, floorH, 4.5, bD * 0.4, "CẦU THANG");
    building.add(eastStair);

    // =========================================================================
    // CỤM HỘI TRƯỜNG & CHỖ ĐỂ XE 10A13 KẸP GIỮA 2 BỒN CÂY XANH
    // =========================================================================
    const hallW = bW + 2;

    // 1. Bồn cây xanh phía trên kẹp chỗ để xe 10A13
    const bonCayTop = this.createRoomBlock("🌿 BỒN CÂY", xPos, 0.4, zPos + 1.2, hallW * 0.8, 0.8, 2.2, {
      color: 0xdcfce7,
      textColor: 0x15803d,
      stroke: 0x16a34a,
      subtext: "Cây xanh cảnh quan",
      floorKey: 'fl_0'
    });
    building.add(bonCayTop);

    // 2. Chỗ để xe lớp 10A13 kẹp ở giữa
    const park10A13 = this.createRoomBlock("10A13", xPos, 0.15, zPos + 4.2, hallW * 0.8, 0.3, 3.2, {
      color: 0xffffff,
      textColor: 0x0284c7,
      stroke: 0x64748b,
      subtext: "Chỗ để xe lớp 10A13",
      floorKey: 'fl_0'
    });
    building.add(park10A13);

    // 3. Bồn cây xanh phía dưới kẹp chỗ để xe 10A13
    const bonCayBot = this.createRoomBlock("🌿 BỒN CÂY", xPos - 1.2, 0.4, zPos + 7.2, hallW * 0.6, 0.8, 2.2, {
      color: 0xdcfce7,
      textColor: 0x15803d,
      stroke: 0x16a34a,
      subtext: "Cây xanh cảnh quan",
      floorKey: 'fl_0'
    });
    building.add(bonCayBot);

    // Ô WC cạnh bồn cây dưới
    const wcHoiTruong = this.createRoomBlock("WC", xPos + hallW * 0.3, floorH * 0.4, zPos + 7.2, hallW * 0.2, floorH * 0.8, 2.2, {
      color: 0xccfbf1,
      textColor: 0x0f766e,
      stroke: 0x0d9488,
      subtext: "Vệ sinh",
      floorKey: 'fl_0'
    });
    building.add(wcHoiTruong);

    // 4. HỘI TRƯỜNG LỚN (Phía Nam Khối Chức Năng - Tầng trệt, trần cao thông thoáng)
    const hallH = floorH * 1.5;
    const hallD = 12;
    const hallY = hallH / 2;
    const hallBox = this.createRoomBlock("HỘI TRƯỜNG LỚN", xPos, hallY, zPos + 15, hallW, hallH, hallD, {
      color: 0xfef08a,
      textColor: 0x854d0e,
      stroke: 0xca8a04,
      subtext: "Đại hội & Văn nghệ trường",
      floorKey: 'fl_0'
    });
    building.add(hallBox);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 5. CÁC HÀNH LANG NỐI 2 DÃY PHÍA TÂY (THEO YÊU CẦU TRỌNG TÂM CỦA NGƯỜI DÙNG)
  // Tầng trệt: Nối qua hành lang ngay đối diện P.01 (màu vàng)
  // Lầu tầng 1: Nối qua cầu hành lang ngay đối diện P.05 (ngay phía trên song song)
  buildWestConnectingBridges() {
    const xBridge = -26; // Căn thẳng hàng với trục phòng P.01 & P.05
    const zStart = 8;    // Cạnh phòng P.01 / P.05 của Dãy Lớp Trước
    const zEnd = 18;     // Cạnh phòng Dãy Hội Đồng
    const bridgeLength = zEnd - zStart;
    const bridgeWidth = 4.2;
    const bridgeCenterZ = (zStart + zEnd) / 2;
    const floorH = 3.6;

    const westBridgeGroup = new THREE.Group();
    westBridgeGroup.name = "Hệ Thống Hành Lang Nối 2 Dãy Tây";

    // -------------------------------------------------------------
    // A. HÀNH LANG TẦNG TRỆT (ĐỐI DIỆN P.01 MÀU VÀNG)
    // -------------------------------------------------------------
    const groundWalkway = new THREE.Group();
    groundWalkway.name = "Hành Lang Tầng Trệt (Đối diện P.01)";

    // Mặt sàn lát gạch hành lang trệt
    const floorGeo = new THREE.BoxGeometry(bridgeWidth, 0.25, bridgeLength);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    const gFloor = new THREE.Mesh(floorGeo, floorMat);
    gFloor.position.set(xBridge, 0.12, bridgeCenterZ);
    gFloor.receiveShadow = true;
    groundWalkway.add(gFloor);

    // Mái che canopy chống mưa nắng ở tầng trệt
    const canopyGeo = new THREE.BoxGeometry(bridgeWidth + 0.6, 0.2, bridgeLength);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, transparent: true, opacity: 0.85 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(xBridge, 2.6, bridgeCenterZ);
    groundWalkway.add(canopy);

    // Cột trụ chống hai bên hành lang trệt
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3 });
    [-bridgeWidth / 2 + 0.2, bridgeWidth / 2 - 0.2].forEach(px => {
      [zStart + 1.5, bridgeCenterZ, zEnd - 1.5].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 16), pillarMat);
        pillar.position.set(xBridge + px, 1.3, pz);
        pillar.castShadow = true;
        groundWalkway.add(pillar);
      });
    });

    // Biển định danh 3D cho hành lang trệt
    const gLabelMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("HÀNH LANG TẦNG TRỆT", "Đối diện P.01 (vàng) ➔ Hành chính", "#ffffff", "#0284c7", "#38bdf8", 320, 120),
      transparent: true
    });
    const gLabel = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.8), gLabelMat);
    gLabel.position.set(xBridge, 1.5, bridgeCenterZ);
    gLabel.rotation.y = -Math.PI / 2; // Nhìn từ hướng sân trường sang
    groundWalkway.add(gLabel);

    westBridgeGroup.add(groundWalkway);

    // -------------------------------------------------------------
    // B. CẦU HÀNH LANG LẦU 1 (ĐỐI DIỆN P.05 - SONG SONG PHÍA TRÊN)
    // -------------------------------------------------------------
    const skybridge = new THREE.Group();
    skybridge.name = "Cầu Hành Lang Lầu 1 (Đối diện P.05)";
    const bridgeY = floorH; // Cao độ sàn Tầng 1

    // Dầm thép chịu lực A-frame đỡ cầu
    const girderMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, metalness: 0.5, roughness: 0.4 });
    const girderL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, bridgeLength), girderMat);
    girderL.position.set(xBridge - bridgeWidth / 2 + 0.2, bridgeY - 0.3, bridgeCenterZ);
    const girderR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, bridgeLength), girderMat);
    girderR.position.set(xBridge + bridgeWidth / 2 - 0.2, bridgeY - 0.3, bridgeCenterZ);
    skybridge.add(girderL);
    skybridge.add(girderR);

    // Mặt sàn bê tông cầu hành lang lầu 1
    const bridgeFloorGeo = new THREE.BoxGeometry(bridgeWidth, 0.3, bridgeLength);
    const bridgeFloorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const bFloor = new THREE.Mesh(bridgeFloorGeo, bridgeFloorMat);
    bFloor.position.set(xBridge, bridgeY, bridgeCenterZ);
    bFloor.castShadow = true;
    bFloor.receiveShadow = true;
    skybridge.add(bFloor);

    // Lan can kính hiện đại 2 bên cầu (Glass Balustrade)
    const glassRailGeo = new THREE.BoxGeometry(0.08, 1.2, bridgeLength);
    const glassRailMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.6
    });
    const glassL = new THREE.Mesh(glassRailGeo, glassRailMat);
    glassL.position.set(xBridge - bridgeWidth / 2 + 0.1, bridgeY + 0.65, bridgeCenterZ);
    const glassR = new THREE.Mesh(glassRailGeo, glassRailMat);
    glassR.position.set(xBridge + bridgeWidth / 2 - 0.1, bridgeY + 0.65, bridgeCenterZ);
    skybridge.add(glassL);
    skybridge.add(glassR);

    // Tay vịn inox trên lan can
    const handrailMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const handL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, bridgeLength, 12), handrailMat);
    handL.rotation.x = Math.PI / 2;
    handL.position.set(xBridge - bridgeWidth / 2 + 0.1, bridgeY + 1.25, bridgeCenterZ);
    const handR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, bridgeLength, 12), handrailMat);
    handR.rotation.x = Math.PI / 2;
    handR.position.set(xBridge + bridgeWidth / 2 - 0.1, bridgeY + 1.25, bridgeCenterZ);
    skybridge.add(handL);
    skybridge.add(handR);

    // Mái che vòm kính cầu trên cao
    const bridgeRoofGeo = new THREE.BoxGeometry(bridgeWidth + 0.4, 0.25, bridgeLength);
    const bridgeRoofMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });
    const bridgeRoof = new THREE.Mesh(bridgeRoofGeo, bridgeRoofMat);
    bridgeRoof.position.set(xBridge, bridgeY + 2.8, bridgeCenterZ);
    skybridge.add(bridgeRoof);

    // Cột trụ đỡ cầu vươn từ mặt đất lên
    const colMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.4 });
    [-bridgeWidth / 2 + 0.2, bridgeWidth / 2 - 0.2].forEach(cx => {
      [bridgeCenterZ - 2.5, bridgeCenterZ + 2.5].forEach(cz => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, bridgeY + 2.8, 16), colMat);
        col.position.set(xBridge + cx, (bridgeY + 2.8) / 2, cz);
        col.castShadow = true;
        skybridge.add(col);
      });
    });

    // Biển định danh 3D nổi bật cho CẦU HÀNH LANG LẦU 1
    const skyLabelMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("🪜 CẦU HÀNH LANG LẦU 1", "Đối diện P.05 ➔ Phòng Hội Đồng", "#1e40af", "#ffffff", "#60a5fa", 360, 130),
      transparent: true
    });
    const skyLabel = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), skyLabelMat);
    skyLabel.position.set(xBridge, bridgeY + 1.4, bridgeCenterZ);
    skyLabel.rotation.y = -Math.PI / 2; // Hướng ra sân trường
    skybridge.add(skyLabel);

    westBridgeGroup.add(skybridge);

    // Thêm các hành lang nối liên khối khác:
    // C. Hành lang Tây Bắc nối Dãy Sau & Dãy Trước
    const nwCorridor = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
    );
    nwCorridor.position.set(-20, 0.1, -26);
    nwCorridor.receiveShadow = true;
    westBridgeGroup.add(nwCorridor);

    // D. Hành lang Đông Bắc nối Dãy Sau & Dãy Thiết Bị
    const neCorridor = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
    );
    neCorridor.position.set(20, 0.1, -26);
    neCorridor.receiveShadow = true;
    westBridgeGroup.add(neCorridor);

    this.scene.add(westBridgeGroup);
    this.corridorObjects.push(westBridgeGroup);
  }

  // 6. MÁI CHE KÍNH TAM GIÁC TRUNG TÂM & CỘT CỜ SÂN TRƯỜNG
  buildCentralCanopyAndFlag() {
    const landmarkGroup = new THREE.Group();
    landmarkGroup.name = "Mái Che Tam Giác & Cột Cờ";

    // -------------------------------------------------------------
    // A. MÁI CHE KÍNH HÌNH TAM GIÁC (LỐI VÀO SẢNH HÀNH LANG TRUNG TÂM)
    // Nằm ở giữa khoảng sân nối 2 dãy nhà (Z ≈ -2)
    // -------------------------------------------------------------
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(0, 0, -2);

    // Khối kính kim tự tháp tam giác (Tetrahedron / Cone)
    const glassPyramidGeo = new THREE.ConeGeometry(8, 9, 4); // 4 mặt
    const glassPyramidMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.15,
      transmission: 0.7,
      thickness: 1.5
    });
    const glassPyramid = new THREE.Mesh(glassPyramidGeo, glassPyramidMat);
    glassPyramid.rotation.y = Math.PI / 4;
    glassPyramid.position.y = 4.5;
    glassPyramid.castShadow = true;
    canopyGroup.add(glassPyramid);

    // Khung dầm thép chéo màu xanh chữ A
    const beamGeo = new THREE.EdgesGeometry(glassPyramidGeo);
    const beamMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 3 });
    const beamFrame = new THREE.LineSegments(beamGeo, beamMat);
    beamFrame.rotation.y = Math.PI / 4;
    beamFrame.position.y = 4.5;
    canopyGroup.add(beamFrame);

    // Chân dầm A-frame vươn 2 bên
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.4 });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 10), legMat);
    legL.position.set(-6, 0.2, 0);
    legL.rotation.z = 0.35;
    const legR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 10), legMat);
    legR.position.set(6, 0.2, 0);
    legR.rotation.z = -0.35;
    canopyGroup.add(legL);
    canopyGroup.add(legR);

    // Vòm lối vào thông tầng
    const archGeo = new THREE.TorusGeometry(2.2, 0.3, 16, 32, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, 0, 4.5);
    canopyGroup.add(arch);

    // Biển MÁI TAM GIÁC
    const canopyLblMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("MÁI CHE TAM GIÁC", "Sảnh hành lang trung tâm", "#ffffff", "#0284c7", "#38bdf8", 320, 120),
      transparent: true
    });
    const canopyLbl = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), canopyLblMat);
    canopyLbl.position.set(0, 1.8, 5.5);
    canopyGroup.add(canopyLbl);

    landmarkGroup.add(canopyGroup);

    // -------------------------------------------------------------
    // B. CỘT CỜ TRUNG TÂM SÂN TRƯỜNG (Z ≈ 14, TÁCH BIỆT PHÍA TRƯỚC)
    // -------------------------------------------------------------
    const flagGroup = new THREE.Group();
    flagGroup.position.set(0, 0, 14);

    // Bục tròn tam cấp
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    base1.position.y = 0.2;
    base1.receiveShadow = true;
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0xcbd5e1 }));
    base2.position.y = 0.6;
    base2.receiveShadow = true;
    const base3 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    base3.position.y = 1.0;
    base3.receiveShadow = true;
    flagGroup.add(base1);
    flagGroup.add(base2);
    flagGroup.add(base3);

    // Thân cột cờ inox vươn cao
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 16, 16);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.85, roughness: 0.2 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 9;
    pole.castShadow = true;
    flagGroup.add(pole);

    // Đỉnh chóp vàng
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 }));
    tip.position.y = 17;
    flagGroup.add(tip);

    // Lá cờ đỏ sao vàng tung bay
    const flagGeo = new THREE.PlaneGeometry(3.6, 2.4, 16, 16);
    // Làm gợn sóng lá cờ
    const pos = flagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      pos.setZ(i, Math.sin(u * 1.8) * 0.25);
    }
    flagGeo.computeVertexNormals();

    const flagTexture = this.createFlagTexture();
    const flagMat = new THREE.MeshStandardMaterial({
      map: flagTexture,
      side: THREE.DoubleSide,
      roughness: 0.5
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(1.8, 15.6, 0);
    flag.castShadow = true;
    flagGroup.add(flag);

    // Biển CỘT CỜ
    const flagLblMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("CỘT CỜ", "Sân trường trung tâm", "#ffffff", "#0f172a", "#64748b", 256, 110),
      transparent: true
    });
    const flagLbl = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.7), flagLblMat);
    flagLbl.position.set(0, 1.2, 4.2);
    flagGroup.add(flagLbl);

    landmarkGroup.add(flagGroup);

    this.scene.add(landmarkGroup);
    this.corridorObjects.push(landmarkGroup);
  }

  createFlagTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // Nền đỏ
    ctx.fillStyle = '#da251d';
    ctx.fillRect(0, 0, 300, 200);

    // Sao vàng năm cánh
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    const cx = 150, cy = 100, spikes = 5, outerR = 40, innerR = 16;
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerR;
      let y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  // 7. NGOẠI CẢNH & KHU VỰC XE & SÂN BÓNG
  buildCampusEnvironment() {
    const envGroup = new THREE.Group();

    // Cổng trường (Phía Nam)
    const gateGeo = new THREE.BoxGeometry(18, 4.5, 2.5);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(-6, 2.25, 52);
    gate.castShadow = true;
    envGroup.add(gate);

    const gateLblMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("CỔNG TRƯỜNG CHÍNH", "Ra vào khuôn viên", "#ffffff", "#dc2626", "#dc2626", 360, 120),
      transparent: true
    });
    const gateLbl = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), gateLblMat);
    gateLbl.position.set(-6, 3, 53.3);
    envGroup.add(gateLbl);

    // Nhà xe giáo viên (Góc Tây Nam)
    const gvParking = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 8), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    gvParking.position.set(-36, 1.5, 42);
    gvParking.castShadow = true;
    envGroup.add(gvParking);
    const gvLbl = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("NHÀ XE GIÁO VIÊN", "", "#ffffff", "#0f172a", "#94a3b8"),
      transparent: true
    }));
    gvLbl.position.set(-36, 1.8, 46.1);
    envGroup.add(gvLbl);

    // Dãy để xe học sinh (Dọc phía Tây)
    const westBike = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 50), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    westBike.position.set(-42, 1.25, -4);
    westBike.castShadow = true;
    envGroup.add(westBike);

    // Sân bóng đá (Phía Đông)
    const soccerGeo = new THREE.PlaneGeometry(36, 24);
    const soccerMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.9 });
    const soccer = new THREE.Mesh(soccerGeo, soccerMat);
    soccer.rotation.x = -Math.PI / 2;
    soccer.position.set(52, 0.05, 5);
    soccer.receiveShadow = true;
    envGroup.add(soccer);

    // Đường viền sân bóng
    const pitchLine = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(34, 22)),
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    );
    pitchLine.rotation.x = -Math.PI / 2;
    pitchLine.position.set(52, 0.06, 5);
    envGroup.add(pitchLine);

    this.scene.add(envGroup);
  }

  // Tạo chốt ghim đánh dấu vị trí nổi bật
  createConnectionMarker(x, y, z, title, colorHex = "#2563eb") {
    const marker = new THREE.Group();
    marker.position.set(x, y, z);

    // Quả cầu ghim sáng
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 16),
      new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.5 })
    );
    marker.add(sphere);

    // Cây kim cắm xuống
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.02, 1.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    pin.position.y = -0.8;
    marker.add(pin);

    // Vòng sóng tỏa ra
    const ringGeo = new THREE.RingGeometry(0.4, 0.8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.55;
    marker.add(ring);

    return marker;
  }

  // Đổi bộ lọc tầng
  filterFloor(floorKey) {
    this.currentFloorFilter = floorKey;
    const isAll = floorKey === 'all';

    this.interactiveRooms.forEach(room => {
      if (isAll) {
        room.visible = true;
      } else {
        const match = room.userData.floorKey === floorKey;
        room.visible = match;
      }
    });

    if (this.controls) {
      this.controls.update();
    }
  }

  // Đổi góc nhìn camera theo thiết lập sẵn
  setCameraPreset(presetName) {
    const duration = 1000;
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    let endPos = new THREE.Vector3();
    let endTarget = new THREE.Vector3();

    switch (presetName) {
      case 'bridge_west': // TÂM ĐIỂM: CẦU HÀNH LANG TÂY (P.01 & P.05)
        endPos.set(-42, 18, 14);
        endTarget.set(-26, 3.5, 13);
        break;
      case 'isometric': // Toàn cảnh Isometric
        endPos.set(-65, 55, 75);
        endTarget.set(0, 5, 5);
        break;
      case 'top_down': // Nhìn từ trên xuống
        endPos.set(0, 110, 5);
        endTarget.set(0, 0, 5);
        break;
      case 'gate_view': // Nhìn từ cổng trường vào
        endPos.set(-6, 12, 78);
        endTarget.set(0, 8, 0);
        break;
      case 'canopy_view': // Nhìn cận cảnh Mái Tam Giác & Cột Cờ
        endPos.set(-18, 12, 18);
        endTarget.set(0, 4, 6);
        break;
      default:
        endPos.set(-65, 55, 75);
        endTarget.set(0, 5, 5);
    }

    // Hiệu ứng tween mượt mà
    const startTime = performance.now();
    const updateCam = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(updateCam);
      }
    };
    requestAnimationFrame(updateCam);
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // Bắt sự kiện click vào phòng để xem thông tin
    this.renderer.domElement.addEventListener('click', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      for (let hit of intersects) {
        let curr = hit.object;
        while (curr && curr.parent && curr.parent !== this.scene) {
          if (curr.userData && curr.userData.name) {
            this.showRoomTooltip(curr.userData, e.clientX, e.clientY);
            return;
          }
          curr = curr.parent;
        }
      }
    });
  }

  showRoomTooltip(userData, clientX, clientY) {
    let tooltip = document.getElementById('campus3d-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'campus3d-tooltip';
      tooltip.style.cssText = `
        position: fixed;
        z-index: 10000;
        background: rgba(15, 23, 42, 0.95);
        color: white;
        padding: 12px 18px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        border: 1px solid #38bdf8;
        transform: translate(-50%, -120%);
        transition: opacity 0.2s;
      `;
      document.body.appendChild(tooltip);
    }

    const floorNames = { fl_0: "Tầng trệt", fl_1: "Tầng 1", fl_2: "Tầng 2", fl_3: "Tầng 3" };
    const floorLabel = floorNames[userData.floorKey] || "Khuôn viên";

    tooltip.innerHTML = `
      <div style="font-weight: bold; font-size: 15px; color: #38bdf8; margin-bottom: 2px;">📍 ${userData.name}</div>
      <div style="color: #cbd5e1;">🏢 Vị trí: <b>${floorLabel}</b></div>
      ${userData.info ? `<div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">ℹ️ ${userData.info}</div>` : ''}
    `;

    tooltip.style.left = `${clientX}px`;
    tooltip.style.top = `${clientY}px`;
    tooltip.style.opacity = '1';

    clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(() => {
      tooltip.style.opacity = '0';
    }, 4000);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.controls) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  // Xuất ảnh PNG 3D sắc nét
  takeSnapshot() {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `so_do_3d_truong_hoc_${Date.now()}.png`;
    a.click();
  }
}

// Xuất toàn cục
window.Campus3DViewer = Campus3DViewer;
