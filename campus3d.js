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
    this.roofObjects = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Hệ thống Chỉ Đường 3D
    this.routeGroup = new THREE.Group();
    this.routeGroup.name = "RouteGroup3D";
    this.beaconPulses = [];
    this.activeCurve = null;
    this.activeRoute = null;
    this.tourActive = false;
    this.tourProgress = 0;
    this.tourStartTime = 0;
    this.tourDuration = 12000;
    this.router = null;

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
    this.scene.add(this.routeGroup);

    // 2. Camera - Mặc định góc nhìn Flycam trực diện từ trên cao chuẩn ảnh flycam thực tế
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 1000);
    this.camera.position.set(0, 48, 70);

    // 3. OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 250;
    this.controls.target.set(0, 7, 3);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xf1f5f9, 0.45);
    hemiLight.position.set(0, 100, 0);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 0.95);
    sunLight.position.set(-50, 95, 65);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    const d = 85;
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

  // =========================================================================
  // CÁC HÀM HELPER KIẾN TRÚC MÁI TÔN XANH, CỘT ĐỎ, CÂY XANH & GHẾ ĐÁ THỰC TẾ
  // =========================================================================
  createHipRoofMesh(w, d, h, oh = 0.8, color = 0x1d4ed8) {
    const geo = new THREE.BufferGeometry();
    const v0 = [-w/2 - oh, 0, -d/2 - oh];
    const v1 = [ w/2 + oh, 0, -d/2 - oh];
    const v2 = [ w/2 + oh, 0,  d/2 + oh];
    const v3 = [-w/2 - oh, 0,  d/2 + oh];

    const positions = [];
    function addTri(a, b, c) {
      positions.push(...a, ...b, ...c);
    }

    if (w >= d) {
      const ridge = Math.max(0.5, (w - d * 0.8) / 2);
      const v4 = [-ridge, h, 0];
      const v5 = [ ridge, h, 0];
      // Front (+Z)
      addTri(v3, v2, v5); addTri(v3, v5, v4);
      // Back (-Z)
      addTri(v1, v0, v4); addTri(v1, v4, v5);
      // Left (-X)
      addTri(v0, v3, v4);
      // Right (+X)
      addTri(v2, v1, v5);
    } else {
      const ridge = Math.max(0.5, (d - w * 0.8) / 2);
      const v4 = [0, h, -ridge];
      const v5 = [0, h,  ridge];
      // Left (-X)
      addTri(v0, v3, v5); addTri(v0, v5, v4);
      // Right (+X)
      addTri(v2, v1, v4); addTri(v2, v4, v5);
      // Back (-Z)
      addTri(v1, v0, v4);
      // Front (+Z)
      addTri(v3, v2, v5);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { isRoof: true };
    this.roofObjects.push(mesh);
    return mesh;
  }

  // Mái vòm cong lớn đặc trưng của Hội Trường (như trong ảnh Flycam thực tế)
  createCurvedDomeRoof(w, d, h, color = 0x1d4ed8) {
    const geo = new THREE.CylinderGeometry(w / 2, w / 2, d, 48, 1, false, 0, Math.PI);
    geo.rotateZ(-Math.PI / 2);
    geo.rotateY(Math.PI / 2);
    geo.scale(1, h / (w / 2), 1);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.35,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { isRoof: true };
    this.roofObjects.push(mesh);
    return mesh;
  }

  // Ô lưới thông gió vuông đặc trưng đầu hồi và lồng cầu thang trường học
  createVentilationTexture(cols = 3, rows = 5, bgColor = '#f8fafc', holeColor = '#334155') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 384);
    const padX = 256 / (cols + 1);
    const padY = 384 / (rows + 1);
    const holeSize = Math.min(padX, padY) * 0.55;
    ctx.fillStyle = holeColor;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        ctx.fillRect(c * padX - holeSize / 2, r * padY - holeSize / 2, holeSize, holeSize);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // Bồn cây vuông lát gạch xung quanh gốc cây
  createSquarePlanter(x, z, size = 2.8) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Viền bồn gạch màu xám trắng
    const rimGeo = new THREE.BoxGeometry(size, 0.4, size);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.7 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.2;
    rim.receiveShadow = true;
    group.add(rim);

    // Đất màu nâu đậm
    const soilGeo = new THREE.BoxGeometry(size - 0.45, 0.42, size - 0.45);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.21;
    group.add(soil);

    return group;
  }

  // Cây bóng mát sân trường có bồn vuông
  createCourtyardTree(x, z, scale = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    // Bồn vuông dưới gốc cây
    const planter = this.createSquarePlanter(0, 0, 2.8 * scale);
    tree.add(planter);

    // Thân cây gỗ
    const trunkGeo = new THREE.CylinderGeometry(0.22 * scale, 0.32 * scale, 3.2 * scale, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = (3.2 * scale) / 2;
    trunk.castShadow = true;
    tree.add(trunk);

    // Tán lá xanh nhiều tầng
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75 });
    const foliageMat3 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });

    const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6 * scale, 1), foliageMat1);
    f1.position.y = 3.6 * scale;
    f1.castShadow = true;
    tree.add(f1);

    const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3 * scale, 1), foliageMat2);
    f2.position.set(0.4 * scale, 4.4 * scale, 0.3 * scale);
    f2.castShadow = true;
    tree.add(f2);

    const f3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1 * scale, 1), foliageMat3);
    f3.position.set(-0.3 * scale, 4.8 * scale, -0.2 * scale);
    f3.castShadow = true;
    tree.add(f3);

    return tree;
  }

  // Ghế đá trường học màu trắng xám
  createWhiteBench(x, y, z, rotY = 0) {
    const bench = new THREE.Group();
    bench.position.set(x, y, z);
    bench.rotation.y = rotY;

    const benchMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    // Mặt ngồi
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.6), benchMat);
    seat.position.y = 0.48;
    seat.castShadow = true;
    bench.add(seat);

    // Tựa lưng
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.1), benchMat);
    back.position.set(0, 0.75, -0.25);
    back.castShadow = true;
    bench.add(back);

    // Chân ghế
    const legGeo = new THREE.BoxGeometry(0.12, 0.46, 0.5);
    const legL = new THREE.Mesh(legGeo, benchMat);
    legL.position.set(-0.8, 0.23, 0);
    const legR = new THREE.Mesh(legGeo, benchMat);
    legR.position.set(0.8, 0.23, 0);
    bench.add(legL);
    bench.add(legR);

    return bench;
  }

  // Băng rôn khẩu hiệu trường học nền đỏ chữ vàng
  createSloganBanner(text, x, y, z, w, h, rotY = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 512, 96);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fef08a';
    ctx.strokeRect(4, 4, 504, 88);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 48);

    const tex = new THREE.CanvasTexture(canvas);
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    banner.position.set(x, y, z);
    banner.rotation.y = rotY;
    return banner;
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
    this.buildBackBuilding();          // 1. Dãy Lớp Sau A (Khối 10, 11 & Thư Viện - NẰM NGANG)
    this.buildLeftWingBuilding();       // 2. Cánh Trái Dãy B (Khối 12 - 4 tầng - NẰM NGANG)
    this.buildCenterBuilding();         // 3. Khối Trung Tâm (4 tầng - NẰM NGANG)
    this.buildRightWingBuilding();      // 4. Cánh Phải Dãy Bộ Môn (4 tầng - NẰM NGANG)
    this.buildFrontLeftAdminBuilding(); // 5. Dãy Hành Chính Hiệu Bộ (2 tầng - NẰM NGANG)
    this.buildAuditoriumBuilding();     // 6. Hội Trường Mái Vòm Xanh (Phía trước bên phải)
    this.buildWestConnectingBridges();  // 7. Hệ Thống Cầu Hành Lang Liên Tòa Nhà
    this.buildCentralCanopyAndFlag();   // 8. Mái Che Tam Giác & Cột Cờ
    this.buildCampusEnvironment();      // 9. Cổng trường, Sân bóng, Nhà xe & Cây xanh
  }

  // Sân trường và mặt đất thực tế
  buildGround() {
    const groundGroup = new THREE.Group();

    // 1. Mặt sân gạch trường học (Paved Courtyard Stone)
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xead5c3, // Gạch lát sân màu be nhạt ấm chuẩn ảnh flycam
      roughness: 0.85,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    groundGroup.add(ground);

    // Kẻ lưới gạch sân trường nhẹ
    const grid = new THREE.GridHelper(150, 75, 0xd4c2b2, 0xd4c2b2);
    grid.position.y = 0.02;
    groundGroup.add(grid);

    // 2. Lối đi xe trải nhựa màu xám đen bên cánh trái (chạy từ cổng vào phía sau)
    const roadGeo = new THREE.PlaneGeometry(10, 100);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(-36, 0.03, 10);
    road.receiveShadow = true;
    groundGroup.add(road);

    // Vạch kẻ đường xe chạy màu trắng
    const roadLineGeo = new THREE.PlaneGeometry(0.3, 90);
    const roadLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const roadLine = new THREE.Mesh(roadLineGeo, roadLineMat);
    roadLine.rotation.x = -Math.PI / 2;
    roadLine.position.set(-36, 0.04, 10);
    groundGroup.add(roadLine);

    // 3. Sân cờ trung tâm (vòng tròn lát đá xung quanh cột cờ)
    const plazaGeo = new THREE.CircleGeometry(8, 48);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.04, 14);
    plaza.receiveShadow = true;
    groundGroup.add(plaza);

    // 4. Các cây bóng mát có bồn cây vuông lát gạch đặt chuẩn theo ảnh Flycam
    const treePositions = [
      { x: -12, z: 2, s: 1.1 },
      { x: -8, z: 16, s: 1.0 },
      { x: -14, z: 28, s: 1.15 },
      { x: -4, z: 36, s: 1.0 },
      { x: 8, z: 8, s: 1.05 },
      { x: 12, z: 22, s: 1.1 },
      { x: 10, z: 34, s: 1.0 },
      { x: -18, z: -8, s: 0.95 },
      { x: -28, z: 12, s: 1.0 },
      { x: -28, z: 32, s: 1.0 }
    ];
    treePositions.forEach(tp => {
      const tree = this.createCourtyardTree(tp.x, tp.z, tp.s);
      groundGroup.add(tree);
    });

    // 5. Các dãy ghế đá trường học màu trắng xếp dọc hành lang & tán cây
    const benchPositions = [
      { x: -16, z: 2, rot: Math.PI / 2 },
      { x: -12, z: 16, rot: 0 },
      { x: -18, z: 28, rot: Math.PI / 2 },
      { x: 12, z: 8, rot: 0 },
      { x: 16, z: 22, rot: -Math.PI / 2 },
      { x: -21.5, z: -14, rot: Math.PI / 2 },
      { x: -21.5, z: -6, rot: Math.PI / 2 },
      { x: -21.5, z: 2, rot: Math.PI / 2 },
      { x: -16, z: -25, rot: 0 },
      { x: 0, z: -25, rot: 0 },
      { x: 16, z: -25, rot: 0 }
    ];
    benchPositions.forEach(bp => {
      const bench = this.createWhiteBench(bp.x, 0, bp.z, bp.rot);
      groundGroup.add(bench);
    });

    this.scene.add(groundGroup);
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
        map: this.createCanvasLabel(`Cầu Thang`, f === 0 ? 'Tầng Trệt' : `Tầng ${f + 1}`, '#e2e8f0', '#1e293b', '#64748b', 256, 128),
        transparent: true
      });
      const lbl = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.7, 1.8), labelMat);
      lbl.position.set(0, baseY + 2.2, depth / 2 + 0.08);
      group.add(lbl);
    }

    return group;
  }

  // 1. DÃY LỚP HỌC A (Phía Bắc - 4 Tầng: Trệt, 2, 3, 4 - Khối 10 & Khối 11)
  buildBackBuilding() {
    const building = new THREE.Group();
    building.name = "Dãy Lớp Học A (Khối 10 & 11)";
    const floorH = 3.6;
    const roomW = 5.2;
    const roomD = 6.2;
    const zPos = -32;

    // 4 tầng xếp chồng chuẩn theo bản đồ 2D:
    // Khối 10: Vàng tươi pastel (#fef08a, stroke #ca8a04)
    // Khối 11: Xanh da trời pastel (#dbeafe, stroke #0284c7)
    const floorsData = [
      // Tầng trệt (fl_0)
      {
        floor: 0, label: "Tầng trệt", rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "10A7", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A8", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { isStair1: true },
          { name: "THƯ VIỆN", isLibrary: true, w: roomW * 3 + 1, color: 0xffffff, stroke: '#0284c7', textColor: '#0284c7' },
          { isStair2: true },
          { name: "11A9", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A10", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 2 (fl_1)
      {
        floor: 1, label: "Tầng 2", rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "10A6", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A5", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { isStair1: true },
          { name: "10A4", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "11A8", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A7", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { isStair2: true },
          { name: "11A6", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A5", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 3 (fl_2)
      {
        floor: 2, label: "Tầng 3", rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "10A1", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A2", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { isStair1: true },
          { name: "10A3", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "11A1", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A2", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { isStair2: true },
          { name: "11A3", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A4", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 4 (fl_3)
      {
        floor: 3, label: "Tầng 4", rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { isStair1: true },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { name: "10A13", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { isStair2: true },
          { name: "10A12", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A11", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      }
    ];

    floorsData.forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let startX = -32;

      // Sàn hành lang phía trước phòng - Màu vàng be nhạt chuẩn 2D
      const slabGeo = new THREE.BoxGeometry(72, 0.4, roomD + 3);
      const slabMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, fl.floor * floorH, zPos + 1.5);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang
      const railGeo = new THREE.BoxGeometry(72, 0.9, 0.15);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3 });
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
          stroke: r.stroke,
          textColor: r.textColor,
          floorKey: `fl_${fl.floor}`
        });
        building.add(roomBox);
        startX += rw + 0.4;
      });
    });

    // 2 Tháp Cầu thang Dãy A
    const stair1 = this.createStairTower(-14, zPos, 4, floorH, 5.5, roomD + 2.5, "CẦU THANG 1");
    const stair2 = this.createStairTower(14, zPos, 4, floorH, 5.5, roomD + 2.5, "CẦU THANG 2");
    building.add(stair1);
    building.add(stair2);

    // Hệ thống cột trụ đỏ gạch mặt tiền Dãy A (chuẩn ảnh thực tế)
    const redColMatA = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    [-32, -26, -20, -14, -8, -2, 4, 10, 16, 22, 28, 34].forEach(cx => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4 * floorH, 0.55), redColMatA);
      col.position.set(cx, (4 * floorH) / 2, zPos + roomD / 2 + 3.1);
      col.castShadow = true;
      building.add(col);
    });

    // Mái dốc tôn xanh lam đặc trưng (Hip Roof)
    const roofA = this.createHipRoofMesh(74, roomD + 4.2, 3.2, 0.8, 0x1d4ed8);
    roofA.position.set(0, 4 * floorH, zPos + 1.5);
    building.add(roofA);

    // Băng rôn khẩu hiệu trên Dãy A
    const bannerA = this.createSloganBanner("TẤT CẢ VÌ HỌC SINH THÂN YÊU", 0, 13.0, zPos + roomD / 2 + 3.3, 16, 1.4, 0);
    building.add(bannerA);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 2. CÁNH TRÁI - DÃY LỚP HỌC B (Khối 12 - 4 Tầng - NẰM NGANG CHUẨN ẢNH FLYCAM)
  buildLeftWingBuilding() {
    const building = new THREE.Group();
    building.name = "Cánh Trái Dãy B (Khối 12 - Nằm Ngang)";
    const floorH = 3.6;
    const zPos = -4; // Nằm ngang song song trục X, quay mặt ra sân trường (+Z)
    const roomD = 6.4;
    const roomW = 5.2;

    // Khối 12: Cam đào pastel (#fed7aa, stroke #ea580c)
    // Khối 10 (10A9, 10A10): Vàng tươi pastel (#fef08a, stroke #ca8a04)
    const floors = [
      // Tầng trệt (fl_0)
      {
        floor: 0,
        label: "Tầng trệt",
        rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "12A7", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A8", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { isStair: true },
          { name: "12A9", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A10", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8', w: 3.5 }
        ]
      },
      // Tầng 2 (fl_1)
      {
        floor: 1,
        label: "Tầng 2",
        rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "12A3", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A4", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { isStair: true },
          { name: "12A5", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A6", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8', w: 3.5 }
        ]
      },
      // Tầng 3 (fl_2)
      {
        floor: 2,
        label: "Tầng 3",
        rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "12A1", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A2", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { isStair: true },
          { name: "10A10", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A9", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8', w: 3.5 }
        ]
      },
      // Tầng 4 (fl_3)
      {
        floor: 3,
        label: "Tầng 4",
        rooms: [
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { isStair: true },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { name: "-", color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8', w: 3.5 }
        ]
      }
    ];

    floors.forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let startX = -38;

      // Sàn hành lang trước mặt phòng (hướng ra sân trường +Z) - Màu vàng be nhạt chuẩn 2D
      const slabGeo = new THREE.BoxGeometry(34, 0.4, roomD + 3);
      const slabMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(-22.5, fl.floor * floorH, zPos + 1.5);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang bảo vệ
      const railGeo = new THREE.BoxGeometry(34, 0.9, 0.15);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3 });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(-22.5, fl.floor * floorH + 0.5, zPos + roomD / 2 + 3);
      building.add(rail);

      fl.rooms.forEach(r => {
        if (r.isStair) {
          startX += 5.5;
          return;
        }

        const rw = r.w || roomW;
        const box = this.createRoomBlock(r.name, startX + rw / 2, y, zPos, rw, floorH * 0.9, roomD, {
          color: r.color,
          stroke: r.stroke,
          textColor: r.textColor,
          floorKey: `fl_${fl.floor}`
        });

        // Điểm đánh dấu liên kết hành lang ở phòng 12A10 (trệt) và 12A6 (lầu 1)
        if (fl.floor === 0 && r.name === '12A10') {
          const pin = this.createConnectionMarker(startX + rw / 2, y + 1.2, zPos + roomD / 2 + 1.8, "12A10 - NỐI HÀNH LANG TẦNG TRỆT", "#ca8a04");
          building.add(pin);
        }
        if (fl.floor === 1 && r.name === '12A6') {
          const pin = this.createConnectionMarker(startX + rw / 2, y + 1.2, zPos + roomD / 2 + 1.8, "12A6 - NỐI CẦU HÀNH LANG TẦNG 2", "#2563eb");
          building.add(pin);
        }

        building.add(box);
        startX += rw + 0.4;
      });
    });

    // Tháp cầu thang Dãy B (đặt tại trục thang giữa)
    const stairB = this.createStairTower(-21, zPos, 4, floorH, 5.2, roomD + 2.5, "CẦU THANG B");
    building.add(stairB);

    // Cột trụ đỏ gạch mặt tiền Cánh Trái (dựng đều dọc hành lang hướng ra sân)
    const redColMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    [-38, -32, -26, -20, -14, -8].forEach(cx => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4 * floorH, 0.55), redColMat);
      col.position.set(cx, (4 * floorH) / 2, zPos + roomD / 2 + 3.1);
      col.castShadow = true;
      building.add(col);
    });

    // Mái dốc tôn xanh lam nằm ngang (Hip Roof)
    const roofB = this.createHipRoofMesh(35, roomD + 4.2, 3.2, 0.8, 0x1d4ed8);
    roofB.position.set(-22.5, 4 * floorH, zPos + 1.5);
    building.add(roofB);

    // Băng rôn khẩu hiệu đỏ chữ vàng chuẩn ảnh drone: "TIÊN HỌC LỄ - HẬU HỌC VĂN"
    const bannerB = this.createSloganBanner("TIÊN HỌC LỄ - HẬU HỌC VĂN", -22.5, 11.2, zPos + roomD / 2 + 3.3, 15, 1.3, 0);
    building.add(bannerB);

    // Đầu hồi bên trái (X = -38.5): Tường có lưới ô vuông thông gió màu trắng/xám
    const ventTexLeft = this.createVentilationTexture(3, 5);
    const ventWallLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(roomD, 4 * floorH * 0.8),
      new THREE.MeshStandardMaterial({ map: ventTexLeft, side: THREE.DoubleSide })
    );
    ventWallLeft.position.set(-39.2, (4 * floorH) / 2, zPos);
    ventWallLeft.rotation.y = -Math.PI / 2;
    building.add(ventWallLeft);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 3. KHỐI TRUNG TÂM (Sảnh Nghi Lễ & Kết Nối - 4 Tầng - NẰM NGANG)
  buildCenterBuilding() {
    const building = new THREE.Group();
    building.name = "Khối Trung Tâm (Nằm Ngang)";
    const floorH = 3.6;
    const zPos = -8; // Thụt nhẹ vào trong so với 2 cánh tạo thế chữ U rộng mở ra sân
    const blockW = 16;
    const blockD = 6.4;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
    const redTrimMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });

    // 4 tầng thân nhà trung tâm
    for (let f = 0; f < 4; f++) {
      const y = f * floorH + floorH / 2;
      const floorBox = new THREE.Mesh(new THREE.BoxGeometry(blockW, floorH * 0.92, blockD), wallMat);
      floorBox.position.set(0, y, zPos);
      floorBox.castShadow = true;
      floorBox.receiveShadow = true;
      building.add(floorBox);

      // Sàn ban công hành lang trước
      const balcony = new THREE.Mesh(new THREE.BoxGeometry(blockW + 0.4, 0.35, 2.8), new THREE.MeshStandardMaterial({ color: 0xfef9c3 }));
      balcony.position.set(0, f * floorH, zPos + blockD / 2 + 1.4);
      building.add(balcony);

      // Cửa sổ / ô kính trung tâm
      const winGeo = new THREE.PlaneGeometry(10, 1.8);
      const winMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.5 });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(0, y + 0.2, zPos + blockD / 2 + 0.05);
      building.add(win);
    }

    // 2 lồng tháp cầu thang trung tâm hai bên có ô thông gió vuông
    [-6.5, 6.5].forEach(tx => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4 * floorH + 0.8, blockD + 1), wallMat);
      tower.position.set(tx, (4 * floorH) / 2, zPos);
      tower.castShadow = true;
      building.add(tower);

      // Lưới ô vuông thông gió mặt trước tháp thang
      const ventTex = this.createVentilationTexture(2, 5);
      const ventMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 4 * floorH * 0.75),
        new THREE.MeshStandardMaterial({ map: ventTex })
      );
      ventMesh.position.set(tx, (4 * floorH) / 2, zPos + blockD / 2 + 0.55);
      building.add(ventMesh);
    });

    // Mái dốc tôn xanh lam khối trung tâm
    const centerRoof = this.createHipRoofMesh(blockW + 2, blockD + 3.8, 3.2, 0.8, 0x1d4ed8);
    centerRoof.position.set(0, 4 * floorH, zPos + 1.2);
    building.add(centerRoof);

    // Dầm đỡ đỏ trên nóc với biển tên trường lớn màu đỏ chữ vàng (chuẩn ảnh thực tế)
    const schoolBanner = this.createSloganBanner("TRƯỜNG TRUNG HỌC PHỔ THÔNG", 0, 4 * floorH + 0.8, zPos + blockD / 2 + 1.8, 14, 1.2, 0);
    building.add(schoolBanner);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 4. CÁNH PHẢI - DÃY BỘ MÔN & CHỨC NĂNG (4 Tầng - NẰM NGANG ĐỐI XỨNG CÁNH TRÁI)
  buildRightWingBuilding() {
    const building = new THREE.Group();
    building.name = "Cánh Phải Dãy Bộ Môn (4 Tầng - Nằm Ngang)";
    const floorH = 3.6;
    const zPos = -4; // Nằm ngang song song trục X, đối xứng cánh trái
    const roomD = 6.4;
    const roomW = 5.2;

    const deptFloors = [
      // Tầng trệt (fl_0)
      {
        floor: 0,
        label: "Tầng trệt",
        rooms: [
          { isStair: true },
          { name: "TN HÓA", w: 5.8, color: 0xfef3c7, stroke: '#d97706', textColor: '#b45309', subtext: "Thí nghiệm Hóa học" },
          { name: "TN LÝ", w: 5.8, color: 0xfef3c7, stroke: '#d97706', textColor: '#b45309', subtext: "Thí nghiệm Vật lý" },
          { name: "P. Y TẾ", w: 5.2, color: 0xfee2e2, stroke: '#ef4444', textColor: '#b91c1c', subtext: "Sơ cấp cứu" },
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "10A13", w: 5.2, color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' }
        ]
      },
      // Tầng 2 (fl_1)
      {
        floor: 1,
        label: "Tầng 2",
        rooms: [
          { isStair: true },
          { name: "TIN HỌC 2", w: 5.8, color: 0xede9fe, stroke: '#7c3aed', textColor: '#6d28d9', subtext: "Phòng máy 2" },
          { name: "TIN HỌC 1", w: 5.8, color: 0xede9fe, stroke: '#7c3aed', textColor: '#6d28d9', subtext: "Phòng máy 1" },
          { name: "VP ĐOÀN", w: 5.2, color: 0xe0f2fe, stroke: '#38bdf8', textColor: '#0369a1', subtext: "Đoàn thanh niên" },
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "-", w: 5.2, color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' }
        ]
      },
      // Tầng 3 (fl_2)
      {
        floor: 2,
        label: "Tầng 3",
        rooms: [
          { isStair: true },
          { name: "P. MÁY 2", w: 5.8, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Thực hành 2" },
          { name: "P. MÁY 1", w: 5.8, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Thực hành 1" },
          { name: "-", w: 5.2, color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "-", w: 5.2, color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' }
        ]
      },
      // Tầng 4 (fl_3)
      {
        floor: 3,
        label: "Tầng 4",
        rooms: [
          { isStair: true },
          { name: "ANH VĂN", w: 5.8, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Ngoại ngữ" },
          { name: "TIN HỌC 4", w: 5.8, color: 0xede9fe, stroke: '#7c3aed', textColor: '#6d28d9', subtext: "Tin học 4" },
          { name: "-", w: 5.2, color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' },
          { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "-", w: 5.2, color: 0xcbd5e1, stroke: '#94a3b8', textColor: '#94a3b8' }
        ]
      }
    ];

    deptFloors.forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let startX = 8;

      // Sàn hành lang trước mặt phòng (hướng ra sân trường +Z)
      const slabGeo = new THREE.BoxGeometry(34, 0.4, roomD + 3);
      const slabMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(22.5, fl.floor * floorH, zPos + 1.5);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang bảo vệ
      const railGeo = new THREE.BoxGeometry(34, 0.9, 0.15);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3 });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(22.5, fl.floor * floorH + 0.5, zPos + roomD / 2 + 3);
      building.add(rail);

      fl.rooms.forEach(r => {
        if (r.isStair) {
          startX += 5.5;
          return;
        }

        const rw = r.w || roomW;
        const box = this.createRoomBlock(r.name, startX + rw / 2, y, zPos, rw, floorH * 0.9, roomD, {
          color: r.color,
          stroke: r.stroke,
          textColor: r.textColor,
          subtext: r.subtext || '',
          floorKey: `fl_${fl.floor}`
        });

        building.add(box);
        startX += rw + 0.4;
      });
    });

    // Tháp cầu thang Dãy Bộ Môn
    const stairDept = this.createStairTower(10.5, zPos, 4, floorH, 5.2, roomD + 2.5, "CẦU THANG BM");
    building.add(stairDept);

    // Cột trụ đỏ gạch mặt tiền Cánh Phải (dựng đều dọc hành lang hướng ra sân)
    const redColMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    [8, 14, 20, 26, 32, 38].forEach(cx => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4 * floorH, 0.55), redColMat);
      col.position.set(cx, (4 * floorH) / 2, zPos + roomD / 2 + 3.1);
      col.castShadow = true;
      building.add(col);
    });

    // Mái dốc tôn xanh lam nằm ngang (Hip Roof)
    const roofDept = this.createHipRoofMesh(35, roomD + 4.2, 3.2, 0.8, 0x1d4ed8);
    roofDept.position.set(22.5, 4 * floorH, zPos + 1.5);
    building.add(roofDept);

    // Băng rôn khẩu hiệu đỏ chữ vàng chuẩn ảnh drone: "TẤT CẢ VÌ HỌC SINH THÂN YÊU"
    const bannerDept = this.createSloganBanner("TẤT CẢ VÌ HỌC SINH THÂN YÊU", 22.5, 11.2, zPos + roomD / 2 + 3.3, 15, 1.3, 0);
    building.add(bannerDept);

    // Đầu hồi bên phải (X = +39.2): Tường có lưới ô vuông thông gió màu trắng/xám
    const ventTexRight = this.createVentilationTexture(3, 5);
    const ventWallRight = new THREE.Mesh(
      new THREE.PlaneGeometry(roomD, 4 * floorH * 0.8),
      new THREE.MeshStandardMaterial({ map: ventTexRight, side: THREE.DoubleSide })
    );
    ventWallRight.position.set(39.2, (4 * floorH) / 2, zPos);
    ventWallRight.rotation.y = Math.PI / 2;
    building.add(ventWallRight);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 5. DÃY HÀNH CHÍNH (HIỆU BỘ - Phía Trước Bên Trái - 2 Tầng - NẰM NGANG)
  buildFrontLeftAdminBuilding() {
    const building = new THREE.Group();
    building.name = "Dãy Hành Chính (Hiệu Bộ - Nằm Ngang)";
    const floorH = 3.6;
    const zPos = 18; // Nằm ngang phía trước bên trái sân trường
    const roomD = 6.4;
    const roomW = 5.2;

    // Tầng trệt (fl_0)
    const tretRooms = [
      { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
      { name: "HỒ SƠ 1", subtext: "Lưu trữ 1", color: 0xf8fafc },
      { name: "HỒ SƠ 2", subtext: "Lưu trữ 2", color: 0xf8fafc },
      { isStair: true },
      { name: "PHÓ HT", subtext: "Phó Hiệu trưởng", color: 0xf8fafc },
      { name: "TRUYỀN THỐNG", subtext: "Phòng truyền thống", color: 0xf8fafc },
      { name: "TIẾP DÂN", subtext: "Phòng Tiếp dân", color: 0xf8fafc }
    ];

    // Tầng 2 (fl_1)
    const t2Rooms = [
      { name: "WC", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
      { name: "HIỆU TRƯỞNG", subtext: "Phòng Hiệu trưởng", color: 0xf8fafc },
      { name: "VĂN THƯ", subtext: "Văn thư - Hành chính", color: 0xf8fafc },
      { isStair: true },
      { name: "KẾ TOÁN", subtext: "Phòng Kế toán", color: 0xf8fafc },
      { name: "CHI BỘ (HỌP GV)", subtext: "Phòng họp GV", color: 0xfef3c7, stroke: '#d97706', textColor: '#b45309', w: 8.5 }
    ];

    // Vẽ 2 tầng nằm ngang
    [
      { floor: 0, rooms: tretRooms },
      { floor: 1, rooms: t2Rooms }
    ].forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let startX = -36;

      // Sàn hành lang trước màu vàng be nhạt
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(28, 0.4, roomD + 2.8),
        new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 })
      );
      slab.position.set(-22, fl.floor * floorH, zPos + 1.4);
      slab.receiveShadow = true;
      building.add(slab);

      fl.rooms.forEach(r => {
        if (r.isStair) {
          startX += 5.2;
          return;
        }
        const rw = r.w || roomW;
        const box = this.createRoomBlock(r.name, startX + rw / 2, y, zPos, rw, floorH * 0.9, roomD, {
          color: r.color || 0xffffff,
          textColor: r.textColor || '#1e293b',
          stroke: r.stroke || '#94a3b8',
          subtext: r.subtext || '',
          floorKey: `fl_${fl.floor}`
        });
        building.add(box);
        startX += rw + 0.4;
      });
    });

    // Cầu thang Dãy Hành Chính
    const adminStair = this.createStairTower(-20.5, zPos, 2, floorH, 5.0, roomD + 2.2, "CẦU THANG HC");
    building.add(adminStair);

    // Cột hiên đỏ gạch mặt tiền Dãy Hành Chính
    const redColAdmin = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    [-36, -30, -24, -18, -12].forEach(cx => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2 * floorH, 0.5), redColAdmin);
      col.position.set(cx, floorH, zPos + roomD / 2 + 2.6);
      col.castShadow = true;
      building.add(col);
    });

    // Mái dốc tôn xanh lam nằm ngang (Hip Roof)
    const roofAdmin = this.createHipRoofMesh(29, roomD + 3.8, 2.6, 0.8, 0x1d4ed8);
    roofAdmin.position.set(-22, 2 * floorH, zPos + 1.4);
    building.add(roofAdmin);

    // Hành lang có mái che xanh chạy dọc từ mép trái ra phía Cổng trường (chuẩn ảnh drone)
    const walkwayGeo = new THREE.BoxGeometry(3.6, 0.25, 22);
    const walkwayMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 });
    const walkway = new THREE.Mesh(walkwayGeo, walkwayMat);
    walkway.position.set(-35.5, 0.12, 31);
    walkway.receiveShadow = true;
    building.add(walkway);

    const walkwayCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.2, 22),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 })
    );
    walkwayCanopy.position.set(-35.5, 2.6, 31);
    building.add(walkwayCanopy);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 6. HỘI TRƯỜNG LỚN (Phía Trước Bên Phải - MÁI VÒM CONG XANH CHUẨN ẢNH FLYCAM)
  buildAuditoriumBuilding() {
    const building = new THREE.Group();
    building.name = "Hội Trường Lớn (Mái Vòm Cong Xanh)";
    const hallX = 28;
    const hallZ = 18;
    const hallW = 19;
    const hallD = 16;
    const hallH = 6.2;

    // 1. Thân Hội Trường hình khối hộp bo tròn màu kem vàng
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(hallW, hallH, hallD), bodyMat);
    body.position.set(hallX, hallH / 2, hallZ);
    body.castShadow = true;
    body.receiveShadow = true;
    building.add(body);

    // 2. MÁI VÒM CONG LỚN MÀU XANH LAM ĐẶC TRƯNG (CURVED DOME ROOF)
    const domeRoof = this.createCurvedDomeRoof(hallW + 2.5, hallD + 2.5, 3.2, 0x1d4ed8);
    domeRoof.position.set(hallX, hallH, hallZ);
    building.add(domeRoof);

    // 3. Hệ thống cột trụ trang trí đỏ nổi bật quanh mặt ngoài Hội Trường (chuẩn ảnh thực tế)
    const redColMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    [-hallW / 2 + 1, hallW / 2 - 1].forEach(px => {
      [-hallD / 2 + 1, 0, hallD / 2 - 1].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, hallH + 0.6, 0.8), redColMat);
        pillar.position.set(hallX + px, (hallH + 0.6) / 2, hallZ + pz);
        pillar.castShadow = true;
        building.add(pillar);
      });
    });

    // 4. Biển chữ HỘI TRƯỜNG và Nhãn 3D tương tác
    const hallRoom = this.createRoomBlock("HỘI TRƯỜNG", hallX, hallH / 2, hallZ, hallW * 0.9, hallH * 0.9, hallD * 0.9, {
      color: 0xfef9c3,
      textColor: 0x0f172a,
      stroke: 0xca8a04,
      subtext: "Đại hội & Sinh hoạt trường",
      floorKey: 'fl_0'
    });
    building.add(hallRoom);

    // 5. Cầu hành lang có mái che xanh nối từ Cánh Phải (Dãy Bộ Môn) xuống Hội trường
    const bridgeToDept = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.25, 14),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 })
    );
    bridgeToDept.position.set(22, 0.12, 6.5);
    bridgeToDept.receiveShadow = true;
    building.add(bridgeToDept);

    const bridgeRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.2, 14),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 })
    );
    bridgeRoof.position.set(22, 2.6, 6.5);
    building.add(bridgeRoof);

    // Bồn cây xanh cảnh quan và chỗ để xe 10A13 gần Hội Trường
    const bonCay = this.createSquarePlanter(hallX - hallW / 2 - 2, hallZ, 2.8);
    building.add(bonCay);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 7. CÁC HÀNH LANG KẾT NỐI TOÀN TRƯỜNG (SÀN VÀNG BE NHẠT #fef9c3)
  buildWestConnectingBridges() {
    const westBridgeGroup = new THREE.Group();
    westBridgeGroup.name = "Hệ Thống Hành Lang Nối Toàn Trường";
    const floorH = 3.6;

    // -------------------------------------------------------------
    // A. CẦU HÀNH LANG TẦNG TRỆT NỐI DÃY B SANG DÃY HÀNH CHÍNH
    // -------------------------------------------------------------
    const groundWalkway = new THREE.Group();
    const gFloor = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.25, 15),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 })
    );
    gFloor.position.set(-20.5, 0.12, 7);
    gFloor.receiveShadow = true;
    groundWalkway.add(gFloor);

    // Mái che canopy chống mưa nắng ở tầng trệt
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.2, 15),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 })
    );
    canopy.position.set(-20.5, 2.6, 7);
    groundWalkway.add(canopy);

    // Cột trụ chống hai bên
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3 });
    [-1.7, 1.7].forEach(px => {
      [1, 7, 13].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 16), pillarMat);
        pillar.position.set(-20.5 + px, 1.3, pz);
        pillar.castShadow = true;
        groundWalkway.add(pillar);
      });
    });

    // Biển định danh 3D cho hành lang trệt
    const gLabelMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("HÀNH LANG TẦNG TRỆT", "12A10 (Dãy B) ➔ Tiếp dân (Hành chính)", "#ffffff", "#0284c7", "#38bdf8", 340, 120),
      transparent: true
    });
    const gLabel = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.8), gLabelMat);
    gLabel.position.set(-20.5, 1.5, 7);
    gLabel.rotation.y = -Math.PI / 2;
    groundWalkway.add(gLabel);

    westBridgeGroup.add(groundWalkway);

    // -------------------------------------------------------------
    // B. CẦU HÀNH LANG TẦNG 2 NỐI DÃY B SANG DÃY HÀNH CHÍNH
    // -------------------------------------------------------------
    const skybridge = new THREE.Group();
    const bridgeY = floorH;

    // Mặt sàn cầu tầng 2
    const bFloor = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.3, 15),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.5 })
    );
    bFloor.position.set(-20.5, bridgeY, 7);
    bFloor.castShadow = true;
    bFloor.receiveShadow = true;
    skybridge.add(bFloor);

    // Lan can kính hiện đại 2 bên cầu
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.6
    });
    const glassL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 15), glassMat);
    glassL.position.set(-20.5 - 1.8, bridgeY + 0.65, 7);
    const glassR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 15), glassMat);
    glassR.position.set(-20.5 + 1.8, bridgeY + 0.65, 7);
    skybridge.add(glassL);
    skybridge.add(glassR);

    // Mái che cầu trên cao
    const bridgeRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.25, 15),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 })
    );
    bridgeRoof.position.set(-20.5, bridgeY + 2.8, 7);
    skybridge.add(bridgeRoof);

    // Biển CẦU HÀNH LANG TẦNG 2
    const skyLabelMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("🪜 CẦU HÀNH LANG TẦNG 2", "12A6 (Dãy B) ➔ Phòng Chi bộ", "#1e40af", "#ffffff", "#60a5fa", 360, 130),
      transparent: true
    });
    const skyLabel = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), skyLabelMat);
    skyLabel.position.set(-20.5, bridgeY + 1.4, 7);
    skyLabel.rotation.y = -Math.PI / 2;
    skybridge.add(skyLabel);

    westBridgeGroup.add(skybridge);

    // -------------------------------------------------------------
    // C. HÀNH LANG NỐI DÃY PHÍA SAU (DÃY A) SANG CÁNH TRÁI VÀ CÁNH PHẢI
    // -------------------------------------------------------------
    // Cầu nối phía Tây (Dãy A ➔ Cánh Trái Dãy B)
    const bridgeWestNorth = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.3, 19),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.7 })
    );
    bridgeWestNorth.position.set(-21, 0.12, -18);
    bridgeWestNorth.receiveShadow = true;
    westBridgeGroup.add(bridgeWestNorth);

    // Cầu nối phía Đông (Dãy A ➔ Cánh Phải Dãy Bộ Môn)
    const bridgeEastNorth = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.3, 19),
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.7 })
    );
    bridgeEastNorth.position.set(21, 0.12, -18);
    bridgeEastNorth.receiveShadow = true;
    westBridgeGroup.add(bridgeEastNorth);

    this.scene.add(westBridgeGroup);
    this.corridorObjects.push(westBridgeGroup);
  }

  // 6. MÁI CHE KÍNH TAM GIÁC TRUNG TÂM & CỘT CỜ SÂN TRƯỜNG (CHUẨN ẢNH THỰC TẾ)
  buildCentralCanopyAndFlag() {
    const landmarkGroup = new THREE.Group();
    landmarkGroup.name = "Mái Che Tam Giác & Cột Cờ";

    // -------------------------------------------------------------
    // A. MÁI CHE KÍNH HÌNH TAM GIÁC (LỐI VÀO SẢNH HÀNH LANG TRUNG TÂM)
    // Nằm ở giữa khoảng sân nối 2 dãy nhà (Z ≈ -2)
    // Đồ họa chuẩn theo ảnh thực tế: Bục tam cấp bán nguyệt, trụ gạch đỏ, mái kính tam giác
    // -------------------------------------------------------------
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(0, 0, -2);

    // 1. Thềm bậc tam cấp bán nguyệt ở chân mái tam giác (chuẩn thực tế)
    const terraceBase1 = new THREE.Mesh(
      new THREE.CylinderGeometry(5.8, 6.4, 0.35, 32, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
    );
    terraceBase1.position.set(0, 0.17, 0);
    terraceBase1.rotation.y = Math.PI;
    canopyGroup.add(terraceBase1);

    const terraceBase2 = new THREE.Mesh(
      new THREE.CylinderGeometry(4.4, 5.0, 0.35, 32, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.8 })
    );
    terraceBase2.position.set(0, 0.52, 0);
    terraceBase2.rotation.y = Math.PI;
    canopyGroup.add(terraceBase2);

    // 2. Các cột trụ gạch đỏ / nâu sẫm đỡ mái tam giác (chuẩn ảnh thực tế)
    const redColMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    [-4.5, 4.5].forEach(cx => {
      [-2.5, 2.5].forEach(cz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 5.0, 0.7), redColMat);
        pillar.position.set(cx, 2.5, cz);
        pillar.castShadow = true;
        canopyGroup.add(pillar);
      });
    });

    // 3. Khối chóp mái tôn xanh tam giác dốc (chuẩn ảnh flycam thực tế)
    const glassPyramidGeo = new THREE.ConeGeometry(8, 8, 4); // 4 mặt tam giác đều
    const glassPyramidMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.35,
      metalness: 0.2
    });
    const glassPyramid = new THREE.Mesh(glassPyramidGeo, glassPyramidMat);
    glassPyramid.rotation.y = Math.PI / 4;
    glassPyramid.position.y = 5.2;
    glassPyramid.castShadow = true;
    canopyGroup.add(glassPyramid);

    // Viền khung chữ A màu xanh thép
    const beamGeo = new THREE.EdgesGeometry(glassPyramidGeo);
    const beamMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 3 });
    const beamFrame = new THREE.LineSegments(beamGeo, beamMat);
    beamFrame.rotation.y = Math.PI / 4;
    beamFrame.position.y = 5.2;
    canopyGroup.add(beamFrame);

    // Hai cánh hành lang mái tôn xanh vươn ra nối liền mạch với các dãy nhà (chuẩn ảnh thực tế)
    const bridgeRoofMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(13, 0.3, 3.6), bridgeRoofMat);
    wingL.position.set(-10, 4.0, 0);
    wingL.castShadow = true;
    canopyGroup.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(13, 0.3, 3.6), bridgeRoofMat);
    wingR.position.set(10, 4.0, 0);
    wingR.castShadow = true;
    canopyGroup.add(wingR);

    // Chân dầm A-frame vươn 2 bên
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.4 });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 9), legMat);
    legL.position.set(-5.5, 0.2, 0);
    legL.rotation.z = 0.35;
    const legR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 9), legMat);
    legR.position.set(5.5, 0.2, 0);
    legR.rotation.z = -0.35;
    canopyGroup.add(legL);
    canopyGroup.add(legR);

    // Biển MÁI TAM GIÁC
    const canopyLblMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("MÁI CHE TRUNG TÂM", "Sảnh hành lang & Lối vào", "#ffffff", "#0284c7", "#38bdf8", 320, 120),
      transparent: true
    });
    const canopyLbl = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), canopyLblMat);
    canopyLbl.position.set(0, 2.2, 5.5);
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

    // Ẩn/hiện mái tôn xanh khi xem bóc tách từng tầng
    if (this.roofObjects) {
      this.roofObjects.forEach(roof => {
        roof.visible = isAll;
      });
    }

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
      case 'drone_view': // Góc Flycam trực diện từ trên cao chuẩn ảnh flycam thực tế
        endPos.set(0, 48, 70);
        endTarget.set(0, 7, 3);
        break;
      case 'bridge_west': // CẦU HÀNH LANG TÂY (12A10 & 12A6)
        endPos.set(-32, 16, 18);
        endTarget.set(-20.5, 3.6, 7);
        break;
      case 'isometric': // Toàn cảnh Isometric
        endPos.set(-50, 45, 65);
        endTarget.set(0, 6, 2);
        break;
      case 'top_down': // Nhìn từ trên xuống toàn khuôn viên
        endPos.set(0, 95, 5);
        endTarget.set(0, 0, 5);
        break;
      case 'gate_view': // Nhìn từ cổng trường vào
        endPos.set(0, 10, 65);
        endTarget.set(0, 8, 10);
        break;
      case 'canopy_view': // Nhìn cận cảnh Mái Tam Giác & Cột Cờ
        endPos.set(0, 10, 22);
        endTarget.set(0, 4, 3);
        break;
      default:
        endPos.set(0, 48, 70);
        endTarget.set(0, 7, 3);
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

    const floorNames = { fl_0: "Tầng Trệt", fl_1: "Tầng 2", fl_2: "Tầng 3", fl_3: "Tầng 4" };
    const floorLabel = floorNames[userData.floorKey] || "Khuôn viên";

    tooltip.innerHTML = `
      <div style="font-weight: bold; font-size: 15px; color: #38bdf8; margin-bottom: 2px;">📍 ${userData.name}</div>
      <div style="color: #cbd5e1;">🏢 Vị trí: <b>${floorLabel}</b></div>
      ${userData.info ? `<div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">ℹ️ ${userData.info}</div>` : ''}
      <div style="display: flex; gap: 8px; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
        <button type="button" onclick="if(window.setNavPoint) window.setNavPoint('${userData.name}', 'start')" style="background: #10b981; color: white; border: none; padding: 4px 9px; border-radius: 5px; font-size: 11px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 4px;">📍 Đi từ đây</button>
        <button type="button" onclick="if(window.setNavPoint) window.setNavPoint('${userData.name}', 'dest')" style="background: #ef4444; color: white; border: none; padding: 4px 9px; border-radius: 5px; font-size: 11px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 4px;">🏁 Đến đây</button>
      </div>
    `;

    tooltip.style.left = `${clientX}px`;
    tooltip.style.top = `${clientY}px`;
    tooltip.style.opacity = '1';
    tooltip.style.pointerEvents = 'auto';

    clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(() => {
      tooltip.style.opacity = '0';
      tooltip.style.pointerEvents = 'none';
    }, 5000);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.controls) {
      this.controls.update();
    }

    // Cập nhật hiệu ứng xung nhịp của các beacon 3D
    if (this.beaconPulses && this.beaconPulses.length > 0) {
      const pScale = 1 + 0.22 * Math.sin(Date.now() * 0.007);
      this.beaconPulses.forEach(b => {
        b.scale.set(pScale, 1, pScale);
      });
    }

    // Cập nhật chế độ tham quan hành trình 3D dọc tuyến đường
    if (this.tourActive && this.activeCurve) {
      this.updateTourStep();
    }

    this.renderer.render(this.scene, this.camera);
  }

  // =========================================================================
  // TÍNH NĂNG CHỈ ĐƯỜNG 3D THÔNG MINH
  // =========================================================================
  findLocation(raw) {
    if (!raw) return null;
    if (typeof raw === 'object' && raw.id) return raw;
    const term = String(raw).trim();
    if (!window.CAMPUS_LOCATIONS) return null;

    // 1. Khớp trực tiếp id
    let found = window.CAMPUS_LOCATIONS.find(l => l.id.toLowerCase() === term.toLowerCase());
    if (found) return found;

    const norm = term.toLowerCase().replace(/^p\.\s*/, '').replace(/^(lớp|phòng)\s*/, '').trim();

    // 2. Khớp tên phòng sạch
    found = window.CAMPUS_LOCATIONS.find(l => {
      const lNorm = l.name.toLowerCase().replace(/^(lớp|phòng)\s*/, '').trim();
      return lNorm === norm || lNorm === term.toLowerCase();
    });
    if (found) return found;

    // 3. Khớp từ khóa keywords
    found = window.CAMPUS_LOCATIONS.find(l => l.keywords && l.keywords.some(k => {
      const kNorm = k.toLowerCase().replace(/^(lớp|phòng)\s*/, '').trim();
      return kNorm === norm || k.toLowerCase() === term.toLowerCase();
    }));
    if (found) return found;

    // 4. Khớp phần cuối của ID (vd: _10a1, _12a7)
    found = window.CAMPUS_LOCATIONS.find(l => l.id.toLowerCase().endsWith('_' + norm));
    return found || null;
  }

  draw3DRoute(startTerm, destTerm) {
    if (!window.CampusRouter) {
      console.warn("CampusRouter chưa được nạp!");
      return null;
    }
    if (!this.router) {
      this.router = new window.CampusRouter(
        window.CAMPUS_GRAPH_NODES,
        window.CAMPUS_GRAPH_EDGES,
        window.CAMPUS_LOCATIONS
      );
    }

    const startLoc = this.findLocation(startTerm);
    const destLoc = this.findLocation(destTerm);

    if (!startLoc || !destLoc) {
      return { success: false, message: "Không tìm thấy thông tin vị trí xuất phát hoặc đích đến." };
    }

    const navRes = this.router.navigate(startLoc.id, destLoc.id);
    if (!navRes || !navRes.success) {
      return navRes;
    }

    this.clearRoute();
    this.activeRoute = navRes;

    // Chuyển đổi các điểm sang tọa độ 3D
    const points3D = [];

    // Tìm mesh 3D của phòng học nếu có
    const findRoomMesh = (name) => {
      if (!name) return null;
      const clean = name.toLowerCase().replace(/^(lớp|phòng)\s*/, '').trim();
      return this.interactiveRooms.find(r => {
        const rName = (r.userData.name || '').toLowerCase().replace(/^(lớp|phòng)\s*/, '').trim();
        return rName === clean;
      });
    };

    // Hàm chuyển đổi 1 điểm nút 2D thành Vector3
    const nodeTo3D = (p, floorStr) => {
      const x3d = (p.x - 740) * 0.062;
      const z3d = (p.y - 650) * 0.088;
      let y3d = 0.5;
      if (floorStr === 't4' || floorStr === 'lau_3') y3d = 11.1;
      else if (floorStr === 't3' || floorStr === 'lau_2') y3d = 7.5;
      else if (floorStr === 't2' || floorStr === 'lau_1') y3d = 3.9;
      return new THREE.Vector3(x3d, y3d, z3d);
    };

    // Điểm đầu
    const startMesh = findRoomMesh(startLoc.name);
    let startPos3D;
    if (startMesh) {
      startPos3D = new THREE.Vector3();
      startMesh.getWorldPosition(startPos3D);
      startPos3D.y += 0.4;
    } else {
      startPos3D = nodeTo3D(startLoc, startLoc.floor);
    }
    points3D.push(startPos3D);

    // Các điểm trung gian
    if (navRes.points && navRes.points.length > 2) {
      for (let i = 1; i < navRes.points.length - 1; i++) {
        const pt = navRes.points[i];
        let nodeFloor = 'tret';
        if (window.CAMPUS_GRAPH_NODES) {
          for (const k in window.CAMPUS_GRAPH_NODES) {
            const nd = window.CAMPUS_GRAPH_NODES[k];
            if (Math.hypot(nd.x - pt.x, nd.y - pt.y) < 1.0) {
              nodeFloor = nd.floor;
              break;
            }
          }
        }
        points3D.push(nodeTo3D(pt, nodeFloor));
      }
    }

    // Điểm cuối
    const destMesh = findRoomMesh(destLoc.name);
    let destPos3D;
    if (destMesh) {
      destPos3D = new THREE.Vector3();
      destMesh.getWorldPosition(destPos3D);
      destPos3D.y += 0.4;
    } else {
      destPos3D = nodeTo3D(destLoc, destLoc.floor);
    }
    points3D.push(destPos3D);

    // Lọc các điểm trùng lặp quá gần (< 0.6 đơn vị)
    const filteredPoints = [points3D[0]];
    for (let i = 1; i < points3D.length; i++) {
      if (filteredPoints[filteredPoints.length - 1].distanceTo(points3D[i]) > 0.6) {
        filteredPoints.push(points3D[i]);
      }
    }

    if (filteredPoints.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(filteredPoints);
      curve.curveType = 'centripetal';
      this.activeCurve = curve;

      // 1. Ống dẫn đường 3D phát sáng
      const tubeSegments = Math.max(50, filteredPoints.length * 16);
      const tubeGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.38, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0284c7,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.2
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.castShadow = true;
      this.routeGroup.add(tubeMesh);

      // 2. Viền dây neon phát sáng bên ngoài
      const wireGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.44, 6, false);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      this.routeGroup.add(wireMesh);

      // 3. Các điểm ghim 3D Bắt đầu & Kết thúc
      this.createRoutePin(filteredPoints[0], "#10b981", `BẮT ĐẦU: ${startLoc.name}`, true);
      this.createRoutePin(filteredPoints[filteredPoints.length - 1], "#ef4444", `ĐẾN: ${destLoc.name}`, false);

      // Tự động xoay camera để bao quát toàn tuyến
      this.focusRoute(filteredPoints);
    } else {
      this.createRoutePin(filteredPoints[0], "#10b981", `VỊ TRÍ: ${startLoc.name}`, true);
    }

    return navRes;
  }

  createRoutePin(pos, hexColor, labelText, isStart = true) {
    const pinGroup = new THREE.Group();
    pinGroup.position.copy(pos);

    const colorNum = typeof hexColor === 'string' ? parseInt(hexColor.replace('#', '0x'), 16) : hexColor;

    // Cột trụ năng lượng
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.18, 5, 16);
    const beamMat = new THREE.MeshStandardMaterial({
      color: colorNum,
      emissive: colorNum,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 2.5;
    pinGroup.add(beam);

    // Viên ngọc phát sáng trên đỉnh cột
    const orbGeo = new THREE.SphereGeometry(0.65, 24, 24);
    const orbMat = new THREE.MeshStandardMaterial({
      color: colorNum,
      emissive: colorNum,
      emissiveIntensity: 1.0,
      metalness: 0.2,
      roughness: 0.1
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 5.3;
    pinGroup.add(orb);

    // Vòng sóng xung nhịp dưới mặt sàn (Pulse ring)
    const ringGeo = new THREE.RingGeometry(1.0, 1.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorNum,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    pinGroup.add(ring);
    this.beaconPulses.push(ring);

    // Biển tên 3D Billboard
    const labelCanvas = this.createCanvasLabel(
      isStart ? "🟢 XUẤT PHÁT" : "🔴 ĐÍCH ĐẾN",
      labelText,
      isStart ? "#10b981" : "#ef4444",
      "#ffffff",
      "#ffffff",
      320,
      120
    );
    const labelMat = new THREE.MeshBasicMaterial({ map: labelCanvas, transparent: true });
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.8), labelMat);
    lbl.position.y = 6.8;
    pinGroup.add(lbl);

    this.routeGroup.add(pinGroup);
  }

  clearRoute() {
    this.stopTour();
    this.beaconPulses = [];
    this.activeCurve = null;
    this.activeRoute = null;

    while (this.routeGroup.children.length > 0) {
      const obj = this.routeGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
      this.routeGroup.remove(obj);
    }
  }

  focusRoute(points) {
    if (!points || points.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z);
      maxZ = Math.max(maxZ, p.z);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const centerY = (minY + maxY) / 2;
    const target = new THREE.Vector3(centerX, centerY, centerZ);

    const span = Math.max(maxX - minX, maxZ - minZ, 22);
    const camPos = new THREE.Vector3(centerX - span * 0.95, centerY + span * 0.85, centerZ + span * 0.95);

    this.tweenCamera(camPos, target, 900);
  }

  tweenCamera(endPos, endTarget, duration = 1000) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  startTour() {
    if (!this.activeCurve) return;
    this.tourActive = true;
    this.tourProgress = 0;
    this.tourStartTime = performance.now();
    const dist = (this.activeRoute && this.activeRoute.totalDistanceMeters) || 60;
    this.tourDuration = Math.max(9000, dist * 160);
  }

  updateTourStep() {
    const now = performance.now();
    const elapsed = now - this.tourStartTime;
    this.tourProgress = Math.min(elapsed / this.tourDuration, 1);

    const pos = this.activeCurve.getPointAt(this.tourProgress);
    const forwardProgress = Math.min(this.tourProgress + 0.05, 1);
    const lookTarget = this.activeCurve.getPointAt(forwardProgress);

    // Tầm mắt người đi bộ (+1.7m)
    this.camera.position.set(pos.x, pos.y + 1.7, pos.z);
    this.controls.target.set(lookTarget.x, lookTarget.y + 1.5, lookTarget.z);
    this.controls.update();

    if (this.tourProgress >= 1) {
      this.tourActive = false;
    }
  }

  stopTour() {
    this.tourActive = false;
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
