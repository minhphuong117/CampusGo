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

    // Hệ thống Chỉ Đường 3D & Chế độ Đi Thử (Walkthrough Simulation)
    this.routeGroup = new THREE.Group();
    this.routeGroup.name = "RouteGroup3D";
    this.beaconPulses = [];
    this.activeCurve = null;
    this.activeRoute = null;
    this.tourActive = false;
    this.tourPaused = false;
    this.tourProgress = 0;
    this.tourStartTime = 0;
    this.tourDuration = 14000;
    this.tourSpeed = 1.0;
    this.tourViewMode = 'firstPerson'; // 'firstPerson' hoặc 'thirdPerson'
    this.tourWaypoints = [];
    this.tourLookTarget = new THREE.Vector3();
    this.savedCameraState = null;
    this.originalFov = 40;
    this.walkFov = 72;
    this.lastTime = performance.now();
    this.router = null;
    this.continuousPanId = null;
    this.interactionMode = 'unified'; // 'unified' (mặc định), 'pan' (kéo di chuyển), 'rotate' (xoay 360)

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
    this.scene.background = new THREE.Color(0xdbeafe); // Bầu trời xanh nhạt thoáng đãng
    this.scene.fog = new THREE.FogExp2(0xe0f2fe, 0.0022);

    // Tối ưu hóa GPU & chống crash trên thiết bị di động: bỏ preserveDrawingBuffer để giảm thiểu ngốn VRAM
    const isMobileDevice = (window.innerWidth <= 768) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobileDevice,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileDevice ? 1.5 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = isMobileDevice ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Cơ chế khôi phục WebGL tự động, ngăn trình duyệt trắng xóa hoặc tự reload khi mất GPU context
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn("Campus3D: WebGL context lost. Tạm dừng render loop an toàn...");
      this.isContextLost = true;
    }, false);

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log("Campus3D: WebGL context restored. Tự động phục hồi khung cảnh 3D...");
      this.isContextLost = false;
    }, false);

    this.container.appendChild(this.renderer.domElement);
    this.scene.add(this.routeGroup);

    this.tourAvatar = this.createTourAvatar();
    this.tourAvatar.visible = false;
    this.scene.add(this.tourAvatar);

    // 2. Camera - Mặc định góc nhìn Flycam trực diện từ trên cao
    this.camera = new THREE.PerspectiveCamera(this.originalFov || 40, width / height, 0.2, 1000);
    this.camera.position.set(0, 48, 70);

    // 3. OrbitControls - Hỗ trợ Di Chuyển (Pan) mượt mà phẳng theo mặt đất như bản đồ 2D
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 160; // Giới hạn cự ly thu nhỏ tối đa 160m vừa vặn bao quát toàn trường, tránh camera lùi quá xa vào vùng trống
    this.controls.target.set(0, 7, 3);

    // Kích hoạt tính năng Di Chuyển (Pan) và Xoay 360 thống nhất
    this.controls.enablePan = true;
    this.controls.panSpeed = 1.15;
    this.controls.screenSpacePanning = true; // Cho phép kéo di chuyển theo cả chiều đứng và ngang, giúp quan sát lên xuống giữa các tầng

    this.controls.addEventListener('change', () => {
      if (window.updateCampus3DPopoverPosition) {
        window.updateCampus3DPopoverPosition();
      }
    });

    // Hệ thống điều khiển tích hợp đồng thời Xoay 360° và Di Chuyển bản đồ
    this.interactionMode = 'unified';
    this.applyInteractionMode();

    // 4. Lights - Ánh nắng trường học buổi sáng rực rỡ chuẩn video thực tế
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0xfef9c3, 0.55);
    hemiLight.position.set(0, 100, 0);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff8eb, 1.15);
    sunLight.position.set(-50, 95, 65);
    sunLight.castShadow = true;
    const shadowRes = isMobileDevice ? 1024 : 2048;
    sunLight.shadow.mapSize.width = shadowRes;
    sunLight.shadow.mapSize.height = shadowRes;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    const d = 85;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    fillLight.position.set(60, 40, -50);
    this.scene.add(fillLight);
  }

  // =========================================================================
  // CÁC HÀM HELPER KIẾN TRÚC MÁI TÔN XANH, CỘT ĐỎ, CÂY XANH & GHẾ ĐÁ THỰC TẾ
  // =========================================================================

  // Xác định chính xác độ cao tầng (Y) cho mọi định dạng tên tầng
  getFloorY(floorStr) {
    if (!floorStr) return 0.1;
    const f = String(floorStr).toLowerCase();
    if (f.includes('4') || f.includes('lầu 3') || f.includes('fl_3') || f.includes('t4')) return 10.8;
    if (f.includes('3') || f.includes('lầu 2') || f.includes('fl_2') || f.includes('t3')) return 7.2;
    if (f.includes('2') || f.includes('lầu 1') || f.includes('fl_1') || f.includes('t2')) return 3.6;
    return 0.1; // Tầng trệt / Mặt đất
  }

  getFloorHeight(floorStr) {
    return this.getFloorY(floorStr);
  }

  // Mặt tiền lớp học hướng ra hành lang: Cửa gỗ vàng, cửa sổ chấn song, biển lớp xanh dương
  // Tái hiện chính xác 100% hình ảnh hành lang trường học trong video
  createClassroomCorridorFacadeTexture(name, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Tường vôi màu kem nhạt ấm áp trường học THPT Tam Phước
    ctx.fillStyle = '#faf7ee';
    ctx.fillRect(0, 0, 1024, 512);

    // 2. Len chân tường gạch màu nâu đỏ sẫm (Baseboard)
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 470, 1024, 42);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(0, 464, 1024, 6);

    // 3. Đường chỉ phào ngang tường
    ctx.strokeStyle = '#e2d8c3';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 75);
    ctx.lineTo(1024, 75);
    ctx.stroke();

    const isWC = name && name.toUpperCase().includes('WC');
    const isBlank = !name || name === '-';

    if (isWC) {
      // Cửa WC
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(360, 100, 304, 370);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#0f766e';
      ctx.strokeRect(360, 100, 304, 370);
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(432, 140, 160, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("WC", 512, 182);
    } else if (!isBlank) {
      // A. Cửa ra vào phòng học (Bên phải): Cánh cửa gỗ vàng đặc trưng
      const doorX = 720;
      const doorY = 95;
      const doorW = 240;
      const doorH = 375;

      // Khung bao cửa màu nâu gỗ
      ctx.fillStyle = '#92400e';
      ctx.fillRect(doorX - 6, doorY - 6, doorW + 12, doorH + 6);

      // Thân cửa gỗ sơn vàng tươi ấm
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(doorX, doorY, doorW, doorH);

      // Ô kính quan sát trên cửa
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(doorX + 35, doorY + 40, doorW - 70, 120);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.strokeRect(doorX + 35, doorY + 40, doorW - 70, 120);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(doorX + 45, doorY + 45);
      ctx.lineTo(doorX + 85, doorY + 45);
      ctx.lineTo(doorX + 55, doorY + 150);
      ctx.lineTo(doorX + 45, doorY + 150);
      ctx.fill();

      // Các pano gỗ bên dưới
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.strokeRect(doorX + 25, doorY + 185, doorW - 50, 115);
      ctx.strokeRect(doorX + 25, doorY + 315, doorW - 50, 45);

      // Tay nắm cửa tròn inox
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(doorX + 28, doorY + 225, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(doorX + 26, doorY + 223, 4, 0, Math.PI * 2);
      ctx.fill();

      // B. Cửa sổ phòng học có chấn song sắt ngang (Bên trái)
      const winX = 60;
      const winY = 115;
      const winW = 580;
      const winH = 245;

      // Khung cửa sổ gỗ màu vàng
      ctx.fillStyle = '#92400e';
      ctx.fillRect(winX - 6, winY - 6, winW + 12, winH + 12);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(winX, winY, winW, winH);

      // Các ô cửa sổ kính
      const paneW = (winW - 16) / 3;
      for (let p = 0; p < 3; p++) {
        const px = winX + 4 + p * (paneW + 4);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(px, winY + 4, paneW, winH - 8);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3;
        ctx.strokeRect(px, winY + 4, paneW, winH - 8);

        // Các chấn song an toàn nằm ngang màu vàng
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        for (let b = 1; b <= 4; b++) {
          const by = winY + 4 + b * ((winH - 8) / 5);
          ctx.beginPath();
          ctx.moveTo(px, by);
          ctx.lineTo(px + paneW, by);
          ctx.stroke();
        }

        // Vệt phản chiếu ánh sáng trên kính
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(px + 10, winY + 10);
        ctx.lineTo(px + 35, winY + 10);
        ctx.lineTo(px + 20, winY + winH - 20);
        ctx.lineTo(px + 10, winY + winH - 20);
        ctx.fill();
      }

      // C. Biển phòng học màu xanh dương chữ trắng đặc trưng (Bên trên cửa ra vào)
      const plateX = doorX + 10;
      const plateY = 20;
      const plateW = doorW - 20;
      const plateH = 58;

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(plateX, plateY, plateW, plateH);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(plateX, plateY, plateW, plateH);

      // Chữ biển phòng
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let title = name.toUpperCase().trim();

      // Kiểm tra xem phòng có thuộc Dãy Tòa Giáo Viên (Hiệu Bộ) hay không
      const isTeacherBuilding = options.isTeacherBuilding || options.noClassPrefix || false;
      const isTeacherRoom = isTeacherBuilding || [
        'HIỆU TRƯỞNG', 'VĂN THƯ', 'KẾ TOÁN', 'CHI BỘ', 'HỒ SƠ', 'PHÓ HT', 'TRUYỀN THỐNG', 'TIẾP DÂN'
      ].some(k => title.includes(k));

      if (isTeacherRoom) {
        // Tuyệt đối không có chữ "LỚP" cho phòng thuộc dãy tòa giáo viên
        title = title.replace(/^LỚP\s+/i, '').trim();
      } else {
        // Chỉ thêm tiền tố "LỚP " cho các lớp học học sinh (bắt đầu bằng khối số như 10A1, 11A5, 12A9)
        const isStudentClass = /^\d{1,2}[A-Z]/.test(title);
        if (isStudentClass && !title.startsWith('LỚP')) {
          title = `LỚP ${title}`;
        }
      }

      ctx.font = '900 24px "Segoe UI", Roboto, sans-serif';
      if (ctx.measureText(title).width > plateW - 16) {
        ctx.font = 'bold 18px "Segoe UI", Roboto, sans-serif';
      }
      if (ctx.measureText(title).width > plateW - 16) {
        ctx.font = 'bold 14px "Segoe UI", Roboto, sans-serif';
      }
      ctx.fillText(title, plateX + plateW / 2, plateY + plateH / 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  // Gạch men màu kem nhạt bóng ấm lát hành lang
  createCorridorFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ede5d8';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#d4c7b5';
    ctx.lineWidth = 3;
    const tileSize = 64;
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 2);
    return tex;
  }

  // Gạch bê tông con sâu lượn sóng sân trường kèm các vạch sơn trắng tập trung chào cờ
  createCourtyardPaversTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Nền đá xám bê tông
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 1024, 1024);

    // Kẻ ron gạch sân trường
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y < 1024; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Các vạch sơn trắng kẻ hàng tập trung học sinh (chuẩn sân chào cờ trong video)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 14;
    for (let x = 128; x < 1024; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  }

  // Chậu cây kiểng / bonsai viền đỏ gạch xếp dọc hành lang & sân khấu
  createPottedPlant(x, z, s = 1) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Chậu đất nung màu đỏ gạch
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35 * s, 0.25 * s, 0.5 * s, 14),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.75 })
    );
    pot.position.y = (0.5 * s) / 2;
    pot.castShadow = true;
    group.add(pot);

    // Cây cảnh tròn xanh mướt
    const plant = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.38 * s, 1),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 })
    );
    plant.position.y = 0.62 * s;
    plant.castShadow = true;
    group.add(plant);

    return group;
  }

  // Dây cờ tam giác nhiều màu treo ngang sân trường (chuẩn lễ hội trường học)
  createFestiveFlags(x1, y1, z1, x2, y2, z2, flagCount = 18) {
    const group = new THREE.Group();
    const colors = [0xdc2626, 0xfacc15, 0x2563eb, 0x16a34a, 0xf97316];
    for (let i = 0; i <= flagCount; i++) {
      const t = i / flagCount;
      const x = x1 + (x2 - x1) * t;
      const sag = Math.sin(t * Math.PI) * 1.2;
      const y = y1 + (y2 - y1) * t - sag;
      const z = z1 + (z2 - z1) * t;

      const flagGeo = new THREE.BufferGeometry();
      const hw = 0.22;
      const h = 0.45;
      const verts = new Float32Array([
        -hw, 0, 0,
        hw, 0, 0,
        0, -h, 0
      ]);
      flagGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      flagGeo.computeVertexNormals();

      const flagMat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide
      });
      const flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(x, y, z);
      group.add(flagMesh);
    }
    return group;
  }

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

  // Cây phượng vĩ nở hoa đỏ rực rỡ trước cổng trường (chuẩn ảnh thực tế THPT Tam Phước)
  createPoincianaTree(x, z, scale = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    // Bồn cây vuông viền gạch
    const planter = this.createSquarePlanter(0, 0, 3.2 * scale);
    tree.add(planter);

    // Thân cây gỗ nâu đậm xù xì đặc trưng
    const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.45 * scale, 4.4 * scale, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2c16, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = (4.4 * scale) / 2;
    trunk.castShadow = true;
    tree.add(trunk);

    // Cành nhánh xòe rộng
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    [
      { rx: 0.35, rz: 0.5, y: 3.4 * scale, len: 2.4 * scale },
      { rx: -0.35, rz: -0.5, y: 3.6 * scale, len: 2.4 * scale },
      { rx: 0.45, rz: -0.4, y: 3.8 * scale, len: 2.2 * scale }
    ].forEach(b => {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, b.len, 6), branchMat);
      branch.position.set(0, b.y, 0);
      branch.rotation.set(b.rx, 0, b.rz);
      tree.add(branch);
    });

    // Tán lá xanh điểm hoa phượng đỏ rực rỡ
    const redFlowerMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
    const brightRedFlowerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const greenFoliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    // Các cụm lá xanh
    [
      { x: 0, y: 5.0, z: 0, r: 2.1 },
      { x: 1.4, y: 5.3, z: 0.8, r: 1.7 },
      { x: -1.4, y: 5.1, z: -0.8, r: 1.7 },
      { x: -0.9, y: 5.5, z: 1.0, r: 1.5 },
      { x: 1.1, y: 5.3, z: -1.0, r: 1.5 }
    ].forEach(f => {
      const fol = new THREE.Mesh(new THREE.DodecahedronGeometry(f.r * scale, 1), greenFoliageMat);
      fol.position.set(f.x * scale, f.y * scale, f.z * scale);
      fol.castShadow = true;
      tree.add(fol);
    });

    // Các chùm hoa phượng vĩ đỏ rực rỡ nở rộ trên tán cây (chuẩn ảnh thật cổng trường)
    [
      { x: 0.3, y: 6.0, z: 0.4, r: 1.4 },
      { x: 1.6, y: 5.8, z: 0.6, r: 1.2 },
      { x: -1.4, y: 5.7, z: 0.8, r: 1.2 },
      { x: -0.6, y: 6.2, z: -1.0, r: 1.3 },
      { x: 1.3, y: 5.9, z: -0.8, r: 1.1 },
      { x: -0.2, y: 6.5, z: 0.2, r: 1.2 }
    ].forEach((fl, idx) => {
      const flower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(fl.r * scale, 1),
        idx % 2 === 0 ? redFlowerMat : brightRedFlowerMat
      );
      flower.position.set(fl.x * scale, fl.y * scale, fl.z * scale);
      flower.castShadow = true;
      tree.add(flower);
    });

    return tree;
  }

  // Tạo biển đá hoa cương đen khắc chữ vàng chuẩn bia đá cổng trường THPT Tam Phước
  createStoneMonumentTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 440;
    const ctx = canvas.getContext('2d');

    // Nền đá hoa cương đen bóng sang trọng
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 440);

    // Họa tiết vân đá cẩm thạch nhẹ
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 60 * i + 40);
      ctx.bezierCurveTo(300, 50 * i + 90, 700, 70 * i, 1024, 65 * i + 50);
      ctx.stroke();
    }

    // Viền kim loại vàng kép sang trọng
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#d97706';
    ctx.strokeRect(12, 12, 1000, 416);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fde047';
    ctx.strokeRect(26, 26, 972, 388);

    // 1. Dòng trên: SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 30px "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText("SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI", 512, 48);

    // 2. Dòng 2: TRƯỜNG TRUNG HỌC PHỔ THÔNG
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Segoe UI", Roboto, sans-serif';
    ctx.fillText("TRƯỜNG TRUNG HỌC PHỔ THÔNG", 512, 110);

    // 3. Dòng 3 (chính): TAM PHƯỚC (chữ vàng bóng lớn)
    ctx.fillStyle = '#facc15';
    ctx.font = '900 86px "Segoe UI", Roboto, sans-serif';
    ctx.shadowColor = 'rgba(250, 204, 21, 0.5)';
    ctx.shadowBlur = 14;
    ctx.fillText("TAM PHƯỚC", 512, 185);
    ctx.shadowBlur = 0;

    // 4. Đường kẻ phân cách vàng
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(180, 310);
    ctx.lineTo(844, 310);
    ctx.stroke();

    // 5. Địa chỉ trường
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 26px "Segoe UI", Roboto, sans-serif';
    ctx.fillText("P. Tam Phước - TP. Biên Hòa - Đồng Nai", 512, 345);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  // Tạo biển khẩu hiệu cổng trường "CỔNG TRƯỜNG SẠCH ĐẸP - AN TOÀN"
  createGateSloganTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    // Nền xanh dương đậm
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, 0, 1024, 360);

    // Viền trắng
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(10, 10, 1004, 340);

    // Tiêu đề: CỔNG TRƯỜNG SẠCH ĐẸP - AN TOÀN
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 50px "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText("CỔNG TRƯỜNG SẠCH ĐẸP - AN TOÀN", 512, 45);

    // Đường gạch trắng
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(120, 125);
    ctx.lineTo(904, 125);
    ctx.stroke();

    // Khẩu hiệu: Học để làm cho bản thân và cộng đồng hạnh phúc!
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Segoe UI", Roboto, sans-serif';
    ctx.fillText("Học để làm cho bản thân", 512, 160);
    ctx.fillText("và cộng đồng hạnh phúc!", 512, 230);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  // Băng rôn khẩu hiệu trường học nền đỏ chữ vàng sắc nét, tự co giãn chữ chống tràn viền
  createSloganBanner(text, x, y, z, w, h, rotY = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    // Nền đỏ cờ
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 1024, 180);

    // Viền kép vàng sang trọng
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#fef08a';
    ctx.strokeRect(8, 8, 1008, 164);
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 992, 148);

    // Tự động tính cỡ chữ để đảm bảo lề an toàn tối thiểu 60px 2 bên
    const maxTextW = 1024 - 140;
    let fontSize = 54;
    ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, -apple-system, sans-serif`;
    while (ctx.measureText(text).width > maxTextW && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, -apple-system, sans-serif`;
    }

    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 90);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
    );
    banner.position.set(x, y, z);
    banner.rotation.y = rotY;
    return banner;
  }

  // Tạo texture chữ viết sắc nét cho phòng và nhãn, tự động co giãn cỡ chữ (auto-fit) chống dính viền và khuyết chữ
  createCanvasLabel(text, subtext = '', bgColor = '#ffffff', textColor = '#0f172a', borderColor = '#94a3b8', width = 320, height = 160) {
    const canvas = document.createElement('canvas');
    // Nhân đôi độ phân giải texture (HiDPI / Retina) để chữ cực kỳ sắc nét khi zoom cận cảnh
    const renderScale = 2;
    const cw = Math.round((width || 320) * renderScale);
    const ch = Math.round((height || 160) * renderScale);
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    const cleanText = (text || '').trim();
    const cleanSub = (subtext || '').trim();
    const hasSub = Boolean(cleanSub.length > 0);

    // 1. Vẽ nền bo góc và viền hộp
    const borderWidth = Math.max(5, Math.round(ch * 0.038));
    const borderRadius = Math.max(14, Math.round(ch * 0.15));
    const borderOffset = Math.round(borderWidth / 2) + 2;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(borderOffset, borderOffset, cw - borderOffset * 2, ch - borderOffset * 2, borderRadius);
    ctx.fill();

    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    // 2. Vùng an toàn cho chữ (Safe Margin / Padding):
    // Dành ít nhất 13% chiều ngang mỗi bên và 12% chiều dọc -> Chữ tuyệt đối KHÔNG BAO GIỜ dính hoặc tràn viền
    const paddingX = Math.max(28, Math.round(cw * 0.13));
    const maxTextWidth = cw - 2 * paddingX;
    const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    // 3. Tự động tính toán cỡ chữ Tiêu đề (Auto-fit title font size)
    let titleFontSize = hasSub ? Math.round(ch * 0.34) : Math.round(ch * 0.46);
    const maxTitleSize = hasSub ? Math.round(ch * 0.36) : Math.round(ch * 0.50);
    if (titleFontSize > maxTitleSize) titleFontSize = maxTitleSize;

    ctx.font = `bold ${titleFontSize}px ${fontStack}`;
    let measuredTitleW = ctx.measureText(cleanText).width;
    while (measuredTitleW > maxTextWidth && titleFontSize > 14) {
      titleFontSize -= 1.5;
      ctx.font = `bold ${titleFontSize}px ${fontStack}`;
      measuredTitleW = ctx.measureText(cleanText).width;
    }

    // 4. Tự động tính toán cỡ chữ Phụ đề (Auto-fit subtext font size)
    let subFontSize = 0;
    let measuredSubW = 0;
    if (hasSub) {
      subFontSize = Math.min(Math.round(titleFontSize * 0.60), Math.round(ch * 0.22));
      ctx.font = `600 ${subFontSize}px ${fontStack}`;
      measuredSubW = ctx.measureText(cleanSub).width;
      while (measuredSubW > maxTextWidth && subFontSize > 12) {
        subFontSize -= 1.2;
        ctx.font = `600 ${subFontSize}px ${fontStack}`;
        measuredSubW = ctx.measureText(cleanSub).width;
      }
    }

    // 5. Căn chỉnh vị trí chữ chính giữa tâm hộp với khoảng cách hài hòa
    ctx.textAlign = 'center';

    if (hasSub) {
      const gap = Math.max(6, Math.round(ch * 0.055));
      const totalBlockH = titleFontSize + gap + subFontSize;
      const startY = Math.round((ch - totalBlockH) / 2);

      // Vẽ Tiêu đề chính
      ctx.fillStyle = textColor;
      ctx.font = `bold ${titleFontSize}px ${fontStack}`;
      ctx.textBaseline = 'top';
      ctx.fillText(cleanText, cw / 2, startY);

      // Vẽ Phụ đề
      const subColor = (textColor === '#ffffff' || textColor === '#fff') ? 'rgba(255, 255, 255, 0.88)' : '#64748b';
      ctx.fillStyle = subColor;
      ctx.font = `600 ${subFontSize}px ${fontStack}`;
      ctx.textBaseline = 'top';
      ctx.fillText(cleanSub, cw / 2, startY + titleFontSize + gap);
    } else {
      // Chỉ có tiêu đề duy nhất -> căn giữa hoàn hảo theo cả 2 trục
      ctx.fillStyle = textColor;
      ctx.font = `bold ${titleFontSize}px ${fontStack}`;
      ctx.textBaseline = 'middle';
      ctx.fillText(cleanText, cw / 2, ch / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  // Lan can hành lang chuẩn video: tường bê tông vôi kem nửa dưới, ống thép tròn xanh dương phía trên
  createCorridorBalustrade(length, x, y, z, rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    const parapetMat = new THREE.MeshStandardMaterial({ color: 0xfaf7ee, roughness: 0.6 });
    const bluePipeMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5, roughness: 0.35 });

    // 1. Tường bê tông kem dưới cao 0.62m
    const wallGeo = new THREE.BoxGeometry(length, 0.62, 0.14);
    const wall = new THREE.Mesh(wallGeo, parapetMat);
    wall.position.y = 0.31;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    // 2. Tay vịn ống tròn xanh dương trên cùng cao 0.88m
    const pipeGeo = new THREE.CylinderGeometry(0.038, 0.038, length, 16);
    const pipe = new THREE.Mesh(pipeGeo, bluePipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.y = 0.88;
    pipe.castShadow = true;
    group.add(pipe);

    // 3. Các chân trụ thép đứng giữ tay vịn cách đều nhau ~3m
    const postGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.28, 12);
    const numPosts = Math.max(2, Math.floor(length / 3));
    for (let i = 0; i <= numPosts; i++) {
      const px = -length / 2 + (i / numPosts) * length;
      const post = new THREE.Mesh(postGeo, bluePipeMat);
      post.position.set(px, 0.74, 0);
      group.add(post);
    }

    return group;
  }

  buildCampus() {
    this.buildGround();
    this.buildBackBuilding();          // 1. Dãy Lớp Sau A (Khối 10, 11 & Thư Viện - NẰM NGANG)
    this.buildLeftWingBuilding();       // 2. Cánh Trái Dãy B (Khối 12 - 4 tầng - NẰM NGANG)
    // 3. Đằng sau mái chóp tam giác không có khối tòa trung tâm nào (chuẩn ảnh 1, 3, 4 thực tế)
    this.buildRightWingBuilding();      // 4. Cánh Phải Dãy Bộ Môn (4 tầng - NẰM NGANG)
    this.buildFrontLeftAdminBuilding(); // 5. Dãy Hành Chính Hiệu Bộ (2 tầng - NẰM NGANG)
    this.buildAuditoriumBuilding();     // 6. Hội Trường Mái Vòm Xanh (Phía trước bên phải)
    this.buildWestConnectingBridges();  // 7. Hệ Thống Cầu Hành Lang Liên Tòa Nhà
    this.buildCentralCanopyAndFlag();   // 8. Mái Che Tam Giác & Cột Cờ (Chuẩn ảnh 1, 3, 4)
    this.buildCampusEnvironment();      // 9. Cổng trường, Sân bóng, Nhà xe & Cây xanh
  }

  // Sân trường và mặt đất thực tế
  buildGround() {
    const groundGroup = new THREE.Group();

    // 1. Mặt sân gạch trường học (Paved Courtyard Stone) với vạch sơn trắng tập trung chào cờ chuẩn video
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const paversTex = this.createCourtyardPaversTexture();
    const groundMat = new THREE.MeshStandardMaterial({
      map: paversTex,
      roughness: 0.8,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    groundGroup.add(ground);

    // 2. Lối đi xe trải nhựa màu xám đen bên cánh trái (chạy từ cổng vào phía sau)
    const roadGeo = new THREE.PlaneGeometry(8, 100);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(-49, 0.03, 10);
    road.receiveShadow = true;
    groundGroup.add(road);

    // Vạch kẻ đường xe chạy màu trắng
    const roadLineGeo = new THREE.PlaneGeometry(0.3, 90);
    const roadLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const roadLine = new THREE.Mesh(roadLineGeo, roadLineMat);
    roadLine.rotation.x = -Math.PI / 2;
    roadLine.position.set(-49, 0.04, 10);
    groundGroup.add(roadLine);

    // 3. Sân cờ trung tâm (vòng tròn lát đá xung quanh cột cờ, thông thoáng chuẩn ảnh thực tế)
    const plazaGeo = new THREE.CircleGeometry(7.5, 48);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.04, 11);
    plaza.receiveShadow = true;
    groundGroup.add(plaza);

    // 4. Các cây bóng mát có bồn cây vuông lát gạch đặt dọc mép sân trường theo ảnh Flycam
    const treePositions = [
      { x: -14, z: 2, s: 1.1 },
      { x: -14, z: 18, s: 1.0 },
      { x: -14, z: 32, s: 1.0 },
      { x: 14, z: 4, s: 1.05 },
      { x: 14, z: 18, s: 1.1 },
      { x: 12, z: 32, s: 1.0 },
      { x: -28, z: -8, s: 0.95 },
      { x: -38, z: 10, s: 0.9 },
      { x: -44, z: 40, s: 1.0 }
    ];
    treePositions.forEach(tp => {
      const tree = this.createCourtyardTree(tp.x, tp.z, tp.s);
      groundGroup.add(tree);
    });

    // 5. Các dãy ghế đá trường học màu trắng xếp dọc hành lang & tán cây
    const benchPositions = [
      { x: -15, z: 2, rot: Math.PI / 2 },
      { x: -15, z: 18, rot: Math.PI / 2 },
      { x: -15, z: 30, rot: Math.PI / 2 },
      { x: 14, z: 8, rot: -Math.PI / 2 },
      { x: 14, z: 22, rot: -Math.PI / 2 },
      { x: -21.5, z: -14, rot: Math.PI / 2 },
      { x: -21.5, z: -6, rot: Math.PI / 2 },
      { x: -16, z: -25, rot: 0 },
      { x: 0, z: -25, rot: 0 },
      { x: 16, z: -25, rot: 0 }
    ];
    benchPositions.forEach(bp => {
      const bench = this.createWhiteBench(bp.x, 0, bp.z, bp.rot);
      groundGroup.add(bench);
    });

    // 6. Các chậu cây kiểng / bonsai viền đỏ gạch đặt dọc mép hành lang (như trong video)
    const pottedPositions = [
      { x: -36, z: 2.4 }, { x: -30, z: 2.4 }, { x: -24, z: 2.4 }, { x: -18, z: 2.4 }, { x: -10, z: 2.4 },
      { x: 10, z: 2.4 }, { x: 18, z: 2.4 }, { x: 26, z: 2.4 }, { x: 34, z: 2.4 },
      { x: -2, z: 2.4 }, { x: 2, z: 2.4 }
    ];
    pottedPositions.forEach(pp => {
      groundGroup.add(this.createPottedPlant(pp.x, pp.z, 0.9));
    });

    // 7. Dây cờ tam giác lễ hội rực rỡ treo ngang sân trường (từ Mái tam giác sang các dãy hành lang)
    groundGroup.add(this.createFestiveFlags(-4.5, 5.0, -2, -18, 4.0, 2, 14));
    groundGroup.add(this.createFestiveFlags(4.5, 5.0, -2, 18, 4.0, 2, 14));

    this.scene.add(groundGroup);
  }

  // Helper tạo khối phòng học chuẩn 3D - Tích hợp đầy đủ mặt tiền cửa gỗ vàng, cửa sổ chấn song và biển phòng xanh dương
  createRoomBlock(name, x, y, z, w, h, d, options = {}) {
    const isHighlight = options.isHighlight || false;
    const bgColor = options.color || (isHighlight ? 0xfef08a : 0xfcfaf6);
    const strokeColor = options.stroke || (isHighlight ? '#ca8a04' : '#d1d5db');
    const textColor = options.textColor || (isHighlight ? '#854d0e' : '#1e293b');
    const floorKey = options.floorKey || 'g';
    const locId = options.locId || options.id || '';

    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData = { id: locId, locId: locId, name, floorKey, info: options.info || '', building: options.building || '' };

    // Khối tường/thân phòng màu vôi kem ấm
    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xfcfaf6,
      roughness: 0.6,
      metalness: 0.05
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.castShadow = true;
    box.receiveShadow = true;
    box.userData = group.userData;
    group.add(box);

    // Viền khung sắc nét
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: isHighlight ? 0xd97706 : 0xd1d5db, linewidth: 1.2 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    group.add(wireframe);

    // 1. Mặt nhãn hiển thị tên phòng trên mái (cho góc nhìn Flycam bao quát toàn cảnh)
    if (name && name !== '-') {
      const labelMat = new THREE.MeshBasicMaterial({
        map: this.createCanvasLabel(name, options.subtext || '', isHighlight ? '#fef08a' : '#ffffff', textColor, strokeColor, 340, 160),
        transparent: true
      });
      const topW = Math.min(w * 0.88, 7.2);
      const topH = Math.min(d * 0.72, topW / 1.8);
      const topLabelGeo = new THREE.PlaneGeometry(topW, topH);
      const topLabel = new THREE.Mesh(topLabelGeo, labelMat);
      topLabel.rotation.x = -Math.PI / 2;
      topLabel.position.y = h / 2 + 0.05;
      topLabel.userData = group.userData;
      group.add(topLabel);
    }

    // 2. Mặt trước hành lang (Facing Corridor): Cửa gỗ vàng + Cửa sổ chấn song + Biển hiệu xanh dương
    // Tái hiện chính xác diện mạo thực tế của trường trong video
    const facadeTex = this.createClassroomCorridorFacadeTexture(name, options);
    const facadeMat = new THREE.MeshStandardMaterial({
      map: facadeTex,
      roughness: 0.5,
      metalness: 0.05
    });
    const facadeGeo = new THREE.PlaneGeometry(w, h);
    const facadeMesh = new THREE.Mesh(facadeGeo, facadeMat);
    facadeMesh.position.set(0, 0, d / 2 + 0.04);
    facadeMesh.userData = group.userData;
    group.add(facadeMesh);

    this.interactiveRooms.push(group);
    return group;
  }

  // Helper tạo cầu thang kết nối các tầng trong 3D
  createStairTower(x, z, totalFloors = 4, floorHeight = 4, width = 6, depth = 8, name = "CẦU THANG", locId = "") {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData = { id: locId, locId: locId, name: name, floorKey: 'stair', info: "Cầu thang bộ kết nối các tầng" };

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
    tower.userData = group.userData;
    group.add(tower);
    this.interactiveRooms.push(tower);
    this.interactiveRooms.push(group);

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

      // Biển báo tầng ở lồng cầu thang chuẩn tỷ lệ 2.1:1
      const labelMat = new THREE.MeshBasicMaterial({
        map: this.createCanvasLabel(`Cầu Thang`, f === 0 ? 'Tầng Trệt' : `Tầng ${f + 1}`, '#e2e8f0', '#1e293b', '#64748b', 340, 160),
        transparent: true
      });
      const lblW = width * 0.7;
      const lbl = new THREE.Mesh(new THREE.PlaneGeometry(lblW, lblW / 2.1), labelMat);
      lbl.position.set(0, baseY + 2.2, depth / 2 + 0.08);
      lbl.userData = group.userData;
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
          { name: "WC", locId: "wc_a_tret_left", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "10A7", locId: "a_tret_10a7", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A8", locId: "a_tret_10a8", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { isStair1: true },
          { name: "THƯ VIỆN", locId: "a_tret_thu_vien", isLibrary: true, w: roomW * 3 + 1, color: 0xffffff, stroke: '#0284c7', textColor: '#0284c7' },
          { isStair2: true },
          { name: "11A9", locId: "a_tret_11a9", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A10", locId: "a_tret_11a10", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "WC", locId: "wc_a_tret_right", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 2 (fl_1)
      {
        floor: 1, label: "Tầng 2", rooms: [
          { name: "WC", locId: "wc_a_t2_left", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "10A6", locId: "a_t2_10a6", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A5", locId: "a_t2_10a5", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { isStair1: true },
          { name: "10A4", locId: "a_t2_10a4", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "11A8", locId: "a_t2_11a8", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A7", locId: "a_t2_11a7", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { isStair2: true },
          { name: "11A6", locId: "a_t2_11a6", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A5", locId: "a_t2_11a5", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "WC", locId: "wc_a_t2_right", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 3 (fl_2)
      {
        floor: 2, label: "Tầng 3", rooms: [
          { name: "WC", locId: "wc_a_t3_left", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "10A1", locId: "a_t3_10a1", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A2", locId: "a_t3_10a2", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { isStair1: true },
          { name: "10A3", locId: "a_t3_10a3", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "11A1", locId: "a_t3_11a1", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A2", locId: "a_t3_11a2", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { isStair2: true },
          { name: "11A3", locId: "a_t3_11a3", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "11A4", locId: "a_t3_11a4", color: 0xdbeafe, stroke: '#0284c7', textColor: '#1e293b' },
          { name: "WC", locId: "wc_a_t3_right", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 4 (fl_3)
      {
        floor: 3, label: "Tầng 4", rooms: [
          { name: "WC", locId: "wc_a_t4_left", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "P. CẠNH SỬ", locId: "a_t4_ben_su_dia", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b' },
          { name: "SỬ ĐỊA", locId: "a_t4_su_dia", subtext: "GDKTPL", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b' },
          { isStair1: true },
          { name: "P38", locId: "a_t4_p38", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b' },
          { name: "P39", locId: "a_t4_p39", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b' },
          { name: "10A13", locId: "a_t4_10a13", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { isStair2: true },
          { name: "10A12", locId: "a_t4_10a12", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A11", locId: "a_t4_10a11", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "WC", locId: "wc_a_t4_right", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      }
    ];

    floorsData.forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let startX = -32;

      // Sàn hành lang gạch men kem chuẩn video thực tế
      const slabGeo = new THREE.BoxGeometry(72, 0.4, roomD + 3);
      const slabMat = new THREE.MeshStandardMaterial({ map: this.createCorridorFloorTexture(), roughness: 0.55 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(0, fl.floor * floorH, zPos + 1.5);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang: Nửa dưới bê tông vôi kem, nửa trên tay vịn thép tròn xanh dương
      const balustrade = this.createCorridorBalustrade(72, 0, fl.floor * floorH, zPos + roomD / 2 + 3);
      building.add(balustrade);

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
          locId: r.locId || '',
          isHighlight: r.isHighlight,
          color: r.color,
          stroke: r.stroke,
          textColor: r.textColor,
          subtext: r.subtext || '',
          floorKey: `fl_${fl.floor}`
        });
        building.add(roomBox);
        startX += rw + 0.4;
      });
    });

    // 2 Tháp Cầu thang Dãy A
    const stair1 = this.createStairTower(-14, zPos, 4, floorH, 5.5, roomD + 2.5, "CẦU THANG 1", "cau_thang_a1");
    const stair2 = this.createStairTower(14, zPos, 4, floorH, 5.5, roomD + 2.5, "CẦU THANG 2", "cau_thang_a2");
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

    // Băng rôn khẩu hiệu trên nóc Dãy A (chuẩn ảnh 3 thực tế)
    const bannerA = this.createSloganBanner("VÌ LỢI ÍCH MƯỜI NĂM TRỒNG CÂY - VÌ LỢI ÍCH TRĂM NĂM TRỒNG NGƯỜI", 0, 13.0, zPos + roomD / 2 + 3.3, 24, 1.4, 0);
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
          { name: "WC", locId: "wc_b_tret", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "12A7", locId: "b_tret_12a7", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A8", locId: "b_tret_12a8", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { isStair: true },
          { name: "12A9", locId: "b_tret_12a9", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A10", locId: "b_tret_12a10", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "ÂM THANH", locId: "b_tret_am_thanh", subtext: "P. Âm thanh", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', w: 3.5 }
        ]
      },
      // Tầng 2 (fl_1)
      {
        floor: 1,
        label: "Tầng 2",
        rooms: [
          { name: "WC", locId: "wc_b_t2", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "12A3", locId: "b_t2_12a3", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A4", locId: "b_t2_12a4", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { isStair: true },
          { name: "12A5", locId: "b_t2_12a5", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A6", locId: "b_t2_12a6", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "THI VỤ", locId: "b_t2_thi_vu", subtext: "P. Thi vụ", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', w: 3.5 }
        ]
      },
      // Tầng 3 (fl_2)
      {
        floor: 2,
        label: "Tầng 3",
        rooms: [
          { name: "WC", locId: "wc_b_t3", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "12A1", locId: "b_t3_12a1", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { name: "12A2", locId: "b_t3_12a2", color: 0xfed7aa, stroke: '#ea580c', textColor: '#1e293b' },
          { isStair: true },
          { name: "10A10", locId: "b_t3_10a10", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "10A9", locId: "b_t3_10a9", color: 0xfef08a, stroke: '#ca8a04', textColor: '#1e293b' },
          { name: "NGHỈ GV NỮ", locId: "b_t3_nghi_gv_nu", subtext: "P. Nghỉ GV", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', w: 3.5 }
        ]
      },
      // Tầng 4 (fl_3)
      {
        floor: 3,
        label: "Tầng 4",
        rooms: [
          { name: "WC", locId: "wc_b_t4", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
          { name: "P14", locId: "b_t4_p14", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b' },
          { name: "P15", locId: "b_t4_p15", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b' },
          { isStair: true },
          { name: "P16", locId: "b_t4_p16", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b' },
          { name: "MEDIA", locId: "b_t4_media", subtext: "P. Media", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b' },
          { name: "NGHỈ GV NAM", locId: "b_t4_nghi_gv_nam", subtext: "P. Nghỉ GV", color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', w: 3.5 }
        ]
      }
    ];

    floors.forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let startX = -43.3;

      // Sàn hành lang gạch men kem chuẩn video thực tế
      const slabGeo = new THREE.BoxGeometry(36, 0.4, roomD + 3);
      const slabMat = new THREE.MeshStandardMaterial({ map: this.createCorridorFloorTexture(), roughness: 0.55 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(-25.65, fl.floor * floorH, zPos + 1.5);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang: Nửa dưới bê tông vôi kem, nửa trên tay vịn thép tròn xanh dương
      if (fl.floor === 0 || fl.floor === 1) {
        // Mở lối thông hành lang vào cầu nối sang Dãy Hành chính thẳng đối diện lớp 12A9 & 12A5 (X = -20.1)
        const balustradeL = this.createCorridorBalustrade(21.4, -32.95, fl.floor * floorH, zPos + roomD / 2 + 3);
        const balustradeR = this.createCorridorBalustrade(10.2, -13.1, fl.floor * floorH, zPos + roomD / 2 + 3);
        building.add(balustradeL);
        building.add(balustradeR);
      } else {
        const balustrade = this.createCorridorBalustrade(36, -25.65, fl.floor * floorH, zPos + roomD / 2 + 3);
        building.add(balustrade);
      }

      fl.rooms.forEach(r => {
        if (r.isStair) {
          startX += 5.5;
          return;
        }

        const rw = r.w || roomW;
        const box = this.createRoomBlock(r.name, startX + rw / 2, y, zPos, rw, floorH * 0.9, roomD, {
          locId: r.locId || '',
          color: r.color,
          stroke: r.stroke,
          textColor: r.textColor,
          subtext: r.subtext || '',
          floorKey: `fl_${fl.floor}`
        });

        // Điểm đánh dấu liên kết hành lang ở phòng 12A9 (trệt) và 12A5 (lầu 1)
        if (fl.floor === 0 && r.name === '12A9') {
          const pin = this.createConnectionMarker(startX + rw / 2, y + 1.2, zPos + roomD / 2 + 1.8, "12A9 - NỐI HÀNH LANG TẦNG TRỆT", "#ca8a04");
          building.add(pin);
        }
        if (fl.floor === 1 && r.name === '12A5') {
          const pin = this.createConnectionMarker(startX + rw / 2, y + 1.2, zPos + roomD / 2 + 1.8, "12A5 - NỐI CẦU HÀNH LANG TẦNG 2", "#2563eb");
          building.add(pin);
        }

        building.add(box);
        startX += rw + 0.4;
      });
    });

    // Tháp cầu thang Dãy B (đặt tại trục thang giữa)
    const stairB = this.createStairTower(-25.45, zPos, 4, floorH, 5.2, roomD + 2.5, "CẦU THANG B", "cau_thang_b");
    building.add(stairB);

    // Cột trụ đỏ gạch mặt tiền Cánh Trái (dựng đều tại vách ngăn giữa các phòng, chừa lối thông thẳng đối diện 12A9)
    const redColMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    [-43.5, -39.6, -34.0, -28.4, -22.7, -17.5, -11.7, -8.0].forEach(cx => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4 * floorH, 0.55), redColMat);
      col.position.set(cx, (4 * floorH) / 2, zPos + roomD / 2 + 3.1);
      col.castShadow = true;
      building.add(col);
    });

    // Mái dốc tôn xanh lam nằm ngang (Hip Roof)
    const roofB = this.createHipRoofMesh(36.5, roomD + 4.2, 3.2, 0.8, 0x1d4ed8);
    roofB.position.set(-25.65, 4 * floorH, zPos + 1.5);
    building.add(roofB);

    // Băng rôn khẩu hiệu đỏ chữ vàng chuẩn ảnh drone: "TIÊN HỌC LỄ - HẬU HỌC VĂN"
    const bannerB = this.createSloganBanner("TIÊN HỌC LỄ - HẬU HỌC VĂN", -25.65, 11.2, zPos + roomD / 2 + 3.3, 15, 1.3, 0);
    building.add(bannerB);

    // Đầu hồi bên trái (X = -43.8): Tường có lưới ô vuông thông gió màu trắng/xám
    const ventTexLeft = this.createVentilationTexture(3, 5);
    const ventWallLeft = new THREE.Mesh(
      new THREE.PlaneGeometry(roomD, 4 * floorH * 0.8),
      new THREE.MeshStandardMaterial({ map: ventTexLeft, side: THREE.DoubleSide })
    );
    ventWallLeft.position.set(-43.8, (4 * floorH) / 2, zPos);
    ventWallLeft.rotation.y = -Math.PI / 2;
    building.add(ventWallLeft);

    this.scene.add(building);
    this.buildingGroups.push(building);
  }

  // 3. KHỐI TRUNG TÂM (ĐÃ GỠ BỎ: Thực tế đằng sau mái chóp tam giác không có dãy tòa nào, chỉ có dầm hành lang, cột đỏ, mái vòm sắt, cây xanh và bầu trời thoáng đãng - chuẩn ảnh 1, 3, 4)
  buildCenterBuilding() {
    // Không dựng khối nhà trung tâm để phản ánh chính xác 100% hình ảnh thực tế (Hình 1, 3, 4)
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
      // Tầng trệt (fl_0) - Cân bằng đồng nhất kết thúc tại X = 39.0
      {
        floor: 0,
        label: "Tầng trệt",
        rooms: [
          { isStair: true },
          { name: "P. Y TẾ", locId: "phong_y_te", w: 5.2, color: 0xfee2e2, stroke: '#ef4444', textColor: '#b91c1c', subtext: "Sơ cấp cứu" },
          { name: "TN LÝ", locId: "bm_tret_ly", w: 7.8, color: 0xfef3c7, stroke: '#d97706', textColor: '#b45309', subtext: "Thí nghiệm Vật lý" },
          { name: "TN HÓA", locId: "bm_tret_hoa", w: 7.8, color: 0xfef3c7, stroke: '#d97706', textColor: '#b45309', subtext: "Thí nghiệm Hóa học" },
          { name: "WC", locId: "wc_bm_tret", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 2 (fl_1)
      {
        floor: 1,
        label: "Tầng 2",
        rooms: [
          { isStair: true },
          { name: "P. GDQP", locId: "bm_t2_qp", w: 5.1, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Thể dục QP" },
          { name: "VP ĐOÀN", locId: "vp_doan", w: 5.1, color: 0xe0f2fe, stroke: '#38bdf8', textColor: '#0369a1', subtext: "Đoàn thanh niên" },
          { name: "TIN HỌC 1", locId: "tin_hoc_1", w: 5.1, color: 0xede9fe, stroke: '#7c3aed', textColor: '#6d28d9', subtext: "Phòng máy 1" },
          { name: "TIN HỌC 2", locId: "tin_hoc_2", w: 5.1, color: 0xede9fe, stroke: '#7c3aed', textColor: '#6d28d9', subtext: "Phòng máy 2" },
          { name: "WC", locId: "wc_bm_t2", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 3 (fl_2)
      {
        floor: 2,
        label: "Tầng 3",
        rooms: [
          { isStair: true },
          { name: "TÂM LÝ", locId: "bm_t3_tam_ly", w: 5.1, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Tư vấn tâm lý" },
          { name: "ANH VĂN", locId: "bm_t3_anh_van", w: 5.1, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Ngoại ngữ T3" },
          { name: "P. MÁY 1", locId: "bm_t3_may1", w: 5.1, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Thực hành 1" },
          { name: "P. MÁY 2", locId: "bm_t3_may2", w: 5.1, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Thực hành 2" },
          { name: "WC", locId: "wc_bm_t3", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      },
      // Tầng 4 (fl_3)
      {
        floor: 3,
        label: "Tầng 4",
        rooms: [
          { isStair: true },
          { name: "LƯU TRỮ", locId: "bm_t4_luu_tru", w: 5.2, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Kho lưu trữ" },
          { name: "TIN HỌC 4", locId: "bm_t4_tin4", w: 7.8, color: 0xede9fe, stroke: '#7c3aed', textColor: '#6d28d9', subtext: "Phòng máy 4" },
          { name: "ANH VĂN", locId: "bm_t4_anh_van", w: 7.8, color: 0xf8fafc, stroke: '#94a3b8', textColor: '#1e293b', subtext: "Ngoại ngữ T4" },
          { name: "WC", locId: "wc_bm_t4", w: 3.5, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' }
        ]
      }
    ];

    deptFloors.forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let startX = 8;

      // Sàn hành lang gạch men kem chuẩn video thực tế
      const slabGeo = new THREE.BoxGeometry(34, 0.4, roomD + 3);
      const slabMat = new THREE.MeshStandardMaterial({ map: this.createCorridorFloorTexture(), roughness: 0.55 });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set(22.5, fl.floor * floorH, zPos + 1.5);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang: Nửa dưới bê tông vôi kem, nửa trên tay vịn thép tròn xanh dương
      const balustrade = this.createCorridorBalustrade(34, 22.5, fl.floor * floorH, zPos + roomD / 2 + 3);
      building.add(balustrade);

      fl.rooms.forEach(r => {
        if (r.isStair) {
          startX += 5.5;
          return;
        }

        const rw = r.w || roomW;
        const box = this.createRoomBlock(r.name, startX + rw / 2, y, zPos, rw, floorH * 0.9, roomD, {
          locId: r.locId || '',
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
    const stairDept = this.createStairTower(10.5, zPos, 4, floorH, 5.2, roomD + 2.5, "CẦU THANG BM", "cau_thang_bm");
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

    // Đầu hồi bên phải (X = +39.1): Tường có lưới ô vuông thông gió màu trắng/xám ốp khít đầu hồi 4 tầng
    const ventTexRight = this.createVentilationTexture(3, 5);
    const ventWallRight = new THREE.Mesh(
      new THREE.PlaneGeometry(roomD, 4 * floorH * 0.8),
      new THREE.MeshStandardMaterial({ map: ventTexRight, side: THREE.DoubleSide })
    );
    ventWallRight.position.set(39.1, (4 * floorH) / 2, zPos);
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
    const roomW = 4.0;
    const stairW = 4.0;
    const stairCenterX = -31.6; // Khớp nối cầu thang với các phòng 2 bên

    // Tầng trệt (fl_0)
    const tretRooms = [
      { name: "WC", locId: "wc_hc_tret", w: 3.2, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
      { name: "HỒ SƠ 1", locId: "phong_ho_so_1", subtext: "Lưu trữ 1", w: 4.0, color: 0xf8fafc },
      { name: "HỒ SƠ 2", locId: "phong_ho_so_2", subtext: "Lưu trữ 2", w: 4.0, color: 0xf8fafc },
      { isStair: true, w: stairW },
      { name: "PHÓ HT", locId: "phong_pho_ht", subtext: "Phó Hiệu trưởng", w: 4.0, color: 0xf8fafc },
      { name: "TRUYỀN THỐNG", locId: "phong_truyen_thong", subtext: "Phòng truyền thống", w: 4.0, color: 0xf8fafc },
      { name: "TIẾP DÂN", locId: "phong_tiep_dan", subtext: "Phòng Tiếp dân", w: 4.0, color: 0xf8fafc }
    ];

    // Tầng 2 (fl_1)
    const t2Rooms = [
      { name: "WC", locId: "wc_hc_t2", w: 3.2, color: 0xccfbf1, textColor: '#0f766e', stroke: '#0d9488' },
      { name: "HIỆU TRƯỞNG", locId: "phong_hieu_truong", subtext: "Phòng Hiệu trưởng", w: 4.0, color: 0xf8fafc },
      { name: "VĂN THƯ", locId: "phong_van_thu", subtext: "Văn thư - Hành chính", w: 4.0, color: 0xf8fafc },
      { isStair: true, w: stairW },
      { name: "KẾ TOÁN", locId: "phong_ke_toan", subtext: "Phòng Kế toán", w: 4.0, color: 0xf8fafc },
      { name: "CHI BỘ (HỌP GV)", locId: "phong_chi_bo", subtext: "Phòng họp GV", w: 8.2, color: 0xfef3c7, stroke: '#d97706', textColor: '#b45309' }
    ];

    // Vẽ 2 tầng nằm ngang, liên tục không có khoảng trống
    [
      { floor: 0, rooms: tretRooms },
      { floor: 1, rooms: t2Rooms }
    ].forEach(fl => {
      const y = fl.floor * floorH + floorH / 2;
      let curX = -45.4;

      // Sàn hành lang trước gạch men kem chuẩn video thực tế
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(29.0, 0.4, roomD + 2.8),
        new THREE.MeshStandardMaterial({ map: this.createCorridorFloorTexture(), roughness: 0.55 })
      );
      slab.position.set(-31.2, fl.floor * floorH, zPos + 1.4);
      slab.receiveShadow = true;
      building.add(slab);

      // Lan can hành lang tầng 2: Tường bê tông kem + tay vịn xanh dương
      if (fl.floor === 1) {
        const balustrade = this.createCorridorBalustrade(29.0, -31.2, fl.floor * floorH, zPos + roomD / 2 + 2.8);
        building.add(balustrade);
      }

      fl.rooms.forEach(r => {
        if (r.isStair) {
          curX += (r.w || stairW) + 0.2;
          return;
        }
        const rw = r.w || roomW;
        const box = this.createRoomBlock(r.name, curX + rw / 2, y, zPos, rw, floorH * 0.9, roomD, {
          locId: r.locId || '',
          color: r.color || 0xffffff,
          textColor: r.textColor || '#1e293b',
          stroke: r.stroke || '#94a3b8',
          subtext: r.subtext || '',
          floorKey: `fl_${fl.floor}`,
          isTeacherBuilding: true,
          noClassPrefix: true
        });
        building.add(box);
        curX += rw + 0.2;
      });
    });

    // Cầu thang Dãy Hành Chính khít liền mạch với phòng 2 bên
    const adminStair = this.createStairTower(stairCenterX, zPos, 2, floorH, stairW, roomD + 2.2, "CẦU THANG HC", "cau_thang_hc");
    building.add(adminStair);

    // Cột hiên đỏ gạch mặt tiền Dãy Hành Chính đặt CHUẨN XÁC tại vách ngăn giữa các phòng
    const redColAdmin = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    const colDividers = [-45.4, -42.1, -37.9, -33.7, -29.5, -25.3, -21.1, -16.9];
    colDividers.forEach(cx => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2 * floorH, 0.45), redColAdmin);
      col.position.set(cx, floorH, zPos + roomD / 2 + 2.6);
      col.castShadow = true;
      building.add(col);
    });
    // Cột tầng trệt giữa Phòng Truyền Thống và Tiếp Dân (chỉ cao 1 tầng, không chắn phòng Chi bộ tầng 2)
    const midTretCol = new THREE.Mesh(new THREE.BoxGeometry(0.45, floorH, 0.45), redColAdmin);
    midTretCol.position.set(-21.1, floorH / 2, zPos + roomD / 2 + 2.6);
    midTretCol.castShadow = true;
    building.add(midTretCol);

    // Mái dốc tôn xanh lam nằm ngang (Hip Roof) trùm trọn vẹn toàn bộ các phòng và hành lang (không lấn sang cột cờ)
    const roofAdmin = this.createHipRoofMesh(29.6, roomD + 4.0, 2.8, 0.8, 0x1d4ed8);
    roofAdmin.position.set(-31.2, 2 * floorH, zPos + 1.4);
    building.add(roofAdmin);

    // Hành lang có mái che xanh chạy dọc từ mép trái ra phía Cổng trường (chuẩn ảnh drone)
    const walkwayGeo = new THREE.BoxGeometry(3.6, 0.25, 22);
    const walkwayMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 });
    const walkway = new THREE.Mesh(walkwayGeo, walkwayMat);
    walkway.position.set(-45.8, 0.12, 31);
    walkway.receiveShadow = true;
    walkway.userData = { id: "loi_vao_hanh_chinh", locId: "loi_vao_hanh_chinh", name: "Lối vào Dãy Hành Chính", floorKey: 'fl_0' };
    this.interactiveRooms.push(walkway);
    building.add(walkway);

    const walkwayCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.2, 22),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 })
    );
    walkwayCanopy.position.set(-45.8, 2.6, 31);
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

    // 2. MÁI VÒM CONG LỚN MÀU XANH LAM (Đặt gọn gàng trên nóc, không nhô ra che mặt tiền)
    const domeRoof = this.createCurvedDomeRoof(hallW + 1.0, hallD, 3.2, 0x1d4ed8);
    domeRoof.position.set(hallX, hallH, hallZ - 0.4);
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

    // 4. SẢNH ĐÓN TIẾP MẶT TIỀN & BIỂN TÊN HỘI TRƯỜNG KHÔNG BỊ MÁI CHE
    // Khối tường trán sảnh đón tiếp vươn ra phía trước mặt tiền
    const porticoWall = new THREE.Mesh(
      new THREE.BoxGeometry(11.6, 4.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
    );
    porticoWall.position.set(hallX, 2.2, hallZ + hallD / 2 + 0.35);
    porticoWall.castShadow = true;
    building.add(porticoWall);

    // Khung viền đỏ trang trọng của biển hiệu
    const porticoFrame = new THREE.Mesh(
      new THREE.BoxGeometry(10.8, 2.6, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 })
    );
    porticoFrame.position.set(hallX, 3.4, hallZ + hallD / 2 + 0.55);
    building.add(porticoFrame);

    // Biển chữ HỘI TRƯỜNG lớn và sắc nét ở mặt tiền (Hướng Nam - Ra cổng trường)
    const hallLabelTex = this.createCanvasLabel(
      "HỘI TRƯỜNG",
      "Khu sinh hoạt chung & Đại hội",
      "#ffffff",
      "#1e40af",
      "#2563eb",
      480,
      160
    );
    const hallSignMat = new THREE.MeshBasicMaterial({ map: hallLabelTex, transparent: true });

    // Biển mặt tiền duy nhất phía Nam (trang trọng, sắc nét, không bị tách đôi)
    const hallFrontSign = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 2.4), hallSignMat);
    hallFrontSign.position.set(hallX, 3.4, hallZ + hallD / 2 + 0.7);
    building.add(hallFrontSign);

    // Cửa chính kính màu xanh sẫm dưới biển hiệu
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.5 });
    const mainDoor = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.2, 0.15), doorMat);
    mainDoor.position.set(hallX, 1.1, hallZ + hallD / 2 + 0.62);
    building.add(mainDoor);

    // Mái hiên che sảnh đón tiếp phía trước cửa chính
    const entranceCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 0.25, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 })
    );
    entranceCanopy.position.set(hallX, 2.25, hallZ + hallD / 2 + 1.4);
    building.add(entranceCanopy);

    // Biển mặt hông phía Tây (Hướng ra sân trường trung tâm & cột cờ)
    const hallSideSign = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 3.0), hallSignMat);
    hallSideSign.position.set(hallX - hallW / 2 - 0.2, 3.6, hallZ);
    hallSideSign.rotation.y = -Math.PI / 2;
    building.add(hallSideSign);

    // Đăng ký tương tác click chọn phòng cho Hội Trường
    const hallUserData = {
      id: "hoi_truong",
      locId: "hoi_truong",
      name: "HỘI TRƯỜNG",
      floorKey: 'fl_0',
      info: "Hội trường lớn mái vòm xanh - Nơi diễn ra các buổi đại hội, lễ mít tinh & hoạt động chung của trường"
    };
    hallFrontSign.userData = hallUserData;
    hallSideSign.userData = hallUserData;
    body.userData = hallUserData;
    this.interactiveRooms.push(hallFrontSign);
    this.interactiveRooms.push(hallSideSign);
    this.interactiveRooms.push(body);

    // Khối WC Hội Trường (chuẩn sơ đồ 2D và thực tế)
    const wcHallBlock = this.createRoomBlock("WC", hallX + hallW / 2 + 1.8, 1.8, hallZ + 2, 3.2, 3.4, 4.0, {
      locId: "wc_hoi_truong",
      color: 0xccfbf1,
      textColor: '#0f766e',
      stroke: '#0d9488',
      floorKey: 'fl_0',
      info: "Nhà vệ sinh cạnh Hội Trường"
    });
    building.add(wcHallBlock);

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

  // 7. CÁC HÀNH LANG KẾT NỐI TOÀN TRƯỜNG
  buildWestConnectingBridges() {
    const westBridgeGroup = new THREE.Group();
    westBridgeGroup.name = "Hệ Thống Hành Lang Nối Toàn Trường";
    const floorH = 3.6;
    const corridorFloorTex = this.createCorridorFloorTexture();

    // -------------------------------------------------------------
    // A. CẦU HÀNH LANG TẦNG TRỆT NỐI DÃY B SANG DÃY HÀNH CHÍNH (ĐỐI DIỆN CỬA 12A9)
    // -------------------------------------------------------------
    const bridgeX = -20.1; // Trục thẳng tâm lớp 12A9 & 12A5 (Tòa 3) sang Tiếp dân & Chi bộ (Tòa GV)
    const groundWalkway = new THREE.Group();
    // Sàn gạch men kem
    const gFloor = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.25, 15),
      new THREE.MeshStandardMaterial({ map: corridorFloorTex, roughness: 0.6 })
    );
    gFloor.position.set(bridgeX, 0.12, 7);
    gFloor.receiveShadow = true;
    groundWalkway.add(gFloor);

    // Lan can hành lang: Nửa dưới bê tông vôi kem, nửa trên tay vịn thép tròn màu xanh dương (chuẩn video thực tế)
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0xfaf7ee, roughness: 0.6 });
    const bluePipeMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6, roughness: 0.35 });
    [-1.85, 1.85].forEach(sideX => {
      // Tường lan can bê tông kem cao 0.65m
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 15), parapetMat);
      wall.position.set(bridgeX + sideX, 0.45, 7);
      groundWalkway.add(wall);

      // Ống thép tròn xanh tay vịn trên cùng cao 0.95m
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 15, 16), bluePipeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(bridgeX + sideX, 0.85, 7);
      groundWalkway.add(pipe);
    });

    // Mái che tôn vòm màu xanh dương chống mưa nắng
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.2, 15),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 })
    );
    canopy.position.set(bridgeX, 2.7, 7);
    groundWalkway.add(canopy);

    // Cột trụ vuông màu đỏ gạch đặc trưng trường học THPT Tam Phước
    const redColMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65 });
    [-1.75, 1.75].forEach(px => {
      [1, 7, 13].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.7, 0.35), redColMat);
        pillar.position.set(bridgeX + px, 1.35, pz);
        pillar.castShadow = true;
        groundWalkway.add(pillar);
      });
    });

    // Biển định danh 3D cho hành lang trệt
    const gLabelMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("HÀNH LANG TẦNG TRỆT", "12A9 (Tòa 3) ➔ Tiếp dân (Hành chính)", "#ffffff", "#0284c7", "#38bdf8", 420, 150),
      transparent: true
    });
    const gLabel = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.0), gLabelMat);
    gLabel.position.set(bridgeX, 1.5, 7);
    gLabel.rotation.y = -Math.PI / 2;
    groundWalkway.add(gLabel);

    westBridgeGroup.add(groundWalkway);

    // -------------------------------------------------------------
    // B. CẦU HÀNH LANG TẦNG 2 NỐI DÃY B SANG DÃY HÀNH CHÍNH (ĐỐI DIỆN CỬA 12A5)
    // -------------------------------------------------------------
    const skybridge = new THREE.Group();
    const bridgeY = floorH;

    // Mặt sàn cầu tầng 2 lát gạch men kem
    const bFloor = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.3, 15),
      new THREE.MeshStandardMaterial({ map: corridorFloorTex, roughness: 0.5 })
    );
    bFloor.position.set(bridgeX, bridgeY, 7);
    bFloor.castShadow = true;
    bFloor.receiveShadow = true;
    skybridge.add(bFloor);

    // Lan can cầu vượt tầng 2: Tường bê tông kem + tay vịn ống thép xanh dương (chuẩn video)
    [-1.85, 1.85].forEach(sideX => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.75, 15), parapetMat);
      wall.position.set(bridgeX + sideX, bridgeY + 0.52, 7);
      skybridge.add(wall);

      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 15, 16), bluePipeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(bridgeX + sideX, bridgeY + 0.98, 7);
      skybridge.add(pipe);
    });

    // Cột trụ đỏ đỡ mái cầu trên cao
    [-1.75, 1.75].forEach(px => {
      [1, 7, 13].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 0.35), redColMat);
        pillar.position.set(bridgeX + px, bridgeY + 1.4, pz);
        pillar.castShadow = true;
        skybridge.add(pillar);
      });
    });

    // Mái che cầu trên cao
    const bridgeRoof = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.25, 15),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 })
    );
    bridgeRoof.position.set(bridgeX, bridgeY + 2.8, 7);
    skybridge.add(bridgeRoof);

    // Biển CẦU HÀNH LANG TẦNG 2
    const skyLabelMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("🪜 CẦU HÀNH LANG TẦNG 2", "12A5 (Tòa 3) ➔ Phòng Chi bộ", "#1e40af", "#ffffff", "#60a5fa", 420, 150),
      transparent: true
    });
    const skyLabel = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.0), skyLabelMat);
    skyLabel.position.set(bridgeX, bridgeY + 1.4, 7);
    skyLabel.rotation.y = -Math.PI / 2;
    skybridge.add(skyLabel);

    westBridgeGroup.add(skybridge);

    // -------------------------------------------------------------
    // C. CÁNH TÒA NHÀ 4 TẦNG KẾT NỐI LIỀN MẠCH GIỮA DÃY A VÀ DÃY B / BỘ MÔN
    // -------------------------------------------------------------
    const westConnectWing = this.createConnectingWingBlock(-22.5, -28.0, -8.0, true);
    westBridgeGroup.add(westConnectWing);

    const eastConnectWing = this.createConnectingWingBlock(22.5, -28.0, -8.0, false);
    westBridgeGroup.add(eastConnectWing);

    this.scene.add(westBridgeGroup);
    this.corridorObjects.push(westBridgeGroup);
  }

  // Phương thức xây dựng cánh tòa nhà 4 tầng kết nối giữa các dãy nhà (theo ảnh drone thực tế)
  createConnectingWingBlock(centerX, zStart, zEnd, isWest = true) {
    const wing = new THREE.Group();
    const floorH = 3.6;
    const depth = Math.abs(zEnd - zStart); // 20m
    const centerZ = (zStart + zEnd) / 2;   // -18m
    const width = 6.4;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
    const corridorSlabMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.6 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3 });
    const redColMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.5 });

    // 4 tầng liên hoàn nối từ Dãy A sang Dãy trước
    for (let f = 0; f < 4; f++) {
      const baseY = f * floorH;

      // Sàn hành lang kết nối (màu vàng be nhạt liền mạch)
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.38, depth + 1.2),
        corridorSlabMat
      );
      slab.position.set(centerX, baseY, centerZ);
      slab.receiveShadow = true;
      slab.userData = { floorKey: `fl_${f}` };
      wing.add(slab);

      // Tường ngoài của dãy kết nối (hướng ra ngoài khuôn viên trường)
      const wallX = isWest ? (centerX - width / 2 + 0.25) : (centerX + width / 2 - 0.25);
      const outerWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, floorH * 0.92, depth),
        wallMat
      );
      outerWall.position.set(wallX, baseY + floorH / 2, centerZ);
      outerWall.castShadow = true;
      outerWall.receiveShadow = true;
      outerWall.userData = { floorKey: `fl_${f}` };
      wing.add(outerWall);

      // Các ô cửa sổ kính xanh dọc theo tường ngoài
      for (let zw = zStart + 3.0; zw <= zEnd - 2.5; zw += 4.5) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), windowMat);
        win.position.set(isWest ? (wallX - 0.28) : (wallX + 0.28), baseY + floorH / 2 + 0.2, zw);
        win.rotation.y = isWest ? -Math.PI / 2 : Math.PI / 2;
        win.userData = { floorKey: `fl_${f}` };
        wing.add(win);
      }

      // Lan can hành lang bảo vệ hướng vào sân trong
      const railX = isWest ? (centerX + width / 2 - 0.15) : (centerX - width / 2 + 0.15);
      const railing = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.9, depth),
        railMat
      );
      railing.position.set(railX, baseY + 0.5, centerZ);
      railing.userData = { floorKey: `fl_${f}` };
      wing.add(railing);

      // Các trụ cột đỏ gạch vững chắc chạy đều dọc theo hành lang
      for (let zc = zStart + 1.5; zc <= zEnd - 1.0; zc += 4.5) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.48, floorH, 0.48), redColMat);
        col.position.set(railX, baseY + floorH / 2, zc);
        col.castShadow = true;
        col.userData = { floorKey: `fl_${f}` };
        wing.add(col);
      }
    }

    // Ô lưới thông gió vuông đặc trưng đầu hồi kết nối
    const ventTex = this.createVentilationTexture(2, 4);
    const ventMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.7, 4 * floorH * 0.65),
      new THREE.MeshStandardMaterial({ map: ventTex, side: THREE.DoubleSide })
    );
    ventMesh.position.set(isWest ? (centerX - width / 2 - 0.05) : (centerX + width / 2 + 0.05), (4 * floorH) / 2, centerZ);
    ventMesh.rotation.y = isWest ? -Math.PI / 2 : Math.PI / 2;
    wing.add(ventMesh);

    // MÁI TÔN XANH LAM KẾT NỐI LIỀN MẠCH TRÊN ĐỈNH TẦNG 4
    // Nối trực tiếp từ đỉnh Dãy Sau (Dãy A) đến đỉnh Dãy Trước, tạo khối chữ U/E khép kín chuẩn ảnh drone
    const connectRoof = this.createHipRoofMesh(width + 1.0, depth + 2.5, 3.2, 0.8, 0x1d4ed8);
    connectRoof.position.set(centerX, 4 * floorH, centerZ);
    wing.add(connectRoof);

    return wing;
  }

  // 6. MÁI CHE KIM TỰ THÁP XANH & LỄ ĐÀI CHÀO CỜ SÂN TRƯỜNG (CHUẨN ẢNH 1, 3, 4 THỰC TẾ)
  buildCentralCanopyAndFlag() {
    const landmarkGroup = new THREE.Group();
    landmarkGroup.name = "Mái Che Tam Giác & Cột Cờ";

    // -------------------------------------------------------------
    // A. MÁI CHE KIM TỰ THÁP XANH & LỄ ĐÀI CHÀO CỜ SÂN TRƯỜNG
    // -------------------------------------------------------------
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(0, 0, -2);

    // 1. SÀN SÂN KHẤU LỄ ĐÀI: GẠCH LÁT MEN TRẮNG ĐỒNG NHẤT VÀ BẬC TAM CẤP BÁN NGUYỆT TOÀN PHẦN (CHUẨN ẢNH THỰC TẾ)
    // Vật liệu gạch men trắng sáng bóng thống nhất toàn bộ sàn lễ đài (chuẩn ảnh thực tế trường học)
    const stageTileTex = this.createWhiteTileTexture();
    const stageTileMat = new THREE.MeshStandardMaterial({
      map: stageTileTex,
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05
    });

    // A. Khối sàn chữ nhật phía sau dưới mái che (từ z = -3.8 đến z = 0, rộng 9.2m, cao 0.66m, mặt sàn ở y = 0.66m)
    const stageRearGeo = new THREE.BoxGeometry(9.2, 0.66, 3.8);
    const stageRear = new THREE.Mesh(stageRearGeo, stageTileMat);
    stageRear.position.set(0, 0.33, -1.9);
    stageRear.receiveShadow = true;
    canopyGroup.add(stageRear);

    // B. Các bậc tam cấp bán nguyệt toàn phần đối xứng hai bên vươn ra sân trường (z >= 0, thetaStart = -Math.PI / 2, thetaLength = Math.PI)
    // Bậc 1 (dưới cùng): Bán kính 7.0m, cao 0.22m (mặt bậc ở y = 0.22m)
    const stageBase1 = new THREE.Mesh(
      new THREE.CylinderGeometry(6.6, 7.0, 0.22, 48, 1, false, -Math.PI / 2, Math.PI),
      stageTileMat
    );
    stageBase1.position.set(0, 0.11, 0);
    stageBase1.receiveShadow = true;
    canopyGroup.add(stageBase1);

    // Bậc 2: Bán kính 5.8m, cao 0.22m (mặt bậc ở y = 0.44m)
    const stageBase2 = new THREE.Mesh(
      new THREE.CylinderGeometry(5.4, 5.8, 0.22, 48, 1, false, -Math.PI / 2, Math.PI),
      stageTileMat
    );
    stageBase2.position.set(0, 0.33, 0);
    stageBase2.receiveShadow = true;
    canopyGroup.add(stageBase2);

    // Bậc 3 (Sàn chính bán nguyệt): Bán kính 4.6m, cao 0.22m (mặt sàn ở y = 0.66m, khớp liền mạch hoàn hảo với sàn chữ nhật phía sau)
    const stageBase3 = new THREE.Mesh(
      new THREE.CylinderGeometry(4.4, 4.6, 0.22, 48, 1, false, -Math.PI / 2, Math.PI),
      stageTileMat
    );
    stageBase3.position.set(0, 0.55, 0);
    stageBase3.receiveShadow = true;
    canopyGroup.add(stageBase3);

    // Chậu cây kiểng và hoa trang trí chân lễ đài đặt đối xứng trên mặt sân trước bậc 1
    [-7.6, -6.0, 6.0, 7.6].forEach(px => {
      canopyGroup.add(this.createPottedPlant(px, 0.8, 0));
    });

    // 2. VÁCH PHÔNG LỄ ĐÀI CHÀO CỜ (MẶT TRƯỚC VẢI ĐỎ BÚA LIỀM, MẶT SAU KHUNG SẮT ĐEN - CHUẨN ẢNH 1, 3, 4)
    const backdropGroup = new THREE.Group();
    backdropGroup.position.set(0, 0.7, -1.6);

    // Tấm phông vách sân khấu
    const backdropGeo = new THREE.BoxGeometry(8.2, 3.8, 0.16);
    // Vật liệu mặt trước (vải đỏ lễ tân cờ búa liềm sao vàng - chuẩn ảnh 3)
    const backdropFrontTex = this.createStageBackdropTexture();
    const backdropFrontMat = new THREE.MeshStandardMaterial({ map: backdropFrontTex, roughness: 0.65 });
    // Vật liệu mặt sau (khung kim loại sơn đen/xám sẫm chịu lực - chuẩn ảnh 1 & 4)
    const backdropBackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
    const backdropSidesMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

    const backdropMaterials = [
      backdropSidesMat, // phải
      backdropSidesMat, // trái
      backdropSidesMat, // trên
      backdropSidesMat, // dưới
      backdropFrontMat, // trước (+Z)
      backdropBackMat   // sau (-Z - chuẩn ảnh 1 và 4)
    ];
    const backdropMesh = new THREE.Mesh(backdropGeo, backdropMaterials);
    backdropMesh.position.y = 1.9;
    backdropMesh.castShadow = true;
    backdropGroup.add(backdropMesh);

    // Khung xương thép hộp đen gia cố mặt sau vách phông (chuẩn ảnh 1 và 4)
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.35 });
    [-3.8, -1.9, 0, 1.9, 3.8].forEach(sx => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.8, 0.12), darkSteelMat);
      rib.position.set(sx, 1.9, -0.12);
      backdropGroup.add(rib);
    });

    // Ghế đá trường học đặt cạnh vách phông lễ đài (chuẩn ảnh 1 và 4)
    const bench = this.createStoneBenchMesh(-2.6, 0.35, -0.8, -0.15);
    backdropGroup.add(bench);

    canopyGroup.add(backdropGroup);

    // 3. CỘT TRỤ SÂN KHẤU NÂNG ĐỠ DẦM (CHUẨN ẢNH 2 & 3: CỘT ĐẶT DƯỚI DẦM, TUYỆT ĐỐI KHÔNG ĐÂM THỦNG MÁI)
    const redColMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65 });
    // Hai cột tròn nâng đỡ cổng vòm mặt tiền
    [-4.8, 4.8].forEach(cx => {
      const frontPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 4.4, 18), redColMat);
      frontPillar.position.set(cx, 2.2, 1.3);
      frontPillar.castShadow = true;
      canopyGroup.add(frontPillar);
    });

    // Hai cột tròn nâng đỡ phía sau sân khấu
    [-4.8, 4.8].forEach(cx => {
      const rearPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 4.4, 18), redColMat);
      rearPillar.position.set(cx, 2.2, -4.2);
      rearPillar.castShadow = true;
      canopyGroup.add(rearPillar);
    });

    // 4. MÁI CHE TAM GIÁC KIM TỰ THÁP XANH DƯƠNG (CHUẨN ẢNH 2 & 3)
    // Tọa độ chóp kim tự tháp và 4 góc mép mái
    const apexPos = new THREE.Vector3(0, 9.6, -1.0);
    const pFL = new THREE.Vector3(-5.2, 4.8, 1.3);
    const pFR = new THREE.Vector3(5.2, 4.8, 1.3);
    const pRR = new THREE.Vector3(5.2, 4.8, -4.4);
    const pRL = new THREE.Vector3(-5.2, 4.8, -4.4);

    // Vật liệu tấm lợp Polycarbonate lấy sáng màu xanh lam óng ánh (chuẩn ảnh 2 & 3)
    const polyTex = this.createPolycarbonateRoofTexture();
    const polyRoofMat = new THREE.MeshStandardMaterial({
      map: polyTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.90,
      roughness: 0.22,
      metalness: 0.25,
      side: THREE.DoubleSide
    });

    // Khối mái chóp 4 mặt với UV vân tấm poly chuẩn
    const roofMesh = this.createPyramidCanopyRoof(apexPos, pFL, pFR, pRR, pRL, polyRoofMat);
    canopyGroup.add(roofMesh);

    // 4 đường sống mái kim loại xanh sáng chạy từ đỉnh chóp xuống 4 góc mái (chuẩn ảnh 2 & 3)
    [pFL, pFR, pRR, pRL].forEach(corner => {
      const ridge = this.createRidgeBeam(apexPos, corner, 0.08, 0x0284c7);
      canopyGroup.add(ridge);
    });

    // Dầm đỡ mặt tiền & viền mép mái
    const eaveMat = new THREE.MeshStandardMaterial({ color: 0x0f2e5a, metalness: 0.6, roughness: 0.35 });
    const frontBeam = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.35, 0.35), eaveMat);
    frontBeam.position.set(0, 4.45, 1.3);
    canopyGroup.add(frontBeam);

    // Dầm đỡ hông trái & phải
    [-5.2, 5.2].forEach(sideX => {
      const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 5.7), eaveMat);
      sideBeam.position.set(sideX, 4.65, -1.55);
      canopyGroup.add(sideBeam);
    });

    // Dầm đỡ phía sau
    const rearEaveBeam = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.3, 0.3), eaveMat);
    rearEaveBeam.position.set(0, 4.65, -4.4);
    canopyGroup.add(rearEaveBeam);

    // Đỉnh chóp nhọn trang trí (Apex Cap) & Cột thu lôi inox (chuẩn ảnh 2 & 3)
    const apexCap = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 0.9, 4),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.5 })
    );
    apexCap.rotation.y = Math.PI / 4;
    apexCap.position.set(apexPos.x, apexPos.y + 0.45, apexPos.z);
    canopyGroup.add(apexCap);

    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9, roughness: 0.1 })
    );
    spire.position.set(apexPos.x, apexPos.y + 1.45, apexPos.z);
    canopyGroup.add(spire);

    // Băng rôn đỏ chữ vàng mặt tiền lễ đài: "ĐẢNG CỘNG SẢN VIỆT NAM QUANG VINH MUÔN NĂM" (chuẩn ảnh 2 & 3)
    // Đặt ở độ cao 4.05m ngay trên dầm mặt tiền, để hở hoàn toàn khoảng không gian phía dưới cho khán giả nhìn vào sân khấu
    const bannerSlogan = this.createSloganBanner("ĐẢNG CỘNG SẢN VIỆT NAM QUANG VINH MUÔN NĂM", 0, 4.05, 1.38, 9.8, 0.8, 0);
    canopyGroup.add(bannerSlogan);

    // Dây cờ tam giác đỏ vàng trang trí lễ đài giăng theo vòm mái (chuẩn ảnh 2 & 3)
    const buntingGroup = this.createFrontFestiveBunting(pFL, pFR, apexPos);
    canopyGroup.add(buntingGroup);

    // 5. BỐN CHÂN TRỤ MÁI DỐC XIÊN POLYCARBONATE XANH (CHUẨN ẢNH THỰC TẾ & YÊU CẦU NGƯỜI DÙNG)
    // 2 chân trước nhô ra trước sân trường (vượt ra trước hàng cột đỏ, không cắt vào hành lang/phòng học)
    // 2 chân sau nhô ra sân phía sau lễ đài
    
    // Chân trước - Trái: Bắt đầu từ góc trước trái vươn ra phía trước sân trường
    const topInFL = new THREE.Vector3(-4.2, 4.8, 1.3);
    const topOutFL = new THREE.Vector3(-5.4, 4.8, 0.5);
    const botInFL = new THREE.Vector3(-6.0, 0.15, 6.4);
    const botOutFL = new THREE.Vector3(-7.2, 0.15, 5.6);
    const frontLeftChute = this.createCanopyRampChute(topInFL, topOutFL, botInFL, botOutFL, polyRoofMat, -1);
    canopyGroup.add(frontLeftChute);

    // Chân trước - Phải: Bắt đầu từ góc trước phải vươn ra phía trước sân trường
    const topInFR = new THREE.Vector3(4.2, 4.8, 1.3);
    const topOutFR = new THREE.Vector3(5.4, 4.8, 0.5);
    const botInFR = new THREE.Vector3(6.0, 0.15, 6.4);
    const botOutFR = new THREE.Vector3(7.2, 0.15, 5.6);
    const frontRightChute = this.createCanopyRampChute(topInFR, topOutFR, botInFR, botOutFR, polyRoofMat, 1);
    canopyGroup.add(frontRightChute);

    // Chân sau - Trái: Bắt đầu từ góc sau trái vươn dốc ra sân phía sau
    const topInRL = new THREE.Vector3(-4.2, 4.8, -4.4);
    const topOutRL = new THREE.Vector3(-5.4, 4.8, -3.6);
    const botInRL = new THREE.Vector3(-6.0, 0.15, -9.5);
    const botOutRL = new THREE.Vector3(-7.2, 0.15, -8.7);
    const rearLeftChute = this.createCanopyRampChute(topInRL, topOutRL, botInRL, botOutRL, polyRoofMat, -1);
    canopyGroup.add(rearLeftChute);

    // Chân sau - Phải: Bắt đầu từ góc sau phải vươn dốc ra sân phía sau
    const topInRR = new THREE.Vector3(4.2, 4.8, -4.4);
    const topOutRR = new THREE.Vector3(5.4, 4.8, -3.6);
    const botInRR = new THREE.Vector3(6.0, 0.15, -9.5);
    const botOutRR = new THREE.Vector3(7.2, 0.15, -8.7);
    const rearRightChute = this.createCanopyRampChute(topInRR, topOutRR, botInRR, botOutRR, polyRoofMat, 1);
    canopyGroup.add(rearRightChute);

    // Chậu cây kiểng bonsai thế lớn đặt cạnh 2 chân trụ phía trước trên sân trường (Chuẩn ảnh 2 & 3 thực tế)
    canopyGroup.add(this.createLargeBonsaiPot(-8.2, 0, 6.0));
    canopyGroup.add(this.createLargeBonsaiPot(8.2, 0, 6.0));

    // 6. DẦM HÀNH LANG KẾT NỐI VÀ CÁC CỘT TRỤ ĐỎ GẠCH NẰM NGAY SAU LỄ ĐÀI (CHUẨN ẢNH 1 & 4)
    // Dầm đỡ bê tông nằm ngang chạy dài ở độ cao 4.2m kết nối giữa Cánh Trái (Dãy B) và Cánh Phải (Dãy Bộ Môn)
    const rearBeamGroup = new THREE.Group();
    rearBeamGroup.position.set(0, 0, -3.8);

    // Sàn dầm hành lang trên cao rộng 3.0m
    const beamFloor = new THREE.Mesh(
      new THREE.BoxGeometry(48, 0.4, 3.2),
      new THREE.MeshStandardMaterial({ map: this.createCorridorFloorTexture(), roughness: 0.55 })
    );
    beamFloor.position.set(0, 4.2, 0);
    beamFloor.castShadow = true;
    beamFloor.receiveShadow = true;
    rearBeamGroup.add(beamFloor);

    // Lan can dầm hành lang trên cao: Tường bê tông kem + tay vịn thép tròn xanh dương (chuẩn ảnh 1 & 4)
    const parapetBeamL = this.createCorridorBalustrade(48, 0, 4.2, 1.55);
    const parapetBeamR = this.createCorridorBalustrade(48, 0, 4.2, -1.55);
    rearBeamGroup.add(parapetBeamL);
    rearBeamGroup.add(parapetBeamR);

    // Hàng cột trụ đỏ gạch chịu lực đều đặn nâng đỡ dầm hành lang (chuẩn ảnh 1 và 4)
    const redColBeamMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65 });
    const whiteRingMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    [-21, -15, -9, 9, 15, 21].forEach(colX => {
      // Cột đỏ gạch
      const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 4.2, 18), redColBeamMat);
      colMesh.position.set(colX, 2.1, 0);
      colMesh.castShadow = true;
      rearBeamGroup.add(colMesh);

      // Vòng chỉ trắng trang trí đỉnh cột (chuẩn ảnh 1 và 4)
      const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.18, 18), whiteRingMat);
      ringMesh.position.set(colX, 3.8, 0);
      rearBeamGroup.add(ringMesh);
    });

    canopyGroup.add(rearBeamGroup);

    // 7. KHU VỰC PHÍA SAU LỄ ĐÀI: SÂN SAU, CÂY XANH & HÀNG RÀO (CHUẨN ẢNH 1 & 4)
    const rearAwningGroup = new THREE.Group();
    rearAwningGroup.position.set(0, 0, -8.5);

    // B. Cây xanh bóng mát và đường nội bộ phía sau (chuẩn ảnh 1 & 4)
    [-18, -12, 12, 18].forEach(tx => {
      rearAwningGroup.add(this.createPoincianaTree(tx, -4.5, 0.85));
    });

    // C. Hàng rào ranh giới và cây cảnh xanh phía sau (chuẩn ảnh 4)
    const rearFenceGeo = new THREE.BoxGeometry(42, 1.6, 0.25);
    const rearFenceMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
    const rearFence = new THREE.Mesh(rearFenceGeo, rearFenceMat);
    rearFence.position.set(0, 0.8, -9.5);
    rearAwningGroup.add(rearFence);

    canopyGroup.add(rearAwningGroup);

    // 8. ĐĂNG KÝ THÔNG TIN ĐỊNH DANH 3D CHO MÁI TAM GIÁC (KHÔNG ĐẶT BIỂN CHE MẮT SÂN KHẤU)
    canopyGroup.name = "Mái Tam Giác";
    canopyGroup.userData = { id: "canopy_triangle", locId: "canopy_triangle", name: "Mái Tam Giác", floorKey: "g", info: "Công trình kiến trúc Mái Tam Giác giữa sân trường" };
    this.interactiveRooms.push(canopyGroup);

    landmarkGroup.add(canopyGroup);

    // -------------------------------------------------------------
    // B. CỘT CỜ TRUNG TÂM SÂN TRƯỜNG CÓ BỒN HOA TRÒN (Z = 11)
    // -------------------------------------------------------------
    const flagGroup = new THREE.Group();
    flagGroup.position.set(0, 0, 11);

    // Bồn hoa tròn viền đá bao quanh chân cột cờ (chuẩn video thực tế)
    const flowerPlanter = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.6, 0.45, 32),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
    );
    flowerPlanter.position.y = 0.22;
    flowerPlanter.receiveShadow = true;
    flagGroup.add(flowerPlanter);

    // Vành cây cảnh & hoa nở quanh chân cột cờ
    const shrubRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.0, 0.55, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
    );
    shrubRing.rotation.x = Math.PI / 2;
    shrubRing.position.y = 0.5;
    flagGroup.add(shrubRing);

    // Bục đá tam cấp chân cột
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0xcbd5e1 }));
    base1.position.y = 0.7;
    base1.receiveShadow = true;
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 32), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    base2.position.y = 1.1;
    base2.receiveShadow = true;
    flagGroup.add(base1);
    flagGroup.add(base2);

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
    const pos = flagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      pos.setZ(i, Math.sin(u * 1.8) * 0.25);
    }
    flagGeo.computeVertexNormals();

    const flagMat = new THREE.MeshStandardMaterial({
      map: this.createFlagTexture(),
      roughness: 0.4,
      side: THREE.DoubleSide
    });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(1.9, 15.5, 0);
    flagMesh.castShadow = true;
    flagGroup.add(flagMesh);

    // Biển CỘT CỜ
    const flagLblMat = new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("CỘT CỜ", "Sân trường trung tâm", "#ffffff", "#0f172a", "#64748b", 340, 140),
      transparent: true
    });
    const flagLbl = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.7), flagLblMat);
    flagLbl.position.set(0, 1.2, 4.2);
    flagGroup.add(flagLbl);

    flagGroup.userData = { id: "cot_co", locId: "cot_co", name: "Cột Cờ (Sân trường)", floorKey: "g", info: "Khu vực Cột Cờ trung tâm sân trường" };
    this.interactiveRooms.push(flagGroup);

    landmarkGroup.add(flagGroup);

    this.scene.add(landmarkGroup);
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

  // Helper tạo hoa văn gạch lát men trắng sứ sáng bóng đồng nhất cho toàn bộ sàn lễ đài (chuẩn ảnh thực tế)
  createWhiteTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Nền gạch men trắng sứ sáng bóng, sạch sẽ
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Đường ron gạch màu xám sáng tinh tế
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    const tileSize = 64; // Đại diện gạch lát 60x60cm
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  // Helper tạo hoa văn phông lễ đài chào cờ (Mặt trước: Cờ đỏ búa liềm - chuẩn ảnh 2 & 4 thực tế)
  createStageBackdropTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Nền trắng kem / xám sáng trang nhã của sân khấu (chuẩn ảnh 2 và 4 thực tế)
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 1024, 512);

    // Mảng cờ đỏ lượn sóng lễ tân bên trái
    const grad = ctx.createLinearGradient(0, 0, 480, 512);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(440, 0);
    ctx.bezierCurveTo(460, 200, 320, 360, 260, 512);
    ctx.lineTo(0, 512);
    ctx.closePath();
    ctx.fill();

    // Biểu tượng Búa Liềm vàng & Ngôi sao vàng năm cánh
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 72px "Segoe UI", sans-serif';
    ctx.fillText('☭', 90, 160);
    ctx.fillText('★', 210, 160);

    return new THREE.CanvasTexture(canvas);
  }

  // Helper tạo hoa văn tấm lợp lấy sáng Polycarbonate màu xanh lam có gân nhôm và xà gồ (Chuẩn ảnh 2 & 3)
  createPolycarbonateRoofTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 1. Nền màu xanh dương lấy sáng polycarbonate đặc trưng
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#0284c7');   // Sky blue trong trẻo
    grad.addColorStop(0.4, '#0369a1'); // Xanh đại dương
    grad.addColorStop(1, '#075985');   // Xanh thẫm nhẹ ở viền
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. Hiệu ứng ánh sáng tán xạ xuyên qua tấm poly
    const highlight = ctx.createRadialGradient(512, 360, 100, 512, 512, 640);
    highlight.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
    highlight.addColorStop(0.5, 'rgba(14, 165, 233, 0.2)');
    highlight.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = highlight;
    ctx.fillRect(0, 0, 1024, 1024);

    // 3. Các đường gân nẹp tấm poly dọc (khoảng cách 128px ~ đại diện cho các khổ tấm lợp 1m)
    for (let x = 0; x <= 1024; x += 128) {
      // Đường tối bóng viền
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();

      // Nẹp nhôm sáng nổi bật
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 1.5, 0);
      ctx.lineTo(x + 1.5, 1024);
      ctx.stroke();
    }

    // 4. Các thanh xà gồ thép giằng ngang (khoảng cách 256px)
    for (let y = 0; y <= 1024; y += 256) {
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y + 2);
      ctx.lineTo(1024, y + 2);
      ctx.stroke();

      // Đinh vít tán tại các giao điểm nẹp và xà gồ
      for (let x = 0; x <= 1024; x += 128) {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  // Helper tạo kết cấu mái chóp 4 mặt mở vòm mặt tiền cho sân khấu (Chuẩn ảnh 2 & 3)
  createPyramidCanopyRoof(apex, pFL, pFR, pRR, pRL, material) {
    const group = new THREE.Group();

    // Helper tạo tam giác mái với UV chuẩn
    const makeTri = (v0, v1, v2, uvScale = 2) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array([
        v0.x, v0.y, v0.z,
        v1.x, v1.y, v1.z,
        v2.x, v2.y, v2.z
      ]);
      const uvs = new Float32Array([
        0, 0,
        uvScale, 0,
        uvScale * 0.5, uvScale
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // 1. Mặt tam giác phía trước
    group.add(makeTri(pFL, pFR, apex, 3));
    // 2. Mặt tam giác bên phải
    group.add(makeTri(pFR, pRR, apex, 2.5));
    // 3. Mặt tam giác phía sau
    group.add(makeTri(pRR, pRL, apex, 3));
    // 4. Mặt tam giác bên trái
    group.add(makeTri(pRL, pFL, apex, 2.5));

    return group;
  }

  // Helper tạo cánh dốc xiên polycarbonate chuẩn ảnh 2 & 3
  createCanopyRampChute(topInner, topOuter, botInner, botOuter, material, side) {
    const group = new THREE.Group();

    // 1. Tấm lợp polycarbonate mặt dốc
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      topInner.x, topInner.y, topInner.z, // 0: Top-Inner
      topOuter.x, topOuter.y, topOuter.z, // 1: Top-Outer
      botOuter.x, botOuter.y, botOuter.z, // 2: Bot-Outer
      botInner.x, botInner.y, botInner.z  // 3: Bot-Inner
    ]);
    const indices = [
      0, 1, 2,
      0, 2, 3
    ];
    const uvs = new Float32Array([
      0, 3,
      1.5, 3,
      1.5, 0,
      0, 0
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const chuteMesh = new THREE.Mesh(geo, material);
    chuteMesh.castShadow = true;
    chuteMesh.receiveShadow = true;
    group.add(chuteMesh);

    // 2. Hai thanh dầm thép hộp viền mép máng dốc (mép trong và mép ngoài)
    const railColor = 0x0284c7;
    group.add(this.createRidgeBeam(topInner, botInner, 0.09, railColor));
    group.add(this.createRidgeBeam(topOuter, botOuter, 0.09, railColor));

    // 3. Các thanh giằng xà gồ ngang bên dưới máng dốc (chia làm 4 khoang)
    for (let t = 0.25; t <= 0.75; t += 0.25) {
      const pIn = new THREE.Vector3().lerpVectors(topInner, botInner, t);
      const pOut = new THREE.Vector3().lerpVectors(topOuter, botOuter, t);
      pIn.y -= 0.05;
      pOut.y -= 0.05;
      group.add(this.createRidgeBeam(pIn, pOut, 0.06, 0x1e3a8a));
    }

    // 4. Chân đế móng bê tông giữ chân máng dốc sát mặt sân gạch (chuẩn ảnh 2 & 3)
    const midTop = new THREE.Vector3().addVectors(topInner, topOuter).multiplyScalar(0.5);
    const midBot = new THREE.Vector3().addVectors(botInner, botOuter).multiplyScalar(0.5);
    const angleY = Math.atan2(midBot.x - midTop.x, midBot.z - midTop.z);

    const footing = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.35, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 })
    );
    footing.position.set(midBot.x, 0.175, midBot.z);
    footing.rotation.y = angleY;
    footing.castShadow = true;
    group.add(footing);

    // Bản mã thép neo chân máng dốc
    const steelBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.08, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    );
    steelBase.position.set(midBot.x, 0.38, midBot.z);
    steelBase.rotation.y = angleY;
    group.add(steelBase);

    return group;
  }

  // Helper tạo dây cờ tam giác đỏ vàng trang trí lễ đài giăng theo vòm mái (chuẩn ảnh 2 & 3)
  createFrontFestiveBunting(pFL, pFR, apex) {
    const buntingGroup = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.65 });

    // 1. Dải cờ võng ngang dưới dầm mặt tiền
    const numFlags = 18;
    const yBase = 4.3;
    const zBase = 1.35;
    const points = [];
    for (let i = 0; i <= numFlags; i++) {
      const alpha = i / numFlags;
      const x = THREE.MathUtils.lerp(pFL.x, pFR.x, alpha);
      const sag = Math.sin(alpha * Math.PI) * 0.42;
      const y = yBase - sag;
      const pt = new THREE.Vector3(x, y, zBase);
      points.push(pt);

      if (i > 0 && i < numFlags) {
        const triGeo = new THREE.BufferGeometry();
        const flw = 0.24;
        const flh = 0.38;
        const vertices = new Float32Array([
          x - flw / 2, y, zBase,
          x + flw / 2, y, zBase,
          x, y - flh, zBase
        ]);
        triGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        triGeo.computeVertexNormals();
        const flagMesh = new THREE.Mesh(triGeo, (i % 2 === 0 ? redMat : yellowMat));
        buntingGroup.add(flagMesh);
      }
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    buntingGroup.add(new THREE.Line(lineGeo, lineMat));

    // 2. Dải cờ dọc 2 sống mái mặt tiền
    [pFL, pFR].forEach(corner => {
      const pts = [];
      const segments = 10;
      for (let i = 0; i <= segments; i++) {
        const a = i / segments;
        const pt = new THREE.Vector3().lerpVectors(apex, corner, a);
        pt.y -= Math.sin(a * Math.PI) * 0.25;
        pt.z += 0.08;
        pts.push(pt);
        if (i > 0 && i < segments) {
          const triGeo = new THREE.BufferGeometry();
          const flw = 0.22;
          const flh = 0.32;
          const vertices = new Float32Array([
            pt.x - flw / 2, pt.y, pt.z,
            pt.x + flw / 2, pt.y, pt.z,
            pt.x, pt.y - flh, pt.z
          ]);
          triGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
          triGeo.computeVertexNormals();
          buntingGroup.add(new THREE.Mesh(triGeo, (i % 2 === 0 ? redMat : yellowMat)));
        }
      }
      buntingGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    });

    return buntingGroup;
  }

  // Helper tạo đường gân nẹp sống mái kim loại nổi bật chạy dọc các góc dốc
  createRidgeBeam(p1, p2, radius, color) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.position.copy(mid);
    mesh.castShadow = true;
    return mesh;
  }

  // Helper tạo chậu cây kiểng bonsai thế lớn đặt cạnh chân cánh dốc mái che (Chuẩn ảnh 2 & 4 thực tế)
  createLargeBonsaiPot(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Chân bệ đôn gốm màu xám/nâu
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, 0.35, 18),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 })
    );
    pedestal.position.y = 0.175;
    pedestal.castShadow = true;
    group.add(pedestal);

    // Chậu cây hình tròn màu gốm nâu đỏ đặc trưng (chuẩn ảnh 2 & 4)
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 0.85, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65 })
    );
    pot.position.y = 0.35 + 0.3;
    pot.castShadow = true;
    group.add(pot);

    // Vành chậu gốm nổi
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.08, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 })
    );
    rim.position.y = 0.95;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    // Đất trồng cây
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 0.1, 18),
      new THREE.MeshStandardMaterial({ color: 0x27170a, roughness: 0.95 })
    );
    soil.position.y = 0.88;
    group.add(soil);

    // Thân cây bonsai uốn lượn phong cách cây kiểng trường học
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.1, 8), trunkMat);
    trunk1.position.set(0, 1.45, 0);
    trunk1.rotation.z = (x > 0 ? -0.18 : 0.18);
    trunk1.castShadow = true;
    group.add(trunk1);

    const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.9, 8), trunkMat);
    trunk2.position.set((x > 0 ? -0.22 : 0.22), 2.2, 0);
    trunk2.rotation.z = (x > 0 ? 0.22 : -0.22);
    trunk2.castShadow = true;
    group.add(trunk2);

    // Các tán lá xanh tỉa tròn tầng tầng lớp lớp (chuẩn ảnh 2 & 4)
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    const pads = [
      { x: (x > 0 ? -0.45 : 0.45), y: 1.85, z: 0.15, rx: 0.75, ry: 0.28 },
      { x: (x > 0 ? 0.35 : -0.35), y: 2.15, z: -0.15, rx: 0.65, ry: 0.25 },
      { x: (x > 0 ? -0.2 : 0.2), y: 2.65, z: 0, rx: 0.95, ry: 0.35 },
      { x: 0, y: 3.05, z: 0, rx: 0.75, ry: 0.3 }
    ];

    pads.forEach((p, idx) => {
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(p.rx, p.rx * 1.1, p.ry, 14),
        idx % 2 === 0 ? leafMat : leafMat2
      );
      pad.position.set(p.x, p.y, p.z);
      pad.castShadow = true;
      group.add(pad);
    });

    return group;
  }

  // Helper tạo ghế đá trường học (Chuẩn ảnh 1 và 4)
  createStoneBenchMesh(x, y, z, rotY = 0) {
    const benchGroup = new THREE.Group();
    const benchMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });

    // Mặt ngồi ghế đá
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.65), benchMat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    seat.receiveShadow = true;
    benchGroup.add(seat);

    // Tựa lưng ghế đá
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.1), benchMat);
    back.position.set(0, 0.75, -0.28);
    back.rotation.x = -0.12;
    back.castShadow = true;
    benchGroup.add(back);

    // 2 chân trụ ghế đá
    [-0.7, 0.7].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.55), legMat);
      leg.position.set(lx, 0.225, 0);
      leg.castShadow = true;
      benchGroup.add(leg);
    });

    benchGroup.position.set(x, y, z);
    benchGroup.rotation.y = rotY;
    return benchGroup;
  }

  // Helper tạo dây cờ đuôi nheo tam giác đỏ vàng trang trí lễ đài (Chuẩn ảnh 2 & 4)
  createFlagBuntingMesh(apexX, apexY, apexZ) {
    const buntingGroup = new THREE.Group();
    const targets = [
      { x: -14, y: 4.2, z: 2 },
      { x: -10, y: 3.8, z: 6 },
      { x: 10, y: 3.8, z: 6 },
      { x: 14, y: 4.2, z: 2 }
    ];

    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.6 });

    targets.forEach((t, lineIdx) => {
      const p1 = new THREE.Vector3(apexX, apexY - 0.4, apexZ);
      const p2 = new THREE.Vector3(t.x, t.y, t.z);
      const points = [];
      const numSegments = 10;

      for (let i = 0; i <= numSegments; i++) {
        const alpha = i / numSegments;
        const pt = new THREE.Vector3().lerpVectors(p1, p2, alpha);
        // Độ võng tự nhiên của dây cờ
        pt.y -= Math.sin(alpha * Math.PI) * 0.45;
        points.push(pt);

        // Treo các lá cờ tam giác nhỏ xen kẽ đỏ vàng
        if (i > 1 && i < numSegments) {
          const triGeo = new THREE.BufferGeometry();
          const flw = 0.22;
          const flh = 0.35;
          const vertices = new Float32Array([
            pt.x - flw / 2, pt.y, pt.z,
            pt.x + flw / 2, pt.y, pt.z,
            pt.x, pt.y - flh, pt.z
          ]);
          triGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
          triGeo.computeVertexNormals();

          const flagMesh = new THREE.Mesh(triGeo, ((i + lineIdx) % 2 === 0) ? redMat : yellowMat);
          buntingGroup.add(flagMesh);
        }
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMesh = new THREE.Line(lineGeo, lineMat);
      buntingGroup.add(lineMesh);
    });

    return buntingGroup;
  }

  // Helper tạo hoa văn bia đá hoa cương cổng trường THPT Tam Phước chuẩn ảnh thật
  createStoneMonumentTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Nền đá hoa cương đen bóng
    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#292524');
    grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Viền kép mạ vàng sang trọng
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, 988, 476);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.strokeRect(34, 34, 956, 444);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dòng 1: Sở GD&ĐT
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.fillText('SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG NAI', 512, 85);

    // Dòng 2: Cấp trường
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
    ctx.fillText('TRƯỜNG TRUNG HỌC PHỔ THÔNG', 512, 175);

    // Dòng 3: TÊN TRƯỜNG NỔI BẬT
    ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 80px "Arial Black", "Segoe UI", sans-serif';
    ctx.fillText('TAM PHƯỚC', 512, 290);
    ctx.shadowBlur = 0;

    // Đường kẻ trang trí vàng dưới tên trường
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(260, 360);
    ctx.lineTo(764, 360);
    ctx.stroke();

    // Dòng 4: Địa chỉ
    ctx.fillStyle = '#fef9c3';
    ctx.font = 'italic 25px "Segoe UI", Arial, sans-serif';
    ctx.fillText('P. Tam Phước - TP. Biên Hòa - Đồng Nai', 512, 420);

    return new THREE.CanvasTexture(canvas);
  }

  // Helper tạo biển khẩu hiệu xanh "CỔNG TRƯỜNG SẠCH ĐẸP - AN TOÀN" chuẩn ảnh thật
  createGateSloganTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    // Nền xanh dương đặc trưng như ảnh thực tế
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, 0, 1024, 360);

    // Viền trắng
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 1000, 336);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dòng trên
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
    ctx.fillText('CỔNG TRƯỜNG SẠCH ĐẸP - AN TOÀN', 512, 100);

    // Đường gạch mảnh
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(150, 175);
    ctx.lineTo(874, 175);
    ctx.stroke();

    // Dòng khẩu hiệu
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Học để làm cho bản thân và cộng đồng hạnh phúc!', 512, 250);

    return new THREE.CanvasTexture(canvas);
  }

  // Helper tạo cây phượng vĩ nở hoa đỏ rực rỡ đặc trưng trước cổng trường
  createPoincianaTree(x, z, scale = 1.0) {
    const treeGroup = new THREE.Group();
    // Thân cây
    const trunkGeo = new THREE.CylinderGeometry(0.35 * scale, 0.65 * scale, 6.5 * scale, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = (6.5 * scale) / 2;
    trunk.rotation.z = 0.08;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Tán lá xanh xòe rộng
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7, emissive: 0x7f1d1d, emissiveIntensity: 0.2 });

    const canopyPositions = [
      { dx: 0, dy: 6.2 * scale, dz: 0, r: 3.2 * scale },
      { dx: 1.8 * scale, dy: 5.6 * scale, dz: 1.2 * scale, r: 2.6 * scale },
      { dx: -1.8 * scale, dy: 5.8 * scale, dz: -0.8 * scale, r: 2.5 * scale },
      { dx: 0.8 * scale, dy: 6.8 * scale, dz: -1.5 * scale, r: 2.4 * scale }
    ];

    canopyPositions.forEach(p => {
      const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r, 1), leavesMat);
      leaves.position.set(p.dx, p.dy, p.dz);
      leaves.castShadow = true;
      treeGroup.add(leaves);

      // Cụm hoa phượng đỏ rực rỡ
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const flw = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r * 0.42, 0), flowerMat);
        flw.position.set(
          p.dx + Math.cos(angle) * (p.r * 0.75),
          p.dy + (Math.sin(angle * 2) * 0.5 + 0.3) * scale,
          p.dz + Math.sin(angle) * (p.r * 0.75)
        );
        treeGroup.add(flw);
      }
    });

    treeGroup.position.set(x, 0, z);
    return treeGroup;
  }

  // 7. NGOẠI CẢNH & KHU VỰC XE & SÂN BÓNG
  buildCampusEnvironment() {
    const envGroup = new THREE.Group();

    // ==========================================
    // KHU VỰC CỔNG TRƯỜNG THPT TAM PHƯỚC (THEO ẢNH THỰC TẾ)
    // ==========================================
    const gateGroup = new THREE.Group();

    // 1. Lòng đường nhựa ra vào cổng
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 22),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(-2, 0.02, 53);
    road.receiveShadow = true;
    gateGroup.add(road);

    // Vạch kẻ đường viền trắng hai bên
    const roadStripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const stripeLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 22), roadStripeMat);
    stripeLeft.rotation.x = -Math.PI / 2;
    stripeLeft.position.set(-9.8, 0.03, 53);
    gateGroup.add(stripeLeft);

    const stripeRight = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 22), roadStripeMat);
    stripeRight.rotation.x = -Math.PI / 2;
    stripeRight.position.set(5.8, 0.03, 53);
    gateGroup.add(stripeRight);

    // Dữ liệu tương tác khi click vào Cổng Trường
    const gateUserData = {
      id: "cong_truong",
      locId: "cong_truong",
      name: "Cổng Trường",
      floorKey: 'fl_0',
      info: "Cổng chính THPT Tam Phước - Phường Tam Phước, TP. Biên Hòa, Tỉnh Đồng Nai",
      img: "cong_truong.png"
    };

    // 2. BIA ĐÁ HOA CƯƠNG TÊN TRƯỜNG THPT TAM PHƯỚC (THEO ẢNH THẬT)
    const monumentGroup = new THREE.Group();
    monumentGroup.position.set(-14.5, 0, 52);

    // Bồn hoa gạch thẻ đỏ chân bia
    const planterBox = new THREE.Mesh(
      new THREE.BoxGeometry(8.6, 0.85, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.75 })
    );
    planterBox.position.y = 0.425;
    planterBox.castShadow = true;
    monumentGroup.add(planterBox);

    // Cây hoa cỏ trong bồn
    const shrubMat1 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
    const shrubMat2 = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 });
    const shrubMat3 = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.8 });
    for (let bx = -3.6; bx <= 3.6; bx += 1.2) {
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), shrubMat1);
      shrub.position.set(bx, 0.95, 0.7);
      monumentGroup.add(shrub);
      const flw = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), (Math.abs(bx) % 2.4 === 0) ? shrubMat2 : shrubMat3);
      flw.position.set(bx, 1.25, 0.75);
      monumentGroup.add(flw);
    }

    // Tấm đá hoa cương lớn khắc chữ vàng
    const stoneGeo = new THREE.BoxGeometry(8.2, 3.7, 0.7);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.25, metalness: 0.1 });
    const stoneSlab = new THREE.Mesh(stoneGeo, stoneMat);
    stoneSlab.position.y = 2.65;
    stoneSlab.castShadow = true;
    monumentGroup.add(stoneSlab);

    // Mặt trước bia khắc chữ vàng
    const stoneTex = this.createStoneMonumentTexture();
    const stonePlateMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.3,
      metalness: 0.2
    });
    const stonePlateFront = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 3.5), stonePlateMat);
    stonePlateFront.position.set(0, 2.65, 0.36);
    monumentGroup.add(stonePlateFront);

    // Mặt sau bia
    const stonePlateBack = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 3.5), stonePlateMat);
    stonePlateBack.rotation.y = Math.PI;
    stonePlateBack.position.set(0, 2.65, -0.36);
    monumentGroup.add(stonePlateBack);

    monumentGroup.userData = gateUserData;
    this.interactiveRooms.push(monumentGroup);
    gateGroup.add(monumentGroup);

    // 3. BẢNG KHẨU HIỆU XANH & HÀNG RÀO THEO ẢNH
    const sloganGroup = new THREE.Group();
    sloganGroup.position.set(-23.8, 0, 52);

    // Chân bệ hàng rào đỏ thẫm
    const fenceBase = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.7, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.7 })
    );
    fenceBase.position.y = 0.35;
    sloganGroup.add(fenceBase);

    // Song sắt đứng màu kem
    const ironMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
    for (let fx = -4.4; fx <= 4.4; fx += 0.4) {
      const ironBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), ironMat);
      ironBar.position.set(fx, 2.1, 0);
      sloganGroup.add(ironBar);
    }

    // Bảng khẩu hiệu màu xanh biển
    const sloganTex = this.createGateSloganTexture();
    const sloganMat = new THREE.MeshStandardMaterial({ map: sloganTex, roughness: 0.3 });
    const sloganBoardFront = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 2.7), sloganMat);
    sloganBoardFront.position.set(0, 2.35, 0.12);
    sloganGroup.add(sloganBoardFront);

    const sloganBoardBack = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 2.7), sloganMat);
    sloganBoardBack.rotation.y = Math.PI;
    sloganBoardBack.position.set(0, 2.35, -0.12);
    sloganGroup.add(sloganBoardBack);

    gateGroup.add(sloganGroup);

    // 4. TRỤ CỔNG BÊ TÔNG VỚI Ô VÒM ĐỎ THẪM ĐẶC TRƯNG
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const pillarInnerMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.5 });
    [-10.2, -18.8, -28.6].forEach(px => {
      const pil = new THREE.Group();
      pil.position.set(px, 0, 52);

      const pilBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.4, 1.2), pillarMat);
      pilBody.position.y = 2.2;
      pilBody.castShadow = true;
      pil.add(pilBody);

      const recessedFront = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 0.1), pillarInnerMat);
      recessedFront.position.set(0, 2.2, 0.56);
      pil.add(recessedFront);

      const recessedBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 0.1), pillarInnerMat);
      recessedBack.position.set(0, 2.2, -0.56);
      pil.add(recessedBack);

      const pilCap = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.4, 16), pillarMat);
      pilCap.position.y = 4.5;
      pil.add(pilCap);

      gateGroup.add(pil);
    });

    // 5. CÂY PHƯỢNG VĨ HOA ĐỎ NỞ RỘ TRÊN HÀNG RÀO
    const tree1 = this.createPoincianaTree(-23.5, 47.5, 1.25);
    gateGroup.add(tree1);
    const tree2 = this.createPoincianaTree(-15, 46.8, 1.1);
    gateGroup.add(tree2);

    // 6. PHÒNG TRỰC BẢO VỆ MÁI XANH DƯƠNG (THEO ẢNH)
    const guardGroup = new THREE.Group();
    guardGroup.position.set(6.5, 0, 51.5);

    const guardBody = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 3.6, 5.2),
      new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.7 })
    );
    guardBody.position.y = 1.8;
    guardBody.castShadow = true;
    guardGroup.add(guardBody);

    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.5 })
    );
    door.position.set(-1.6, 1.3, 2.62);
    guardGroup.add(door);

    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 })
    );
    win.position.set(1.4, 2.0, 2.62);
    guardGroup.add(win);

    const roofGeo = new THREE.ConeGeometry(5.4, 2.4, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.scale.set(1.15, 1.0, 1.0);
    roof.position.y = 4.8;
    roof.castShadow = true;
    guardGroup.add(roof);

    const guardLblTex = this.createCanvasLabel("PHÒNG BẢO VỆ", "Trực an ninh 24/7", "#ffffff", "#0f172a", "#0284c7", 340, 120);
    const guardLbl = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.3),
      new THREE.MeshBasicMaterial({ map: guardLblTex, transparent: true })
    );
    guardLbl.position.set(0, 3.2, 2.63);
    guardGroup.add(guardLbl);

    guardGroup.userData = {
      id: "phong_bao_ve",
      locId: "phong_bao_ve",
      name: "Phòng Bảo Vệ",
      floorKey: 'fl_0',
      info: "Phòng trực bảo vệ an ninh cổng trường THPT Tam Phước"
    };
    this.interactiveRooms.push(guardGroup);
    gateGroup.add(guardGroup);

    // (Đã xóa bỏ bảng ảnh thực tế cổng trường cạnh phòng bảo vệ theo yêu cầu)

    envGroup.add(gateGroup);

    // Nhà xe giáo viên (Góc Tây Nam)
    const gvParking = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 8), new THREE.MeshStandardMaterial({ color: 0xf1f5f9 }));
    gvParking.position.set(-36, 1.5, 42);
    gvParking.castShadow = true;
    gvParking.userData = {
      id: "nha_xe_gv",
      locId: "nha_xe_gv",
      name: "Nhà xe giáo viên",
      floorKey: 'fl_0',
      info: "Khu vực để xe dành riêng cho giáo viên"
    };
    this.interactiveRooms.push(gvParking);
    envGroup.add(gvParking);
    const gvLbl = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.0), new THREE.MeshBasicMaterial({
      map: this.createCanvasLabel("NHÀ XE GIÁO VIÊN", "Khu vực để xe GV", "#ffffff", "#0f172a", "#94a3b8", 360, 120),
      transparent: true
    }));
    gvLbl.position.set(-36, 1.8, 46.1);
    envGroup.add(gvLbl);

    // Dãy để xe học sinh (Dọc phía Tây)
    const westBike = new THREE.Mesh(new THREE.BoxGeometry(5, 2.5, 50), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    westBike.position.set(-53, 1.25, -4);
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

  // Bật / Tắt chế độ tự động xoay 360 độ quanh khuôn viên
  toggle360AutoRotate(forceState) {
    if (!this.controls) return false;
    if (typeof forceState === 'boolean') {
      this.controls.autoRotate = forceState;
    } else {
      this.controls.autoRotate = !this.controls.autoRotate;
    }
    if (this.controls.autoRotate) {
      if (!this.controls.autoRotateSpeed) this.controls.autoRotateSpeed = 2.0;
    }
    return this.controls.autoRotate;
  }

  // Cài đặt tốc độ xoay 360 (1.0 = chậm, 2.0 = vừa, 3.5 = nhanh)
  set360RotateSpeed(speed = 2.0) {
    if (!this.controls) return;
    const sign = Math.sign(this.controls.autoRotateSpeed) || 1;
    this.controls.autoRotateSpeed = Math.abs(speed) * sign;
  }

  // Đổi chiều xoay 360 độ (theo chiều hoặc ngược chiều kim đồng hồ)
  reverse360Direction() {
    if (!this.controls) return 1;
    this.controls.autoRotateSpeed = -this.controls.autoRotateSpeed;
    return this.controls.autoRotateSpeed > 0 ? 1 : -1;
  }

  // Đổi góc nhìn camera theo thiết lập sẵn & Điểm nhìn 360 Panorama
  setCameraPreset(presetName) {
    const duration = 1000;
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    let endPos = new THREE.Vector3();
    let endTarget = new THREE.Vector3();

    // Reset giới hạn góc xoay mặc định
    this.controls.minDistance = 15;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;

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

      // ================= CÁC ĐIỂM NHÌN TOÀN CẢNH 360° THỰC TẾ =================
      case '360_san_truong': // 1. Đứng giữa Sân trường trung tâm nhìn 360°
        this.controls.minDistance = 2.0;
        this.controls.maxPolarAngle = Math.PI * 0.58;
        endPos.set(0, 3.2, 8);
        endTarget.set(0, 3.6, 0);
        break;
      case '360_cong_truong': // 2. Đứng tại Cổng trường chính nhìn 360°
        this.controls.minDistance = 2.0;
        this.controls.maxPolarAngle = Math.PI * 0.58;
        endPos.set(-6, 2.6, 48);
        endTarget.set(-6, 3.2, 20);
        break;
      case '360_cot_co': // 3. Đứng trước Cột cờ & Mái tam giác nhìn 360°
        this.controls.minDistance = 2.0;
        this.controls.maxPolarAngle = Math.PI * 0.58;
        endPos.set(0, 2.5, 14);
        endTarget.set(0, 3.5, 2);
        break;
      case '360_hoi_truong': // 4. Đứng trước Hội trường mái vòm nhìn 360°
        this.controls.minDistance = 2.0;
        this.controls.maxPolarAngle = Math.PI * 0.58;
        endPos.set(24, 2.8, 25);
        endTarget.set(28, 3.6, 18);
        break;
      case '360_day_hanh_chinh': // 5. Đứng trước sảnh Dãy Hành chính nhìn 360°
        this.controls.minDistance = 2.0;
        this.controls.maxPolarAngle = Math.PI * 0.58;
        endPos.set(-20, 2.8, 24);
        endTarget.set(-20, 3.2, 18);
        break;
      case '360_skybridge': // 6. Đứng trên Cầu vượt Tầng 2 nhìn toàn cảnh 360°
        this.controls.minDistance = 1.5;
        this.controls.maxPolarAngle = Math.PI * 0.58;
        endPos.set(-20.5, 4.8, 8);
        endTarget.set(-20.5, 4.0, 0);
        break;
      case '360_orbit': // 7. Toàn cảnh xoay 360° từ trên cao
        this.controls.minDistance = 15;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
        endPos.set(0, 42, 65);
        endTarget.set(0, 6, 2);
        break;

      default:
        endPos.set(0, 48, 70);
        endTarget.set(0, 7, 3);
    }

    this.tweenCamera(endPos, endTarget, duration);
  }

  // Hiệu ứng di chuyển camera mượt mà (Smooth camera tween)
  tweenCamera(endPos, endTarget, duration = 650, onComplete = null) {
    if (!this.camera || !this.controls) return;
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / Math.max(duration, 50), 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (typeof onComplete === 'function') onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  // =========================================================================
  // BỘ ĐIỀU KHIỂN TÍCH HỢP XOAY 360° & DI CHUYỂN (PAN) & DI CHUYỂN TẦNG
  // =========================================================================

  setInteractionMode(mode) {
    this.interactionMode = mode;
    this.applyInteractionMode();
    if (window.onInteractionModeChanged) {
      window.onInteractionModeChanged(this.interactionMode);
    }
    return this.interactionMode;
  }

  togglePanMode() {
    const newMode = (this.interactionMode === 'pan') ? 'unified' : 'pan';
    return this.setInteractionMode(newMode);
  }

  applyInteractionMode() {
    if (!this.controls) return;
    this.controls.enablePan = true;
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.screenSpacePanning = true; // Kéo di chuyển theo mặt phẳng màn hình: Cho phép di chuyển lên xuống giữa các tầng và sang trái/phải mượt mà!

    if (this.interactionMode === 'pan') {
      // Chế độ Di Chuyển (Pan Mode):
      // - Chuột trái / 1 ngón tay chạm vuốt: Di chuyển bản đồ sang trái, phải, trên, dưới tự do
      // - Chuột phải / 2 ngón tay chạm vuốt: Xoay góc nhìn 360 độ
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
      };
      this.controls.touches = {
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY
      };
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.style.cursor = 'move';
      }
    } else {
      // Chế độ Xoay 360° Mặc định (Unified Mode):
      // - Chuột trái / 1 ngón tay chạm vuốt: Xoay góc nhìn 360 độ tự do quanh trường
      // - Chuột phải HOẶC Shift + Chuột trái: Di chuyển bản đồ (Pan) theo mọi hướng và lên xuống giữa các tầng
      // - 2 ngón tay chạm chụm / mở rộng: Thu phóng (Zoom) mượt mà không bị giật hay lệch vị trí
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY
      };
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.style.cursor = 'grab';
      }
    }
  }

  // Nâng / hạ góc nhìn lên xuống giữa các tầng (thay đổi cao độ Y)
  changeFloorElevation(deltaY, duration = 400) {
    if (!this.controls) return;
    const currentTargetY = this.controls.target.y;
    // Giới hạn cao độ từ tầng trệt (1.8m) đến tầng 4 / mái (17.5m)
    const newTargetY = THREE.MathUtils.clamp(currentTargetY + deltaY, 1.8, 17.5);
    const diffY = newTargetY - currentTargetY;
    if (Math.abs(diffY) < 0.05) return;

    const endTarget = this.controls.target.clone();
    endTarget.y = newTargetY;

    const endPos = this.camera.position.clone();
    endPos.y += diffY;
    endPos.y = THREE.MathUtils.clamp(endPos.y, 3.2, 55);

    this.tweenCamera(endPos, endTarget, duration);

    // Xác định tầng tương ứng để cập nhật UI & thông báo
    let floorLabel = "Tầng Trệt";
    let floorKey = "fl_0";
    if (newTargetY >= 11.5) {
      floorLabel = "Tầng 4";
      floorKey = "fl_3";
    } else if (newTargetY >= 7.8) {
      floorLabel = "Tầng 3";
      floorKey = "fl_2";
    } else if (newTargetY >= 4.2) {
      floorLabel = "Tầng 2";
      floorKey = "fl_1";
    }

    if (window.onFloorElevationChanged) {
      window.onFloorElevationChanged(floorKey, floorLabel, newTargetY);
    }
  }

  // Chuyển nhanh tầm nhìn đến đúng cao độ của tầng được chọn
  focusFloor(floorKey) {
    this.filterFloor(floorKey);
    if (!this.controls) return;

    const floorConfigs = {
      all:  { targetY: 7.0,  camY: 48.0, label: "Toàn Cảnh" },
      fl_0: { targetY: 1.8,  camY: 5.2,  camDist: 28, label: "Tầng Trệt" },
      fl_1: { targetY: 5.4,  camY: 8.8,  camDist: 28, label: "Tầng 2" },
      fl_2: { targetY: 9.0,  camY: 12.4, camDist: 28, label: "Tầng 3" },
      fl_3: { targetY: 12.6, camY: 16.0, camDist: 28, label: "Tầng 4" }
    };

    const cfg = floorConfigs[floorKey];
    if (!cfg) return;

    if (floorKey === 'all') {
      const endTarget = new THREE.Vector3(0, 7, 3);
      const endPos = new THREE.Vector3(0, 48, 70);
      this.tweenCamera(endPos, endTarget, 650);
    } else {
      // Di chuyển mượt mà tới cao độ của tầng đã chọn, giữ hướng nhìn hiện tại
      const currentTarget = this.controls.target.clone();
      const currentCam = this.camera.position.clone();
      let dir = currentCam.clone().sub(currentTarget);
      dir.y = 0;
      if (dir.lengthSq() < 1) {
        dir.set(0, 0, 1);
      }
      dir.normalize().multiplyScalar(cfg.camDist || 28);

      const endTarget = new THREE.Vector3(currentTarget.x, cfg.targetY, currentTarget.z);
      const endPos = new THREE.Vector3(
        endTarget.x + dir.x,
        cfg.camY,
        endTarget.z + dir.z
      );

      this.tweenCamera(endPos, endTarget, 550);
    }

    if (window.onFloorElevationChanged) {
      window.onFloorElevationChanged(floorKey, cfg.label, cfg.targetY);
    }
  }

  // Đưa góc nhìn trở về lại ngay chính giữa khuôn viên trường THPT Tam Phước
  recenterCampus(duration = 650) {
    if (!this.controls) return;
    const centerTarget = new THREE.Vector3(0, 7, 3);
    const offset = this.camera.position.clone().sub(this.controls.target);
    const endPos = centerTarget.clone().add(offset);
    this.tweenCamera(endPos, centerTarget, duration);
  }

  // Phóng to bản đồ
  zoomIn(factor = 0.8) {
    if (!this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.multiplyScalar(factor);
    if (offset.length() < this.controls.minDistance) {
      offset.setLength(this.controls.minDistance);
    }
    const endPos = this.controls.target.clone().add(offset);
    this.tweenCamera(endPos, this.controls.target.clone(), 350);
  }

  // Thu nhỏ bản đồ
  zoomOut(factor = 1.25) {
    if (!this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.multiplyScalar(factor);
    if (offset.length() > this.controls.maxDistance) {
      offset.setLength(this.controls.maxDistance);
    }
    const endPos = this.controls.target.clone().add(offset);
    this.tweenCamera(endPos, this.controls.target.clone(), 350);
  }

  // Di chuyển từng bước theo hướng (hỗ trợ phím mũi tên bàn phím hoặc nút điều hướng D-pad)
  panByDirection(dir, distance = 8, duration = 220) {
    if (!this.controls || !this.controls.enabled) return;

    // Vector hướng nhìn trên mặt phẳng đất (XZ)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) {
      forward.set(0, 0, -1);
    } else {
      forward.normalize();
    }

    // Vector sang phải (Right = Forward x Up)
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
    const v = new THREE.Vector3();

    switch (dir) {
      case 'left':
        v.copy(right).multiplyScalar(-distance);
        break;
      case 'right':
        v.copy(right).multiplyScalar(distance);
        break;
      case 'up': // Di chuyển lên / tới trước
        v.copy(forward).multiplyScalar(distance);
        break;
      case 'down': // Di chuyển xuống / lùi sau
        v.copy(forward).multiplyScalar(-distance);
        break;
      case 'elev_up':
        this.changeFloorElevation(3.6);
        return;
      case 'elev_down':
        this.changeFloorElevation(-3.6);
        return;
    }

    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = startPos.clone().add(v);
    const endTarget = startTarget.clone().add(v);

    this.tweenCamera(endPos, endTarget, duration);
  }

  // Di chuyển liên tục trơn tru khi nhấn giữ phím hoặc nút điều hướng
  startContinuousPan(dir, speed = 0.55) {
    this.stopContinuousPan();
    if (!this.controls || !this.controls.enabled) return;

    const animatePan = () => {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 0.0001) {
        forward.set(0, 0, -1);
      } else {
        forward.normalize();
      }

      const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
      const v = new THREE.Vector3();

      switch (dir) {
        case 'left':
          v.copy(right).multiplyScalar(-speed);
          break;
        case 'right':
          v.copy(right).multiplyScalar(speed);
          break;
        case 'up':
          v.copy(forward).multiplyScalar(speed);
          break;
        case 'down':
          v.copy(forward).multiplyScalar(-speed);
          break;
        case 'elev_up':
          this.controls.target.y = Math.min(this.controls.target.y + 0.14, 17.5);
          this.camera.position.y = Math.min(this.camera.position.y + 0.14, 55);
          this.controls.update();
          this.continuousPanId = requestAnimationFrame(animatePan);
          return;
        case 'elev_down':
          this.controls.target.y = Math.max(this.controls.target.y - 0.14, 1.8);
          this.camera.position.y = Math.max(this.camera.position.y - 0.14, 3.2);
          this.controls.update();
          this.continuousPanId = requestAnimationFrame(animatePan);
          return;
      }

      this.camera.position.add(v);
      this.controls.target.add(v);
      this.controls.update();

      this.continuousPanId = requestAnimationFrame(animatePan);
    };

    this.continuousPanId = requestAnimationFrame(animatePan);
  }

  stopContinuousPan() {
    if (this.continuousPanId) {
      cancelAnimationFrame(this.continuousPanId);
      this.continuousPanId = null;
    }
  }

  setupEvents() {
    let lastWidth = 0;
    let lastHeight = 0;
    let resizeTimer = null;

    const handleResize = () => {
      if (!this.container || !this.renderer) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w <= 0 || h <= 0) return;
      // Chỉ tái cấp phát kích thước renderer khi thay đổi kích thước đáng kể (tránh realloc VRAM liên tục khi pinch zoom)
      if (Math.abs(w - lastWidth) > 6 || Math.abs(h - lastHeight) > 6) {
        lastWidth = w;
        lastHeight = h;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    };

    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 120);
    });

    // Bắt sự kiện chạm / click vào phòng để xem ảnh và thông tin chi tiết (quản lý đa điểm chạm để không kích hoạt nhầm khi pinch zoom)
    let pointerDownPos = { x: 0, y: 0 };
    let isDraggingCanvas = false;
    let activePointerCount = 0;
    let hadMultiTouch = false;

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      activePointerCount++;
      if (activePointerCount > 1) {
        hadMultiTouch = true;
        isDraggingCanvas = true;
      } else {
        pointerDownPos = { x: e.clientX, y: e.clientY };
        isDraggingCanvas = false;
        hadMultiTouch = false;
      }
      this.renderer.domElement.style.cursor = 'grabbing';
    });

    this.renderer.domElement.addEventListener('pointermove', (e) => {
      if (activePointerCount > 1) {
        hadMultiTouch = true;
        isDraggingCanvas = true;
      } else if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 8) {
        isDraggingCanvas = true;
      }
    });

    const resetCursor = () => {
      if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.style.cursor = 'grab';
      }
    };

    this.renderer.domElement.addEventListener('pointerup', (e) => {
      resetCursor();
      const multi = hadMultiTouch || activePointerCount > 1;
      activePointerCount = Math.max(0, activePointerCount - 1);
      if (activePointerCount === 0) {
        hadMultiTouch = false;
      }
      if (e.button !== undefined && e.button !== 0) return;
      if (isDraggingCanvas || multi) return; // Nếu đang kéo xoay camera hoặc chụm thu phóng map thì không coi là click
      if (this.tourActive) return; // Đang đi thử không bật popover để đảm bảo tầm nhìn

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      let foundData = null;
      let matchedObj = null;
      let hitPoint = null;
      for (let hit of intersects) {
        let curr = hit.object;
        while (curr && curr.parent && curr.parent !== this.scene) {
          if (curr.userData && curr.userData.name && curr.userData.name !== '-') {
            foundData = curr.userData;
            matchedObj = curr;
            hitPoint = hit.point;
            break;
          }
          curr = curr.parent;
        }
        if (foundData) break;
      }

      if (foundData) {
        const searchTarget = foundData.id || foundData.locId || foundData.name;
        const loc = this.findLocation(searchTarget, foundData.floorKey);
        let room3DPos = null;
        if (matchedObj) {
          const box = new THREE.Box3().setFromObject(matchedObj);
          room3DPos = new THREE.Vector3(
            (box.min.x + box.max.x) / 2,
            box.max.y + 0.35,
            (box.min.z + box.max.z) / 2
          );
        } else if (hitPoint) {
          room3DPos = hitPoint.clone();
        }

        if (window.onCampus3DRoomClick) {
          window.onCampus3DRoomClick(loc || foundData, e, room3DPos);
        } else {
          this.showRoomTooltip(foundData, e.clientX, e.clientY);
        }
      } else {
        if (window.hideCampus3DPopover) {
          window.hideCampus3DPopover();
        }
      }
    });

    this.renderer.domElement.addEventListener('pointerleave', resetCursor);
    this.renderer.domElement.addEventListener('pointercancel', resetCursor);
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
        border-radius: 10px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.5);
        pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        border: 1px solid #38bdf8;
        max-width: 320px;
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
      ${userData.img ? `
        <div style="margin: 8px 0 6px 0; border-radius: 8px; overflow: hidden; border: 1.5px solid rgba(56, 189, 248, 0.6); box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
          <img src="${userData.img}" alt="${userData.name}" style="width: 100%; max-height: 150px; object-fit: cover; display: block;" />
        </div>
      ` : ''}
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
    }, 6000);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.isContextLost) return;

    if (this.controls && this.controls.enabled) {
      // Giới hạn phạm vi tâm nhìn (target) trong ranh giới khuôn viên trường học để không bị trôi quá xa
      this.controls.target.x = THREE.MathUtils.clamp(this.controls.target.x, -85, 85);
      this.controls.target.z = THREE.MathUtils.clamp(this.controls.target.z, -50, 90);
      this.controls.target.y = THREE.MathUtils.clamp(this.controls.target.y, 0, 26);
      this.controls.update();
    }

    // Kiểm tra tính hợp lệ của camera để đảm bảo không bao giờ bị NaN / Infinity khi thu phóng bằng tay
    if (this.camera && this.controls) {
      if (!isFinite(this.camera.position.x) || !isFinite(this.camera.position.y) || !isFinite(this.camera.position.z)) {
        this.camera.position.set(0, 48, 70);
      }
      if (!isFinite(this.controls.target.x) || !isFinite(this.controls.target.y) || !isFinite(this.controls.target.z)) {
        this.controls.target.set(0, 7, 3);
      }
      // Bảo vệ cự ly camera luôn nằm trong khoảng [minDistance, maxDistance]
      const dist = this.camera.position.distanceTo(this.controls.target);
      if (dist > this.controls.maxDistance) {
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        this.camera.position.copy(this.controls.target).addScaledVector(dir, this.controls.maxDistance);
      } else if (dist < this.controls.minDistance) {
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        this.camera.position.copy(this.controls.target).addScaledVector(dir, this.controls.minDistance);
      }
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

    if (this.onFrame) {
      this.onFrame();
    }

    if (window.updateCampus3DPopoverPosition) {
      window.updateCampus3DPopoverPosition();
    }

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (err) {
      console.warn("Campus3D: Render frame caught error:", err);
    }
  }

  // Chuyển đổi tọa độ 3D Vector3 thành tọa độ pixel 2D trên màn hình
  projectToScreen(vec3) {
    if (!vec3 || !this.camera) return null;
    const v = vec3.clone();
    v.project(this.camera);

    const isBehind = (v.z > 1.0);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = (v.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-(v.y * 0.5) + 0.5) * rect.height + rect.top;

    return {
      x,
      y,
      isBehind
    };
  }

  // Tìm vị trí 3D thế giới chính xác ngay trên nóc của phòng học hoặc địa điểm
  getRoomWorldPosition(locOrName) {
    if (!locOrName) return null;
    const targetId = (locOrName.id || locOrName.locId || '').toString().trim().toLowerCase();
    const targetName = (locOrName.name || locOrName.id || locOrName).toString().trim().toLowerCase();
    let foundObj = null;

    // Ưu tiên 1: Khớp chính xác ID nếu có
    if (targetId) {
      this.scene.traverse((obj) => {
        if (foundObj) return;
        if (obj.userData && (obj.userData.id === targetId || obj.userData.locId === targetId)) {
          foundObj = obj;
        }
      });
    }

    // Ưu tiên 2: Khớp tên phòng
    if (!foundObj) {
      this.scene.traverse((obj) => {
        if (foundObj) return;
        if (obj.userData && obj.userData.name && obj.userData.name !== '-') {
          const n = obj.userData.name.toString().trim().toLowerCase();
          if (n === targetName || n.includes(targetName) || targetName.includes(n)) {
            foundObj = obj;
          }
        }
      });
    }

    if (foundObj) {
      const box = new THREE.Box3().setFromObject(foundObj);
      return new THREE.Vector3(
        (box.min.x + box.max.x) / 2,
        box.max.y + 0.35,
        (box.min.z + box.max.z) / 2
      );
    }

    // Fallback nếu vị trí có x, y trong CampusLocation
    const loc = (typeof locOrName === 'object' && locOrName.x !== undefined) ? locOrName : this.findLocation(locOrName);
    if (loc && loc.x !== undefined && loc.y !== undefined) {
      const x3d = (loc.x - 740) * 0.062;
      const z3d = (loc.y - 650) * 0.088;
      const y3d = this.getFloorHeight(loc.floor) + 3.2;
      return new THREE.Vector3(x3d, y3d, z3d);
    }

    return null;
  }

  // =========================================================================
  // TÍNH NĂNG CHỈ ĐƯỜNG 3D
  // =========================================================================
  findLocation(raw, floorKey = null) {
    if (!raw) return null;
    if (typeof raw === 'object' && raw.id) return raw;
    const term = String(raw).trim();
    if (!window.CAMPUS_LOCATIONS) return null;

    // 1. Khớp trực tiếp id
    let found = window.CAMPUS_LOCATIONS.find(l => l.id.toLowerCase() === term.toLowerCase());
    if (found) return found;

    const norm = term.toLowerCase().replace(/^p\.\s*/, '').replace(/^(lớp|phòng)\s*/, '').trim();

    // Map floorKey (e.g. 'fl_0', 'fl_1', 'fl_2', 'fl_3') to Vietnamese floor name if provided
    let expectedFloor = null;
    if (floorKey === 'fl_0' || floorKey === 0) expectedFloor = 'Tầng trệt';
    else if (floorKey === 'fl_1' || floorKey === 1) expectedFloor = 'Tầng 2';
    else if (floorKey === 'fl_2' || floorKey === 2) expectedFloor = 'Tầng 3';
    else if (floorKey === 'fl_3' || floorKey === 3) expectedFloor = 'Tầng 4';

    // 2. Khớp tên phòng sạch (ưu tiên đúng tầng nếu có)
    if (expectedFloor) {
      found = window.CAMPUS_LOCATIONS.find(l => {
        if (l.floor !== expectedFloor) return false;
        const lNorm = l.name.toLowerCase().replace(/^(lớp|phòng)\s*/, '').trim();
        return lNorm === norm || lNorm === term.toLowerCase();
      });
      if (found) return found;
    }

    found = window.CAMPUS_LOCATIONS.find(l => {
      const lNorm = l.name.toLowerCase().replace(/^(lớp|phòng)\s*/, '').trim();
      return lNorm === norm || lNorm === term.toLowerCase();
    });
    if (found) return found;

    // 3. Khớp từ khóa keywords (ưu tiên đúng tầng nếu có)
    if (expectedFloor) {
      found = window.CAMPUS_LOCATIONS.find(l => {
        if (l.floor !== expectedFloor) return false;
        return l.keywords && l.keywords.some(k => {
          const kNorm = k.toLowerCase().replace(/^(lớp|phòng)\s*/, '').trim();
          return kNorm === norm || k.toLowerCase() === term.toLowerCase();
        });
      });
      if (found) return found;
    }

    // Nếu tìm generic WC và có tầng, tìm WC theo tầng đó
    if (norm === 'wc' && expectedFloor) {
      found = window.CAMPUS_LOCATIONS.find(l => l.floor === expectedFloor && l.id.toLowerCase().includes('wc'));
      if (found) return found;
    }

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

    // 1. Tạo danh sách các điểm định vị 3D bám sát hành lang và cầu thang thực tế
    const waypoints3D = this.buildCorridorWaypoints(navRes.nodePath, startLoc, destLoc);

    // 2. Lọc các điểm quá sát nhau (< 0.35 đơn vị) để đường cong không bị xoắn gấp
    const filteredPoints = [waypoints3D[0]];
    for (let i = 1; i < waypoints3D.length; i++) {
      if (filteredPoints[filteredPoints.length - 1].distanceTo(waypoints3D[i]) > 0.35) {
        filteredPoints.push(waypoints3D[i]);
      }
    }

    if (filteredPoints.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(filteredPoints);
      curve.curveType = 'centripetal';
      this.activeCurve = curve;

      // 1. Dải ruy băng neon phát sáng thanh mảnh trên sàn hành lang (R = 0.075m)
      const tubeSegments = Math.max(70, filteredPoints.length * 20);
      const tubeGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.075, 10, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x00d2ff,
        emissive: 0x0284c7,
        emissiveIntensity: 1.25,
        roughness: 0.2,
        metalness: 0.1
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.castShadow = false;
      this.routeGroup.add(tubeMesh);

      // 2. Hào quang mỏng xung quanh đường đi
      const glowGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.15, 6, false);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      this.routeGroup.add(glowMesh);

      // 3. Mũi tên chỉ hướng phát sáng dọc tuyến hành lang
      const numChevrons = Math.max(5, Math.floor(filteredPoints.length * 2.2));
      const chevronTex = this.createChevronTexture();
      const chevronMat = new THREE.MeshBasicMaterial({
        map: chevronTex,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      for (let i = 1; i < numChevrons; i++) {
        const t = i / numChevrons;
        const pt = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        const chMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), chevronMat);
        chMesh.rotation.x = -Math.PI / 2;
        const angle = Math.atan2(tangent.x, tangent.z);
        chMesh.rotation.z = -angle;
        chMesh.position.set(pt.x, pt.y + 0.06, pt.z);
        this.routeGroup.add(chMesh);
      }

      // 4. Các điểm ghim 3D Bắt đầu & Kết thúc
      this.createRoutePin(filteredPoints[0], "#10b981", `BẮT ĐẦU: ${startLoc.name}`, true);
      this.createRoutePin(filteredPoints[filteredPoints.length - 1], "#ef4444", `ĐẾN: ${destLoc.name}`, false);

      // Tự động xoay camera để bao quát toàn tuyến
      this.focusRoute(filteredPoints);
    } else if (filteredPoints.length === 1) {
      this.createRoutePin(filteredPoints[0], "#10b981", `VỊ TRÍ: ${startLoc.name}`, true);
    }

    return navRes;
  }

  createChevronTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(64, 20);
    ctx.lineTo(108, 90);
    ctx.lineTo(84, 90);
    ctx.lineTo(64, 52);
    ctx.lineTo(44, 90);
    ctx.lineTo(20, 90);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  createRoutePin(pos, hexColor, labelText, isStart = true) {
    const pinGroup = new THREE.Group();
    pinGroup.position.copy(pos);

    const colorNum = typeof hexColor === 'string' ? parseInt(hexColor.replace('#', '0x'), 16) : hexColor;

    // Cột trụ phát sáng
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
      isStart ? "📍 XUẤT PHÁT" : "🎯 ĐÍCH ĐẾN",
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

    if (this.routeGroup) {
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

  // Thuật toán xây dựng chuỗi điểm di chuyển 3D bám sát 100% trục hành lang và cầu thang
  buildCorridorWaypoints(nodePath, startLoc, destLoc) {
    const rawNodes = [];

    if (nodePath && nodePath.length > 0) {
      nodePath.forEach(nid => {
        const nd = window.CAMPUS_GRAPH_NODES && window.CAMPUS_GRAPH_NODES[nid];
        const p3d = this.get3DNodePosition(nid, nd, nd ? nd.floor : null);
        rawNodes.push({ nid, nd, p3d });
      });
    }

    if (rawNodes.length === 0) {
      const pStart = this.get3DNodePosition(startLoc.node || startLoc.id, startLoc, startLoc.floor);
      const pDest = this.get3DNodePosition(destLoc.node || destLoc.id, destLoc, destLoc.floor);
      rawNodes.push({ nid: startLoc.id, nd: startLoc, p3d: pStart });
      rawNodes.push({ nid: destLoc.id, nd: destLoc, p3d: pDest });
    }

    // Đảm bảo điểm đầu và cuối khớp với vị trí xuất phát / đích đến
    const firstP = rawNodes[0].p3d;
    const startP = this.get3DNodePosition(startLoc.node || startLoc.id, startLoc, startLoc.floor);
    if (firstP.distanceTo(startP) > 0.8) {
      rawNodes.unshift({ nid: startLoc.id, nd: startLoc, p3d: startP });
    }
    const lastP = rawNodes[rawNodes.length - 1].p3d;
    const destP = this.get3DNodePosition(destLoc.node || destLoc.id, destLoc, destLoc.floor);
    if (lastP.distanceTo(destP) > 0.8) {
      rawNodes.push({ nid: destLoc.id, nd: destLoc, p3d: destP });
    }

    const waypoints = [];

    for (let i = 0; i < rawNodes.length; i++) {
      const curr = rawNodes[i];
      const pCurr = curr.p3d.clone();
      waypoints.push(pCurr);

      if (i < rawNodes.length - 1) {
        const next = rawNodes[i + 1];
        const pNext = next.p3d.clone();
        const dy = pNext.y - pCurr.y;

        // A. XỬ LÝ LEO / XUỐNG CẦU THANG (THANG B, THANG BỘ MÔN, THANG HÀNH CHÍNH, THANG DÃY A)
        if (Math.abs(dy) > 1.2) {
          // Xác định vị trí lồng cầu thang để leo bậc mượt mà bên trong buồng thang
          let stairX = pCurr.x;
          let stairCorridorZ = pCurr.z;
          let stairInnerZ = stairCorridorZ - 2.4; // Đi sâu vào lòng tháp thang
          let stairMidZ = stairCorridorZ - 4.2;   // Chiếu nghỉ trung gian

          if (pCurr.x < -16 && pCurr.z < 10) {
            // Cầu thang Dãy B (x = -25.45)
            stairX = -25.45;
            stairCorridorZ = 1.0;
            stairInnerZ = -1.2;
            stairMidZ = -3.2;
          } else if (pCurr.x > 5 && pCurr.z < 10) {
            // Cầu thang Dãy Bộ Môn (x = 10.5)
            stairX = 10.5;
            stairCorridorZ = 1.0;
            stairInnerZ = -1.2;
            stairMidZ = -3.2;
          } else if (pCurr.z > 14) {
            // Cầu thang Dãy Hành Chính (x = -31.6)
            stairX = -31.6;
            stairCorridorZ = 22.5;
            stairInnerZ = 20.0;
            stairMidZ = 18.0;
          } else if (pCurr.z < -20) {
            // Cầu thang Dãy A
            stairX = pCurr.x < 0 ? -14.0 : 14.0;
            stairCorridorZ = -26.5;
            stairInnerZ = -28.8;
            stairMidZ = -30.8;
          }

          // 1. Bước vào cửa buồng cầu thang ở tầng xuất phát
          waypoints.push(new THREE.Vector3(stairX, pCurr.y, stairInnerZ));
          // 2. Leo đợt thang thứ nhất lên chiếu nghỉ giữa tầng
          waypoints.push(new THREE.Vector3(stairX - 0.7, pCurr.y + dy * 0.45, stairMidZ));
          // 3. Xoay người trên chiếu nghỉ trung gian
          waypoints.push(new THREE.Vector3(stairX + 0.7, pCurr.y + dy * 0.55, stairMidZ));
          // 4. Leo đợt thang thứ hai lên cửa tầng mới
          waypoints.push(new THREE.Vector3(stairX + 0.7, pCurr.y + dy * 0.95, stairInnerZ));
          // 5. Bước ra khỏi cửa buồng thang ở tầng mới
          waypoints.push(new THREE.Vector3(stairX, pNext.y, stairInnerZ));
          // 6. Bước ra mặt sàn hành lang tầng mới
          waypoints.push(new THREE.Vector3(stairX, pNext.y, stairCorridorZ));
          continue;
        }

        // B. XỬ LÝ ĐI DỌC CÁNH NỐI LIÊN THÔNG TÒA (TÂY: x = -22.5, ĐÔNG: x = 22.5)
        const dx = pNext.x - pCurr.x;
        const dz = pNext.z - pCurr.z;

        if (Math.abs(dx) < 1.0 && Math.abs(dz) > 15.0 && Math.abs(dy) < 0.5) {
          // Đi thẳng dọc theo cánh liên thông giữa z = 1.0 và z = -26.5
          waypoints.push(new THREE.Vector3(pCurr.x, pCurr.y, -8.0));
          waypoints.push(new THREE.Vector3(pCurr.x, pCurr.y, -18.0));
        } else if (Math.abs(dx) > 1.5 && Math.abs(dz) > 2.5 && Math.abs(dy) < 0.5) {
          // Bẻ góc vuông 90 độ đi theo hành lang ngang trước, sau đó rẽ vào trục dọc
          if (Math.abs(pCurr.z - 1.0) < 0.8) {
            // Đang ở hành lang Dãy B/BM (z = 1.0), đi ngang đến tim cầu nối rồi rẽ
            waypoints.push(new THREE.Vector3(pNext.x, pCurr.y, 1.0));
          } else if (Math.abs(pNext.z - 1.0) < 0.8) {
            // Đang đi tới hành lang Dãy B/BM (z = 1.0), đi dọc tới z=1.0 rồi rẽ ngang
            waypoints.push(new THREE.Vector3(pCurr.x, pCurr.y, 1.0));
          } else if (Math.abs(pCurr.z - (-26.5)) < 0.8) {
            // Đang ở hành lang Dãy A (z = -26.5), đi ngang đến tim cánh nối rồi rẽ
            waypoints.push(new THREE.Vector3(pNext.x, pCurr.y, -26.5));
          } else if (Math.abs(pNext.z - (-26.5)) < 0.8) {
            // Đang đi tới hành lang Dãy A (z = -26.5)
            waypoints.push(new THREE.Vector3(pCurr.x, pCurr.y, -26.5));
          } else if (Math.abs(pCurr.z - 22.5) < 0.8) {
            // Đang ở hành lang Dãy Hành Chính (z = 22.5)
            waypoints.push(new THREE.Vector3(pNext.x, pCurr.y, 22.5));
          } else if (Math.abs(pNext.z - 22.5) < 0.8) {
            // Đi tới hành lang Dãy Hành Chính (z = 22.5)
            waypoints.push(new THREE.Vector3(pCurr.x, pCurr.y, 22.5));
          }
        }
      }
    }

    return waypoints;
  }

  // Lấy vị trí 3D chính xác của một nút đồ thị nằm trên hành lang hoặc cầu thang
  get3DNodePosition(nid, fallbackNode, floorStr) {
    const fStr = floorStr || (fallbackNode && fallbackNode.floor) || 'tret';
    let floorY = 0.15;
    const f = String(fStr).toLowerCase();
    if (f.includes('4') || f.includes('lầu 3') || f.includes('fl_3') || f.includes('t4')) floorY = 10.95;
    else if (f.includes('3') || f.includes('lầu 2') || f.includes('fl_2') || f.includes('t3')) floorY = 7.35;
    else if (f.includes('2') || f.includes('lầu 1') || f.includes('fl_1') || f.includes('t2')) floorY = 3.75;
    else floorY = 0.15;

    // Tọa độ 3D chuẩn xác thực tế từng địa điểm trong trường học THPT Tam Phước
    const exact3DMap = {
      // Cổng trường & Sân chính
      "node_cong_truong": { x: 0, y: 0.15, z: 49.0 },
      "node_truoc_cong": { x: 0, y: 0.15, z: 45.0 },
      "node_nga_re_cong": { x: 0, y: 0.15, z: 45.0 },
      "node_san_truoc_hc": { x: -4.0, y: 0.15, z: 32.0 },
      "node_duong_xe_hc": { x: -15.0, y: 0.15, z: 32.0 },
      "node_truc_cong_bac": { x: 0, y: 0.15, z: 24.0 },
      "node_cot_co_entry": { x: 0, y: 0.15, z: 16.0 },
      "node_cot_co": { x: 0, y: 0.15, z: 11.0 },
      "node_truoc_cot_co": { x: 0, y: 0.15, z: 16.0 },
      "node_mai_tam_giac": { x: 0, y: 0.15, z: 4.2 },
      "node_san_giua_tay": { x: -7.0, y: 0.15, z: 4.2 },
      "node_san_giua_dong": { x: 7.0, y: 0.15, z: 4.2 },
      "node_nga_re_san_b": { x: -7.0, y: 0.15, z: 1.0 },
      "node_nga_re_san_bm": { x: 7.0, y: 0.15, z: 1.0 },

      // Hội trường & WC Hội Trường
      "node_hoi_truong": { x: 26.0, y: 0.15, z: 18.0 },
      "node_wc_hoi_truong": { x: 36.5, y: 0.15, z: 18.0 },
      "node_hl_ht_612": { x: 22.0, y: 0.15, z: 1.0 },
      "node_hl_ht_684": { x: 22.0, y: 0.15, z: 8.0 },
      "node_hl_ht_721": { x: 22.0, y: 0.15, z: 13.0 },
      "node_hl_ht_775": { x: 22.0, y: 0.15, z: 18.0 },
      "node_hl_ht_south": { x: 22.0, y: 0.15, z: 22.0 },
      "node_pk_10a13": { x: 28.0, y: 0.15, z: 28.0 },

      // Sảnh & Hành lang Dãy Hành Chính (Hiệu Bộ)
      "node_hc_sanh_truoc": { x: -31.2, y: 0.15, z: 24.5 },
      "node_hl_hc_east": { x: -17.0, y: 0.15, z: 22.5 },
      "node_hc_tret_td": { x: -18.5, y: 0.15, z: 22.5 },
      "node_hc_tret_tt": { x: -22.5, y: 0.15, z: 22.5 },
      "node_hc_tret_pht": { x: -26.5, y: 0.15, z: 22.5 },
      "node_hc_stair_tret": { x: -31.6, y: 0.15, z: 22.5 },
      "node_hc_tret_p2": { x: -36.0, y: 0.15, z: 22.5 },
      "node_hc_tret_p1": { x: -40.5, y: 0.15, z: 22.5 },
      "node_hc_tret_wc": { x: -44.0, y: 0.15, z: 22.5 },

      // Cầu thang Dãy Hành Chính
      "node_hc_stair_t2": { x: -31.6, y: 3.75, z: 22.5 },

      // Tầng 2 Dãy Hành Chính
      "node_hc_t2_cb": { x: -20.1, y: 3.75, z: 22.5 },
      "node_hc_t2_kt": { x: -26.5, y: 3.75, z: 22.5 },
      "node_hc_t2_vt": { x: -36.0, y: 3.75, z: 22.5 },
      "node_hc_t2_ht": { x: -40.5, y: 3.75, z: 22.5 },
      "node_hc_t2_wc": { x: -44.0, y: 3.75, z: 22.5 },

      // Cầu nối Tây Dãy B (Tòa 3) - Dãy Hành Chính (CHỈ Ở TẦNG TRỆT VÀ TẦNG 2)
      "node_hl_connect_b_hc": { x: -20.1, y: 0.15, z: 12.0 },
      "node_hl_connect_b_hc_t2": { x: -20.1, y: 3.75, z: 12.0 },

      // HÀNH LANG LIÊN THÔNG TÒA TÂY (TÒA 3 <-> TÒA 2 TRÊN TẤT CẢ CÁC TẦNG - x = -22.5)
      "node_hl_west_mid": { x: -22.5, y: 0.15, z: 1.0 },
      "node_hl_a_west": { x: -22.5, y: 0.15, z: -26.5 },
      "node_hl_west_t2": { x: -22.5, y: 3.75, z: 1.0 },
      "node_hl_a_west_t2": { x: -22.5, y: 3.75, z: -26.5 },
      "node_hl_west_t3": { x: -22.5, y: 7.35, z: 1.0 },
      "node_hl_a_west_t3": { x: -22.5, y: 7.35, z: -26.5 },
      "node_hl_west_t4": { x: -22.5, y: 10.95, z: 1.0 },
      "node_hl_a_west_t4": { x: -22.5, y: 10.95, z: -26.5 },
      "node_hl_west_south": { x: -22.5, y: 0.15, z: 12.0 },

      // HÀNH LANG LIÊN THÔNG TÒA ĐÔNG (TÒA 1 <-> TÒA 2 TRÊN TẤT CẢ CÁC TẦNG - x = 22.5)
      "node_hl_east_mid": { x: 22.5, y: 0.15, z: 1.0 },
      "node_hl_a_east": { x: 22.5, y: 0.15, z: -26.5 },
      "node_hl_east_t2": { x: 22.5, y: 3.75, z: 1.0 },
      "node_hl_a_east_t2": { x: 22.5, y: 3.75, z: -26.5 },
      "node_hl_east_t3": { x: 22.5, y: 7.35, z: 1.0 },
      "node_hl_a_east_t3": { x: 22.5, y: 7.35, z: -26.5 },
      "node_hl_east_t4": { x: 22.5, y: 10.95, z: 1.0 },
      "node_hl_a_east_t4": { x: 22.5, y: 10.95, z: -26.5 },

      // Dãy B (Tòa 3) - Tầng Trệt (Hành lang z = 1.0)
      "node_b_exit_west": { x: -43.0, y: 0.15, z: 1.0 },
      "node_loi_ra_day_b": { x: -43.0, y: 0.15, z: 1.0 },
      "node_b_tret_wc": { x: -41.55, y: 0.15, z: 1.0 },
      "node_b_tret_12a7": { x: -36.8, y: 0.15, z: 1.0 },
      "node_b_tret_12a8": { x: -31.2, y: 0.15, z: 1.0 },
      "node_b_stair_tret": { x: -25.45, y: 0.15, z: 1.0 },
      "node_b_tret_12a9": { x: -20.1, y: 0.15, z: 1.0 },
      "node_b_tret_12a10": { x: -14.5, y: 0.15, z: 1.0 },
      "node_b_tret_am_thanh": { x: -9.75, y: 0.15, z: 1.0 },

      // Cầu thang Dãy B (Tòa 3)
      "node_b_stair_t2": { x: -25.45, y: 3.75, z: 1.0 },
      "node_b_stair_t3": { x: -25.45, y: 7.35, z: 1.0 },
      "node_b_stair_t4": { x: -25.45, y: 10.95, z: 1.0 },

      // Dãy B (Tòa 3) - Tầng 2
      "node_b_t2_wc": { x: -41.55, y: 3.75, z: 1.0 },
      "node_b_t2_12a3": { x: -36.8, y: 3.75, z: 1.0 },
      "node_b_t2_12a4": { x: -31.2, y: 3.75, z: 1.0 },
      "node_b_t2_12a5": { x: -20.1, y: 3.75, z: 1.0 },
      "node_b_t2_12a6": { x: -14.5, y: 3.75, z: 1.0 },
      "node_b_t2_thi_vu": { x: -9.75, y: 3.75, z: 1.0 },

      // Dãy B (Tòa 3) - Tầng 3
      "node_b_t3_wc": { x: -41.55, y: 7.35, z: 1.0 },
      "node_b_t3_12a1": { x: -36.8, y: 7.35, z: 1.0 },
      "node_b_t3_12a2": { x: -31.2, y: 7.35, z: 1.0 },
      "node_b_t3_10a10": { x: -20.1, y: 7.35, z: 1.0 },
      "node_b_t3_10a9": { x: -14.5, y: 7.35, z: 1.0 },
      "node_b_t3_nghi_gv": { x: -9.75, y: 7.35, z: 1.0 },
      "node_b_t3_nghi_gv_nu": { x: -9.75, y: 7.35, z: 1.0 },

      // Dãy B (Tòa 3) - Tầng 4
      "node_b_t4_wc": { x: -41.55, y: 10.95, z: 1.0 },
      "node_b_t4_p14": { x: -36.8, y: 10.95, z: 1.0 },
      "node_b_t4_p15": { x: -31.2, y: 10.95, z: 1.0 },
      "node_b_t4_p16": { x: -20.1, y: 10.95, z: 1.0 },
      "node_b_t4_media": { x: -14.5, y: 10.95, z: 1.0 },
      "node_b_t4_nghi_gv": { x: -9.75, y: 10.95, z: 1.0 },
      "node_b_t4_nghi_gv_nam": { x: -9.75, y: 10.95, z: 1.0 },

      // Dãy Bộ Môn (Tòa 1) - Tầng Trệt (Hành lang z = 1.0)
      "node_bm_stair_tret": { x: 10.5, y: 0.15, z: 1.0 },
      "node_bm_tret_yte": { x: 16.1, y: 0.15, z: 1.0 },
      "node_bm_tret_ly": { x: 23.0, y: 0.15, z: 1.0 },
      "node_bm_tret_hoa": { x: 31.2, y: 0.15, z: 1.0 },
      "node_bm_tret_wc": { x: 37.25, y: 0.15, z: 1.0 },

      // Cầu thang Dãy Bộ Môn (Tòa 1)
      "node_bm_stair_t2": { x: 10.5, y: 3.75, z: 1.0 },
      "node_bm_stair_t3": { x: 10.5, y: 7.35, z: 1.0 },
      "node_bm_stair_t4": { x: 10.5, y: 10.95, z: 1.0 },

      // Dãy Bộ Môn (Tòa 1) - Tầng 2
      "node_bm_t2_qp": { x: 16.05, y: 3.75, z: 1.0 },
      "node_bm_t2_doan": { x: 21.55, y: 3.75, z: 1.0 },
      "node_bm_t2_tin1": { x: 27.05, y: 3.75, z: 1.0 },
      "node_bm_t2_tin2": { x: 32.55, y: 3.75, z: 1.0 },
      "node_bm_t2_wc": { x: 37.25, y: 3.75, z: 1.0 },

      // Dãy Bộ Môn (Tòa 1) - Tầng 3
      "node_bm_t3_tam_ly": { x: 16.05, y: 7.35, z: 1.0 },
      "node_bm_t3_anh_van": { x: 21.55, y: 7.35, z: 1.0 },
      "node_bm_t3_may1": { x: 27.05, y: 7.35, z: 1.0 },
      "node_bm_t3_may2": { x: 32.55, y: 7.35, z: 1.0 },
      "node_bm_t3_wc": { x: 37.25, y: 7.35, z: 1.0 },

      // Dãy Bộ Môn (Tòa 1) - Tầng 4
      "node_bm_t4_luu_tru": { x: 16.1, y: 10.95, z: 1.0 },
      "node_bm_t4_tin4": { x: 23.0, y: 10.95, z: 1.0 },
      "node_bm_t4_av": { x: 31.2, y: 10.95, z: 1.0 },
      "node_bm_t4_wc": { x: 37.25, y: 10.95, z: 1.0 },

      // Cầu thang Dãy A (Tòa 2) - Hỗ trợ cả mã a1/a2 và a_stair1/a_stair2
      "node_a1_stair_tret": { x: -14.0, y: 0.15, z: -26.5 },
      "node_a1_stair_t2": { x: -14.0, y: 3.75, z: -26.5 },
      "node_a1_stair_t3": { x: -14.0, y: 7.35, z: -26.5 },
      "node_a1_stair_t4": { x: -14.0, y: 10.95, z: -26.5 },
      "node_a_stair1_tret": { x: -14.0, y: 0.15, z: -26.5 },
      "node_a_stair1_t2": { x: -14.0, y: 3.75, z: -26.5 },
      "node_a_stair1_t3": { x: -14.0, y: 7.35, z: -26.5 },
      "node_a_stair1_t4": { x: -14.0, y: 10.95, z: -26.5 },

      "node_a2_stair_tret": { x: 14.0, y: 0.15, z: -26.5 },
      "node_a2_stair_t2": { x: 14.0, y: 3.75, z: -26.5 },
      "node_a2_stair_t3": { x: 14.0, y: 7.35, z: -26.5 },
      "node_a2_stair_t4": { x: 14.0, y: 10.95, z: -26.5 },
      "node_a_stair2_tret": { x: 14.0, y: 0.15, z: -26.5 },
      "node_a_stair2_t2": { x: 14.0, y: 3.75, z: -26.5 },
      "node_a_stair2_t3": { x: 14.0, y: 7.35, z: -26.5 },
      "node_a_stair2_t4": { x: 14.0, y: 10.95, z: -26.5 },

      // Dãy A (Tòa 2) - Tầng Trệt (Hành lang z = -26.5)
      "node_a_tret_wc_l": { x: -30.25, y: 0.15, z: -26.5 },
      "node_a_tret_10a7": { x: -25.5, y: 0.15, z: -26.5 },
      "node_a_tret_10a8": { x: -19.9, y: 0.15, z: -26.5 },
      "node_a_tret_tv": { x: 0.0, y: 0.15, z: -26.5 },
      "node_a_tret_11a9": { x: 14.5, y: 0.15, z: -26.5 },
      "node_a_tret_11a10": { x: 20.1, y: 0.15, z: -26.5 },
      "node_a_tret_wc_r": { x: 24.85, y: 0.15, z: -26.5 },

      // Dãy A (Tòa 2) - Tầng 2
      "node_a_t2_wc_l": { x: -30.25, y: 3.75, z: -26.5 },
      "node_a_t2_10a6": { x: -25.5, y: 3.75, z: -26.5 },
      "node_a_t2_10a5": { x: -19.9, y: 3.75, z: -26.5 },
      "node_a_t2_10a4": { x: -8.3, y: 3.75, z: -26.5 },
      "node_a_t2_11a8": { x: -2.7, y: 3.75, z: -26.5 },
      "node_a_t2_11a7": { x: 2.9, y: 3.75, z: -26.5 },
      "node_a_t2_11a6": { x: 14.5, y: 3.75, z: -26.5 },
      "node_a_t2_11a5": { x: 20.1, y: 3.75, z: -26.5 },
      "node_a_t2_wc_r": { x: 24.85, y: 3.75, z: -26.5 },

      // Dãy A (Tòa 2) - Tầng 3
      "node_a_t3_wc_l": { x: -30.25, y: 7.35, z: -26.5 },
      "node_a_t3_10a1": { x: -25.5, y: 7.35, z: -26.5 },
      "node_a_t3_10a2": { x: -19.9, y: 7.35, z: -26.5 },
      "node_a_t3_10a3": { x: -8.3, y: 7.35, z: -26.5 },
      "node_a_t3_11a1": { x: -2.7, y: 7.35, z: -26.5 },
      "node_a_t3_11a2": { x: 2.9, y: 7.35, z: -26.5 },
      "node_a_t3_11a3": { x: 14.5, y: 7.35, z: -26.5 },
      "node_a_t3_11a4": { x: 20.1, y: 7.35, z: -26.5 },
      "node_a_t3_wc_r": { x: 24.85, y: 7.35, z: -26.5 },

      // Dãy A (Tòa 2) - Tầng 4
      "node_a_t4_wc_l": { x: -30.25, y: 10.95, z: -26.5 },
      "node_a_t4_ben_su_dia": { x: -25.5, y: 10.95, z: -26.5 },
      "node_a_t4_su_dia": { x: -19.9, y: 10.95, z: -26.5 },
      "node_a_t4_p38": { x: -8.3, y: 10.95, z: -26.5 },
      "node_a_t4_p39": { x: -2.7, y: 10.95, z: -26.5 },
      "node_a_t4_10a13": { x: 2.9, y: 10.95, z: -26.5 },
      "node_a_t4_10a12": { x: 14.5, y: 10.95, z: -26.5 },
      "node_a_t4_10a11": { x: 20.1, y: 10.95, z: -26.5 },
      "node_a_t4_wc_r": { x: 24.85, y: 10.95, z: -26.5 },

      // Nhà xe GV & Bãi xe
      "node_nha_xe_gv": { x: -44.0, y: 0.15, z: 38.0 },
      "node_truoc_nha_xe_gv": { x: -44.0, y: 0.15, z: 38.0 }
    };

    if (nid && exact3DMap[nid]) {
      const p = exact3DMap[nid];
      return new THREE.Vector3(p.x, p.y, p.z);
    }

    // 2. Fallback định vị theo tiền tố để luôn nằm trên hành lang của tòa nhà
    if (nid) {
      if (nid.startsWith('node_b_')) {
        let x = -25.45;
        if (fallbackNode) {
          x = -43.0 + ((fallbackNode.x - 223) / (502 - 223)) * 33.25;
        }
        return new THREE.Vector3(x, floorY, 1.0);
      }
      if (nid.startsWith('node_bm_')) {
        let x = 21.0;
        if (fallbackNode) {
          x = 10.5 + ((fallbackNode.x - 973) / (1290 - 973)) * (37.25 - 10.5);
        }
        return new THREE.Vector3(x, floorY, 1.0);
      }
      if (nid.startsWith('node_hc_')) {
        let x = -31.2;
        if (fallbackNode) {
          x = -44.0 + ((fallbackNode.x - 138) / (442 - 138)) * 27.0;
        }
        return new THREE.Vector3(x, floorY, 22.5);
      }
      if (nid.startsWith('node_a_')) {
        let x = 0;
        if (fallbackNode) {
          x = -32.0 + ((fallbackNode.x - 423) / (1001 - 423)) * 66.0;
        }
        return new THREE.Vector3(x, floorY, -26.5);
      }
    }

    // 3. Fallback mặc định theo tỉ lệ khuôn viên
    if (fallbackNode) {
      const x3d = (fallbackNode.x - 740) * 0.058;
      const z3d = (fallbackNode.y - 650) * 0.075;
      return new THREE.Vector3(x3d, floorY, z3d);
    }

    return new THREE.Vector3(0, floorY, 0);
  }

  // Tạo nhân vật học sinh 3D Navigator với đồng phục áo trắng, quần tây, balo và hiệu ứng bước chân
  createTourAvatar() {
    const avatarGroup = new THREE.Group();
    avatarGroup.name = "TourAvatar";

    // Bảng màu đồng phục học sinh THPT Tam Phước:
    // Áo sơ mi trắng tinh, quần tây xanh đen sẫm, balo học sinh xanh dương đậm
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.6 });

    // 1. Thân áo sơ mi trắng (Torso)
    const torsoGeo = new THREE.BoxGeometry(0.42, 0.54, 0.24);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.08;
    torso.castShadow = true;
    avatarGroup.add(torso);

    // Cà vạt / Viền cổ áo xanh học sinh
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.05), collarMat);
    collar.position.set(0, 1.15, 0.12);
    avatarGroup.add(collar);

    // 2. Balo học sinh trên lưng
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.16), bagMat);
    bag.position.set(0, 1.06, -0.18);
    bag.castShadow = true;
    avatarGroup.add(bag);

    // Quai balo
    [-0.14, 0.14].forEach(bx => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), collarMat);
      strap.position.set(bx, 1.08, 0.10);
      avatarGroup.add(strap);
    });

    // 3. Đầu & Tóc (Head & Hair)
    const headGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.50;
    head.castShadow = true;
    avatarGroup.add(head);

    // Mái tóc đen gọn gàng
    const hairGeo = new THREE.SphereGeometry(0.16, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.52, -0.01);
    avatarGroup.add(hair);

    // 4. Hai chân có khớp xoay (Left & Right Leg pivots for walking)
    const legGeo = new THREE.BoxGeometry(0.14, 0.60, 0.14);
    legGeo.translate(0, -0.30, 0); // Đặt pivot tại khớp háng

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.11, 0.82, 0);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);
    // Giày trái
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.22), shoeMat);
    leftShoe.position.set(0, -0.62, 0.04);
    leftLegGroup.add(leftShoe);
    avatarGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.11, 0.82, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);
    // Giày phải
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.22), shoeMat);
    rightShoe.position.set(0, -0.62, 0.04);
    rightLegGroup.add(rightShoe);
    avatarGroup.add(rightLegGroup);

    // 5. Hai tay có khớp xoay (Left & Right Arm pivots for walking)
    const armGeo = new THREE.BoxGeometry(0.10, 0.48, 0.10);
    armGeo.translate(0, -0.24, 0); // Pivot tại vai

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.26, 1.30, 0);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);
    avatarGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.26, 1.30, 0);
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);
    avatarGroup.add(rightArmGroup);

    // 6. Vòng chỉ thị định vị phát sáng trên đầu (Navigator Beacon Halo)
    const haloGeo = new THREE.RingGeometry(0.32, 0.45, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 1.95;
    avatarGroup.add(halo);

    // Lưu trữ tham chiếu bộ phận cho animation bước đi
    avatarGroup.userData = {
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
      leftArm: leftArmGroup,
      rightArm: rightArmGroup,
      halo: halo
    };

    return avatarGroup;
  }

  // =========================================================================
  // 🚶 BỘ ĐIỀU KHIỂN CHẾ ĐỘ ĐI THỬ 3D CHÂN THỰC (WALKTHROUGH SIMULATOR)
  // =========================================================================
  startTour() {
    if (!this.activeCurve) {
      // Tuyến mặc định mẫu: Cổng trường -> Phòng 12A5 (Tầng 2 Dãy B)
      const r = this.draw3DRoute('cong_truong', 'b_t2_12a5');
      if (!this.activeCurve) return;
    }

    // Hiển thị tất cả các tầng để không bị ẩn tường hay mái che trong lúc đi tham quan
    if (typeof this.filterFloor === 'function') {
      this.filterFloor('all');
    }

    // 1. Lưu lại trạng thái camera trước khi đi thử để khôi phục khi kết thúc
    this.savedCameraState = {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      fov: this.camera.fov,
      near: this.camera.near
    };

    // 2. Chuyển đổi camera sang chế độ đi bộ tham quan
    this.tourActive = true;
    this.tourPaused = false;
    this.tourProgress = 0;
    this.controls.enabled = false; // Vô hiệu hóa OrbitControls tạm thời để camera bám tuyến mượt mà
    this.camera.fov = this.walkFov || 72; // Góc nhìn rộng 72 độ
    this.camera.near = 0.08; // Tránh clipping thủng tường
    this.camera.updateProjectionMatrix();

    // 3. Thời lượng tour tính theo độ dài tuyến
    const dist = (this.activeRoute && this.activeRoute.totalDistanceMeters) || 60;
    this.tourDuration = Math.max(12000, dist * 220);
    this.lastTourTime = performance.now();

    // 4. Kích hoạt hiển thị nhân vật Avatar nếu không phải góc nhìn thứ nhất
    if (this.tourAvatar) {
      this.tourAvatar.visible = (this.tourViewMode !== 'firstPerson');
    }

    // 5. Mở thanh Walkthrough HUD
    const hud = document.getElementById('tour-hud-bar');
    if (hud) hud.classList.remove('hidden');
    document.body.classList.add('tour-active-3d');

    const pauseIcon = document.getElementById('tour-icon-pause');
    const pauseText = document.getElementById('tour-text-pause');
    if (pauseIcon) pauseIcon.textContent = '⏸️';
    if (pauseText) pauseText.textContent = 'Tạm dừng';

    this.updateTourUI();
  }

  updateTourStep() {
    if (!this.tourActive || !this.activeCurve) return;
    if (this.tourPaused) {
      this.lastTourTime = performance.now();
      return;
    }

    const now = performance.now();
    const dt = (now - this.lastTourTime) * (this.tourSpeed || 1.0);
    this.lastTourTime = now;

    this.tourProgress += dt / this.tourDuration;

    if (this.tourProgress >= 1) {
      this.tourProgress = 1;
      this.tourPaused = true;
      const pauseIcon = document.getElementById('tour-icon-pause');
      const pauseText = document.getElementById('tour-text-pause');
      if (pauseIcon) pauseIcon.textContent = '🔄';
      if (pauseText) pauseText.textContent = 'Đi lại';
      const locEl = document.getElementById('tour-current-loc');
      if (locEl) locEl.textContent = `🎯 Đã đến: ${this.activeRoute?.destLoc?.name || 'Điểm đến'}`;
    }

    // Tọa độ vị trí hiện tại và điểm nhìn phía trước dọc theo đường cong
    const currentPoint = this.activeCurve.getPointAt(this.tourProgress);
    const forwardProgress = Math.min(this.tourProgress + 0.035, 1.0);
    const lookPoint = this.activeCurve.getPointAt(forwardProgress);

    // Vector hướng di chuyển theo mặt phẳng ngang
    const forwardDir = new THREE.Vector3().subVectors(lookPoint, currentPoint);
    forwardDir.y = 0;
    if (forwardDir.lengthSq() < 0.0001) {
      forwardDir.set(0, 0, 1);
    } else {
      forwardDir.normalize();
    }

    // 1. Cập nhật vị trí, hướng quay và nhịp bước chân của Avatar 3D
    if (this.tourAvatar) {
      this.tourAvatar.position.copy(currentPoint);
      const heading = Math.atan2(forwardDir.x, forwardDir.z);
      this.tourAvatar.rotation.y = heading;

      // Hiệu ứng bước chân đung đưa tự nhiên khi di chuyển
      const walkCycle = this.tourProgress * Math.PI * 40;
      if (this.tourAvatar.userData.leftLeg) {
        this.tourAvatar.userData.leftLeg.rotation.x = Math.sin(walkCycle) * 0.55;
        this.tourAvatar.userData.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.55;
        this.tourAvatar.userData.leftArm.rotation.x = -Math.sin(walkCycle) * 0.45;
        this.tourAvatar.userData.rightArm.rotation.x = Math.sin(walkCycle) * 0.45;
      }
    }

    // 2. Điều khiển Camera theo các góc nhìn thực tế
    if (this.tourViewMode === 'firstPerson') {
      // GÓC NHÌN MẮT NGƯỜI ĐI BỘ (FIRST-PERSON):
      if (this.tourAvatar) this.tourAvatar.visible = false;

      // Nhịp bước chân nhẹ nhàng mô phỏng chuyển động thực tế
      const headBob = Math.sin(this.tourProgress * Math.PI * 48) * 0.028;
      const eyeY = currentPoint.y + 1.55 + headBob;
      this.camera.position.set(currentPoint.x, eyeY, currentPoint.z);

      // Điểm nhìn hướng thẳng về phía trước theo hành lang
      const targetDist = 5.5;
      const targetLook = new THREE.Vector3(
        currentPoint.x + forwardDir.x * targetDist,
        eyeY * 0.98,
        currentPoint.z + forwardDir.z * targetDist
      );
      this.camera.lookAt(targetLook);
    } else if (this.tourViewMode === 'birdEye') {
      // GÓC NHÌN TOÀN CẢNH TRÊN CAO (BIRD'S EYE VIEW):
      if (this.tourAvatar) this.tourAvatar.visible = true;

      const camHeight = 16.0;
      const camPos = new THREE.Vector3(
        currentPoint.x - 8.0,
        currentPoint.y + camHeight,
        currentPoint.z + 14.0
      );
      this.camera.position.copy(camPos);
      this.camera.lookAt(currentPoint.x, currentPoint.y + 1.0, currentPoint.z);
    } else {
      // GÓC NHÌN BÁM THEO SAU LƯNG (THIRD-PERSON COMPACT FOLLOW):
      if (this.tourAvatar) this.tourAvatar.visible = true;

      // Khoảng cách theo sát 2.4m, nằm gọn bên trong lòng hành lang (không bị cấn xuyên tường phía sau)
      const followDist = 2.4;
      const camHeight = 1.65;
      const camPos = new THREE.Vector3(
        currentPoint.x - forwardDir.x * followDist,
        currentPoint.y + camHeight,
        currentPoint.z - forwardDir.z * followDist
      );
      this.camera.position.copy(camPos);
      this.camera.lookAt(
        currentPoint.x + forwardDir.x * 1.5,
        currentPoint.y + 1.25,
        currentPoint.z + forwardDir.z * 1.5
      );
    }

    this.updateTourUI();
  }

  updateTourUI() {
    const pct = Math.min(100, Math.max(0, Math.round(this.tourProgress * 100)));
    const fillEl = document.getElementById('tour-progress-fill');
    const textEl = document.getElementById('tour-progress-text');
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (textEl) textEl.textContent = `${pct}%`;

    // Cập nhật vị trí thời gian thực trên thanh HUD
    const locEl = document.getElementById('tour-current-loc');
    if (locEl && this.activeRoute) {
      if (pct <= 4) {
        locEl.textContent = `🟢 Bắt đầu: ${this.activeRoute.startLoc?.name || 'Điểm xuất phát'}`;
      } else if (pct >= 98) {
        locEl.textContent = `🎯 Đã tới: ${this.activeRoute.destLoc?.name || 'Đích đến'}`;
      } else {
        const steps = this.activeRoute.instructions;
        if (steps && steps.length > 0) {
          const stepIdx = Math.min(steps.length - 1, Math.floor(this.tourProgress * steps.length));
          const step = steps[stepIdx];
          locEl.textContent = `${step.icon || '🚶'} ${step.title || step.badge || 'Đang di chuyển'}`;
        }
      }
    }
  }

  toggleTourPause() {
    if (!this.tourActive) return;
    if (this.tourProgress >= 1) {
      this.restartTour();
      return;
    }
    this.tourPaused = !this.tourPaused;
    const pauseIcon = document.getElementById('tour-icon-pause');
    const pauseText = document.getElementById('tour-text-pause');
    if (pauseIcon) pauseIcon.textContent = this.tourPaused ? '▶️' : '⏸️';
    if (pauseText) pauseText.textContent = this.tourPaused ? 'Tiếp tục' : 'Tạm dừng';
    this.lastTourTime = performance.now();
  }

  restartTour() {
    this.tourProgress = 0;
    this.tourPaused = false;
    this.lastTourTime = performance.now();
    const pauseIcon = document.getElementById('tour-icon-pause');
    const pauseText = document.getElementById('tour-text-pause');
    if (pauseIcon) pauseIcon.textContent = '⏸️';
    if (pauseText) pauseText.textContent = 'Tạm dừng';
    this.updateTourUI();
  }

  setTourSpeed(speed, btn) {
    this.tourSpeed = Number(speed) || 1.0;
    document.querySelectorAll('.tour-speed-group .tour-pill-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  setTourViewMode(mode, btn) {
    this.tourViewMode = mode;
    document.querySelectorAll('.tour-view-group .tour-pill-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (this.tourAvatar) {
      this.tourAvatar.visible = (this.tourActive && mode !== 'firstPerson');
    }
  }

  seekTourByClick(event, trackEl) {
    if (!trackEl || !this.activeCurve) return;
    const rect = trackEl.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    this.tourProgress = ratio;
    this.lastTourTime = performance.now();
    this.updateTourUI();
  }

  stopTour() {
    if (!this.tourActive && !this.savedCameraState) return;
    this.tourActive = false;
    this.tourPaused = false;
    this.controls.enabled = true; // Bật lại OrbitControls

    // Ẩn nhân vật Avatar khi dừng tour
    if (this.tourAvatar) {
      this.tourAvatar.visible = false;
    }

    // Khôi phục trạng thái camera ban đầu
    if (this.savedCameraState) {
      this.camera.fov = this.savedCameraState.fov;
      this.camera.near = this.savedCameraState.near;
      this.camera.updateProjectionMatrix();
      this.tweenCamera(this.savedCameraState.position, this.savedCameraState.target, 800);
      this.savedCameraState = null;
    }

    // Ẩn thanh HUD
    const hud = document.getElementById('tour-hud-bar');
    if (hud) hud.classList.add('hidden');
    document.body.classList.remove('tour-active-3d');
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
