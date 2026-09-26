/**
 * app.js - Xử lý Giao diện Tương tác, Combobox Tìm kiếm, Pan/Zoom Bản đồ và Quét mã QR
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. KHỞI TẠO HỆ THỐNG
  const router = new CampusRouter(
    window.CAMPUS_GRAPH_NODES,
    window.CAMPUS_GRAPH_EDGES,
    window.CAMPUS_LOCATIONS
  );

  // Tham chiếu DOM
  const mapViewport = document.getElementById("map-viewport");
  const mapSvgWrapper = document.getElementById("map-svg-wrapper");
  const mainMapSvg = document.getElementById("main-map");
  const navOverlayLayer = document.getElementById("nav-overlay-layer");

  // Form & Combobox elements
  const startInput = document.getElementById("start-location-input");
  const startDropdown = document.getElementById("start-location-dropdown");
  const startClearBtn = document.getElementById("start-clear-btn");

  const destInput = document.getElementById("dest-location-input");
  const destDropdown = document.getElementById("dest-location-dropdown");
  const destClearBtn = document.getElementById("dest-clear-btn");

  const btnSubmitRoute = document.getElementById("btn-submit-route");
  const btnSwapRoute = document.getElementById("btn-swap-route");
  const btnResetAll = document.getElementById("btn-reset-all");

  const resultsCard = document.getElementById("results-card");
  const resultsTimeline = document.getElementById("results-timeline");
  const routeDistanceEl = document.getElementById("route-distance");
  const routeTimeEl = document.getElementById("route-time");
  const routeFloorBadge = document.getElementById("route-floor-badge");

  const qrSourceBanner = document.getElementById("qr-source-banner");
  const qrSourceName = document.getElementById("qr-source-name");
  const btnCloseQrBanner = document.getElementById("btn-close-qr-banner");

  const sidebar = document.getElementById("sidebar");
  const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");

  // Modal QR Generator
  const qrModal = document.getElementById("qr-modal");
  const btnOpenQrModal = document.getElementById("btn-open-qr-modal");
  const btnCloseQrModal = document.getElementById("btn-close-qr-modal");
  const qrLocationSelect = document.getElementById("qr-location-select");
  const qrPreviewBox = document.getElementById("qr-preview-box");
  const qrCardLocTitle = document.getElementById("qr-card-loc-title");
  const btnPrintQr = document.getElementById("btn-print-qr");

  // Trạng thái ứng dụng
  let selectedStartLoc = null;
  let selectedDestLoc = null;
  let currentRoute = null;

  // Trạng thái Pan & Zoom bản đồ SVG
  let transform = { x: 0, y: 0, scale: 1 };
  let isDragging = false;
  let startPan = { x: 0, y: 0 };
  let initialPinchDistance = null;

  // 2. HÀM CHUẨN HÓA TÌM KIẾM TIẾNG VIỆT (BỎ DẤU)
  function removeVietnameseTones(str) {
    if (!str) return "";
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
    str = str.replace(/\u02C6|\u0306|\u031B/g, "");
    return str.trim();
  }

  // 3. COMBOBOX THÔNG MINH CÓ TÌM KIẾM
  class ComboboxController {
    constructor(inputEl, dropdownEl, clearBtnEl, onSelect, getExcludeLocation) {
      this.inputEl = inputEl;
      this.dropdownEl = dropdownEl;
      this.clearBtnEl = clearBtnEl;
      this.onSelect = onSelect;
      this.getExcludeLocation = getExcludeLocation; // Hàm lấy đối tượng cần loại trừ
      this.selectedLocation = null;
      this.focusedIndex = -1;
      this.filteredItems = [];

      this.initEvents();
    }

    initEvents() {
      // Focus vào input -> mở dropdown
      this.inputEl.addEventListener("focus", () => {
        this.renderDropdown(this.inputEl.value);
        this.showDropdown();
      });

      // Gõ tìm kiếm
      this.inputEl.addEventListener("input", () => {
        this.clearBtnEl.style.display = this.inputEl.value ? "block" : "none";
        this.renderDropdown(this.inputEl.value);
        this.showDropdown();
      });

      // Phím điều hướng
      this.inputEl.addEventListener("keydown", (e) => {
        if (!this.dropdownEl.classList.contains("active")) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          this.focusItem(this.focusedIndex + 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          this.focusItem(this.focusedIndex - 1);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (this.focusedIndex >= 0 && this.filteredItems[this.focusedIndex]) {
            this.selectLocation(this.filteredItems[this.focusedIndex]);
          }
        } else if (e.key === "Escape") {
          this.hideDropdown();
        }
      });

      // Nút xóa input
      this.clearBtnEl.addEventListener("click", () => {
        this.clear();
      });

      // Bấm ra ngoài -> ẩn dropdown
      document.addEventListener("click", (e) => {
        if (!this.inputEl.contains(e.target) && !this.dropdownEl.contains(e.target)) {
          this.hideDropdown();
        }
      });
    }

    renderDropdown(searchTerm = "") {
      const normalizedSearch = removeVietnameseTones(searchTerm);
      this.dropdownEl.innerHTML = "";
      this.focusedIndex = -1;

      // Lấy ID vị trí cần loại trừ (ví dụ chọn Nơi hiện tại thì Nơi đến sẽ không có Nơi hiện tại)
      const excludeLoc = this.getExcludeLocation ? this.getExcludeLocation() : null;
      const excludeId = excludeLoc ? excludeLoc.id : null;

      // Lọc danh sách theo tên, vị trí, tầng hoặc từ khóa
      this.filteredItems = window.CAMPUS_LOCATIONS.filter(loc => {
        // LOẠI TRỪ VỊ TRÍ ĐÃ ĐƯỢC CHỌN Ở Ô CÒN LẠI
        if (excludeId && loc.id === excludeId) return false;

        if (!normalizedSearch) return true;
        const normName = removeVietnameseTones(loc.name);
        const normDesc = removeVietnameseTones(loc.description || "");
        const normFloor = removeVietnameseTones(loc.floor);
        const normKeywords = (loc.keywords || []).map(k => removeVietnameseTones(k)).join(" ");
        
        return normName.includes(normalizedSearch) ||
               normDesc.includes(normalizedSearch) ||
               normFloor.includes(normalizedSearch) ||
               normKeywords.includes(normalizedSearch);
      });

      if (this.filteredItems.length === 0) {
        this.dropdownEl.innerHTML = `<div class="dropdown-empty">Không tìm thấy địa điểm phù hợp</div>`;
        return;
      }

      // Nhóm theo Category
      const groups = {};
      this.filteredItems.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      });

      let itemIndex = 0;
      for (const cat in groups) {
        const catTitle = document.createElement("div");
        catTitle.className = "dropdown-category-title";
        catTitle.textContent = cat;
        this.dropdownEl.appendChild(catTitle);

        groups[cat].forEach(loc => {
          const itemEl = document.createElement("div");
          itemEl.className = "dropdown-item";
          itemEl.dataset.index = itemIndex;

          itemEl.innerHTML = `
            <div class="dropdown-item-left">
              <span class="dropdown-item-name">${loc.name}</span>
              <span class="dropdown-item-desc">${loc.floor} • ${loc.building}</span>
            </div>
            <span class="dropdown-item-badge">${loc.floor}</span>
          `;

          itemEl.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this.selectLocation(loc);
          });

          this.dropdownEl.appendChild(itemEl);
          itemIndex++;
        });
      }
    }

    focusItem(newIndex) {
      const items = this.dropdownEl.querySelectorAll(".dropdown-item");
      if (items.length === 0) return;

      if (newIndex >= items.length) newIndex = 0;
      if (newIndex < 0) newIndex = items.length - 1;

      items.forEach(el => el.classList.remove("focused"));
      this.focusedIndex = newIndex;
      const targetEl = items[this.focusedIndex];
      if (targetEl) {
        targetEl.classList.add("focused");
        targetEl.scrollIntoView({ block: "nearest" });
      }
    }

    selectLocation(loc) {
      this.selectedLocation = loc;
      this.inputEl.value = loc.name;
      this.clearBtnEl.style.display = "block";
      this.hideDropdown();
      if (this.onSelect) this.onSelect(loc);
    }

    setLocationById(locId) {
      const loc = window.CAMPUS_LOCATIONS.find(l => l.id === locId);
      if (loc) {
        this.selectLocation(loc);
        return true;
      }
      return false;
    }

    clear() {
      this.selectedLocation = null;
      this.inputEl.value = "";
      this.clearBtnEl.style.display = "none";
      this.hideDropdown();
      if (this.onSelect) this.onSelect(null);
    }

    showDropdown() {
      this.dropdownEl.classList.add("active");
    }

    hideDropdown() {
      this.dropdownEl.classList.remove("active");
    }
  }

  // Khởi tạo 2 combobox liên kết loại trừ nhau
  const startCombobox = new ComboboxController(
    startInput,
    startDropdown,
    startClearBtn,
    (loc) => {
      selectedStartLoc = loc;
      // Nếu nơi đến đang trùng với nơi hiện tại vừa chọn -> tự động xóa nơi đến
      if (selectedDestLoc && loc && selectedDestLoc.id === loc.id) {
        destCombobox.clear();
        selectedDestLoc = null;
      }
      highlightMarkerOnMap();
    },
    () => selectedDestLoc // Loại trừ nơi đến khỏi danh sách nơi hiện tại
  );

  const destCombobox = new ComboboxController(
    destInput,
    destDropdown,
    destClearBtn,
    (loc) => {
      selectedDestLoc = loc;
      // Nếu nơi hiện tại đang trùng với nơi đến vừa chọn -> tự động xóa nơi hiện tại
      if (selectedStartLoc && loc && selectedStartLoc.id === loc.id) {
        startCombobox.clear();
        selectedStartLoc = null;
      }
      highlightMarkerOnMap();
    },
    () => selectedStartLoc // Loại trừ nơi hiện tại khỏi danh sách nơi đến
  );

  // 4. PAN & ZOOM BẢN ĐỒ SVG
  function updateMapTransform() {
    mapSvgWrapper.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  }

  function zoomMap(delta, centerX, centerY) {
    const oldScale = transform.scale;
    let newScale = oldScale + delta;
    newScale = Math.min(Math.max(newScale, 0.15), 4.0);

    if (centerX === undefined || centerY === undefined) {
      const rect = mapViewport.getBoundingClientRect();
      centerX = rect.width / 2;
      centerY = rect.height / 2;
    }

    // Zoom hướng về tâm trỏ chuột
    transform.x = centerX - (centerX - transform.x) * (newScale / oldScale);
    transform.y = centerY - (centerY - transform.y) * (newScale / oldScale);
    transform.scale = newScale;

    updateMapTransform();
  }

  function resetMapView() {
    const viewportRect = mapViewport.getBoundingClientRect();
    const mapWidth = 1600;
    const mapHeight = 1120;

    const isMobile = window.innerWidth <= 768;
    // Trên iPhone / mobile, vùng bản đồ hiển thị rõ nhất nằm phía trên Bottom Sheet
    const visibleHeight = isMobile ? viewportRect.height * 0.46 : viewportRect.height;
    const padding = isMobile ? 12 : 30;

    const scaleX = (viewportRect.width - padding * 2) / mapWidth;
    const scaleY = (visibleHeight - padding * 2) / mapHeight;
    const fitScale = Math.min(scaleX, scaleY);

    transform.scale = fitScale;
    transform.x = (viewportRect.width - mapWidth * fitScale) / 2;
    transform.y = (visibleHeight - mapHeight * fitScale) / 2;

    updateMapTransform();
  }

  // Sự kiện kéo rê chuột (Pan)
  mapViewport.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Chỉ nhận chuột trái
    isDragging = true;
    startPan = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    transform.x = e.clientX - startPan.x;
    transform.y = e.clientY - startPan.y;
    updateMapTransform();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Lăn chuột zoom (Wheel)
  mapViewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = mapViewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 0.12 : -0.12;
    zoomMap(zoomFactor, mouseX, mouseY);
  }, { passive: false });

  // Hỗ trợ Touch trên Mobile (Pan & Pinch to zoom)
  let touchStartDist = 0;
  mapViewport.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startPan = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y };
    } else if (e.touches.length === 2) {
      isDragging = false;
      touchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  mapViewport.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && isDragging) {
      transform.x = e.touches[0].clientX - startPan.x;
      transform.y = e.touches[0].clientY - startPan.y;
      updateMapTransform();
    } else if (e.touches.length === 2) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartDist > 0) {
        const factor = (currentDist - touchStartDist) * 0.005;
        zoomMap(factor);
        touchStartDist = currentDist;
      }
    }
  }, { passive: true });

  mapViewport.addEventListener("touchend", () => {
    isDragging = false;
    touchStartDist = 0;
  });

  // Nút điều khiển Zoom góc phải
  document.getElementById("btn-zoom-in").addEventListener("click", () => zoomMap(0.2));
  document.getElementById("btn-zoom-out").addEventListener("click", () => zoomMap(-0.2));
  document.getElementById("btn-reset-view").addEventListener("click", resetMapView);

  // 5. TƯƠNG TÁC CLICK VÀO CÁC PHÒNG TRÊN BẢN ĐỒ SVG
  function setupMapRoomInteractions() {
    // Duyệt qua tất cả các phòng và gán hover/click
    window.CAMPUS_LOCATIONS.forEach(loc => {
      // Tìm phần tử text hoặc rect gần tọa độ (loc.x, loc.y)
      // Tạo một vùng clickable vô hình dạng SVG circle/rect quanh phòng
      const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      hitArea.setAttribute("cx", loc.x);
      hitArea.setAttribute("cy", loc.y);
      hitArea.setAttribute("r", "24");
      hitArea.setAttribute("fill", "transparent");
      hitArea.setAttribute("cursor", "pointer");
      hitArea.setAttribute("class", "map-room-hitarea");

      const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
      titleEl.textContent = `${loc.name} (${loc.floor})`;
      hitArea.appendChild(titleEl);

      hitArea.addEventListener("click", (e) => {
        e.stopPropagation();
        // Nếu chưa chọn điểm xuất phát, đặt là điểm xuất phát; ngược lại đặt là đích đến
        if (!selectedStartLoc) {
          startCombobox.selectLocation(loc);
        } else if (selectedStartLoc.id === loc.id) {
          return; // Bấm trùng điểm hiện tại thì không chọn
        } else {
          destCombobox.selectLocation(loc);
          // Tự động tìm đường luôn khi đã có cả 2 điểm
          handleCalculateRoute();
        }
      });

      mainMapSvg.appendChild(hitArea);
    });
  }

  // 6. XỬ LÝ TÍNH TOÁN LỘ TRÌNH & VẼ ĐƯỜNG DẪN TRỰC QUAN
  function handleCalculateRoute() {
    if (!selectedStartLoc || !selectedDestLoc) {
      alert("Vui lòng chọn cả 'Vị trí hiện tại' và 'Nơi muốn đến'!");
      return;
    }

    const result = router.navigate(selectedStartLoc.id, selectedDestLoc.id);
    if (!result.success) {
      alert(result.message || "Không tìm thấy tuyến đường phù hợp.");
      return;
    }

    currentRoute = result;
    drawRouteOnMap(result);
    displayRouteResults(result);

    // Trên iPhone / Mobile: chuyển sang chế độ sheet-half để thấy cả bản đồ lẫn lộ trình
    if (window.innerWidth <= 768) {
      setBottomSheetState("sheet-half");
    }
  }

  // Vẽ lộ trình trên SVG Layer
  function drawRouteOnMap(route) {
    navOverlayLayer.innerHTML = "";

    if (route.isSameLocation) {
      // Chỉ vẽ 1 điểm ghim tại chỗ
      drawPin(route.startLoc.x, route.startLoc.y, "#16a34a", "Bạn đang ở đây");
      return;
    }

    const pts = route.points;
    const pointsStr = pts.map(p => `${p.x},${p.y}`).join(" ");

    // 1. Lớp vệt sáng phát quang (Glow Layer)
    const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    glowPath.setAttribute("points", pointsStr);
    glowPath.setAttribute("class", "nav-route-glow");
    navOverlayLayer.appendChild(glowPath);

    // 2. Lớp đường nét đứt chuyển động (Animated Dash Line)
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    linePath.setAttribute("points", pointsStr);
    linePath.setAttribute("class", "nav-route-line");
    navOverlayLayer.appendChild(linePath);

    // 3. Ghim điểm xuất phát 🟢
    drawPin(route.startLoc.x, route.startLoc.y, "#10b981", "Xuất phát", true);

    // 4. Ghim điểm đến 🔴
    drawPin(route.destLoc.x, route.destLoc.y, "#ef4444", "Đích đến", false);

    // Tự động focus view vào khu vực lộ trình
    focusRouteBounds(pts);
  }

  // Vẽ ghim định vị
  function drawPin(x, y, color, label, isStart = true) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "marker-pin");
    g.setAttribute("transform", `translate(${x}, ${y})`);

    // Vòng tròn xung nhịp (Pulse halo)
    const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pulse.setAttribute("r", "18");
    pulse.setAttribute("fill", color);
    pulse.setAttribute("class", "marker-pulse");
    g.appendChild(pulse);

    // Vòng tròn lõi chính
    const core = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    core.setAttribute("r", "10");
    core.setAttribute("fill", color);
    core.setAttribute("stroke", "#ffffff");
    core.setAttribute("stroke-width", "2.5");
    g.appendChild(core);

    // Icon nhãn bên trong
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
    icon.setAttribute("text-anchor", "middle");
    icon.setAttribute("dominant-baseline", "central");
    icon.setAttribute("fill", "#ffffff");
    icon.setAttribute("font-size", "9px");
    icon.setAttribute("font-weight", "bold");
    icon.textContent = isStart ? "A" : "B";
    g.appendChild(icon);

    navOverlayLayer.appendChild(g);
  }

  // Focus bản đồ bao quát toàn bộ lộ trình
  function focusRouteBounds(points) {
    if (!points || points.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const isMobile = window.innerWidth <= 768;
    const padding = isMobile ? 80 : 140;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(1600, maxX + padding);
    maxY = Math.min(1120, maxY + padding);

    const routeWidth = maxX - minX;
    const routeHeight = maxY - minY;

    const viewportRect = mapViewport.getBoundingClientRect();
    const visibleHeight = isMobile ? viewportRect.height * 0.46 : viewportRect.height;

    const scaleX = (viewportRect.width - 24) / routeWidth;
    const scaleY = (visibleHeight - 24) / routeHeight;
    const newScale = Math.min(scaleX, scaleY, 2.2);

    transform.scale = Math.max(0.18, newScale);

    // Căn giữa trọng tâm lộ trình vào khung nhìn thực tế
    const routeCenterX = (minX + maxX) / 2;
    const routeCenterY = (minY + maxY) / 2;

    transform.x = viewportRect.width / 2 - routeCenterX * transform.scale;
    transform.y = visibleHeight / 2 - routeCenterY * transform.scale;

    updateMapTransform();
  }

  // Điểm đánh dấu tạm khi chọn vị trí
  function highlightMarkerOnMap() {
    navOverlayLayer.innerHTML = "";
    if (selectedStartLoc) {
      drawPin(selectedStartLoc.x, selectedStartLoc.y, "#10b981", "Xuất phát", true);
    }
    if (selectedDestLoc) {
      drawPin(selectedDestLoc.x, selectedDestLoc.y, "#ef4444", "Đích đến", false);
    }
  }

  // 7. HIỂN THỊ CHỈ DẪN VĂN BẢN TỪNG BƯỚC
  function displayRouteResults(route) {
    routeDistanceEl.textContent = `${route.totalDistanceMeters}m`;
    routeTimeEl.textContent = `~${route.estimatedMinutes} phút`;

    // Hiển thị badge tầng
    if (route.startLoc.floor !== route.destLoc.floor) {
      routeFloorBadge.style.display = "inline-block";
      routeFloorBadge.textContent = `${route.startLoc.floor} ➔ ${route.destLoc.floor}`;
    } else {
      routeFloorBadge.style.display = "none";
    }

    resultsTimeline.innerHTML = "";

    route.instructions.forEach((step, idx) => {
      const stepEl = document.createElement("div");
      stepEl.className = "timeline-step";

      let markerClass = "";
      if (idx === 0) markerClass = "start";
      else if (idx === route.instructions.length - 1) markerClass = "end";
      else if (step.icon === "🪜") markerClass = "stair";

      stepEl.innerHTML = `
        <div class="step-marker ${markerClass}">${step.icon}</div>
        <div class="step-body">
          <div class="step-badge">${step.badge || `Bước ${idx + 1}`}</div>
          <div class="step-title">${step.title}</div>
          <div class="step-detail">${step.detail}</div>
        </div>
      `;
      resultsTimeline.appendChild(stepEl);
    });

    resultsCard.classList.add("active");
  }

  // 8. ĐẢO CHIỀU ĐI (SWAP BUTTON)
  btnSwapRoute.addEventListener("click", () => {
    if (!selectedStartLoc && !selectedDestLoc) return;

    const temp = selectedStartLoc;
    selectedStartLoc = selectedDestLoc;
    selectedDestLoc = temp;

    if (selectedStartLoc) startCombobox.setLocationById(selectedStartLoc.id);
    else startCombobox.clear();

    if (selectedDestLoc) destCombobox.setLocationById(selectedDestLoc.id);
    else destCombobox.clear();

    if (selectedStartLoc && selectedDestLoc) {
      handleCalculateRoute();
    } else {
      highlightMarkerOnMap();
    }
  });

  // 9. NÚT SUBMIT & RESET
  btnSubmitRoute.addEventListener("click", handleCalculateRoute);

  btnResetAll.addEventListener("click", () => {
    startCombobox.clear();
    destCombobox.clear();
    selectedStartLoc = null;
    selectedDestLoc = null;
    navOverlayLayer.innerHTML = "";
    resultsCard.classList.remove("active");
    resetMapView();
  });

  // 10. QUICK LOCATION CHIPS
  document.querySelectorAll(".chip-item").forEach(chip => {
    chip.addEventListener("click", () => {
      const targetId = chip.dataset.id;
      if (targetId) {
        destCombobox.setLocationById(targetId);
        if (selectedStartLoc) {
          handleCalculateRoute();
        }
      }
    });
  });

  // 11. XỬ LÝ QUÉT MÃ QR (ĐỌC URL PARAMETERS)
  function handleUrlQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from") || params.get("start") || params.get("location") || params.get("qr");
    const toParam = params.get("to") || params.get("dest") || params.get("destination");

    if (fromParam) {
      const foundStart = startCombobox.setLocationById(fromParam);
      if (foundStart && selectedStartLoc) {
        // Hiện banner thông báo quét QR thành công
        qrSourceName.textContent = selectedStartLoc.name;
        qrSourceBanner.classList.add("active");

        // Focus ngay vào ô Nơi muốn đến để tiện tra cứu
        setTimeout(() => {
          destInput.focus();
        }, 300);
      }
    }

    if (toParam) {
      destCombobox.setLocationById(toParam);
    }

    // Nếu có cả 2 tham số trên URL, tự động kích hoạt dẫn đường
    if (selectedStartLoc && selectedDestLoc) {
      handleCalculateRoute();
    }
  }

  btnCloseQrBanner.addEventListener("click", () => {
    qrSourceBanner.classList.remove("active");
  });

  // 12. ĐIỀU KHIỂN BOTTOM SHEET TRÊN IPHONE 16 & SMARTPHONE
  const sheetHandleWrapper = document.getElementById("sheet-handle-wrapper");
  const mobileToggleText = document.getElementById("mobile-toggle-text");

  function setBottomSheetState(state) {
    sidebar.classList.remove("sheet-collapsed", "sheet-half", "sheet-full");
    sidebar.classList.add(state);
    if (mobileToggleText) {
      mobileToggleText.textContent = state === "sheet-collapsed" ? "Chỉ đường" : "Thu gọn";
    }
  }
  window.setBottomSheetState = setBottomSheetState;

  if (sheetHandleWrapper) {
    // Chạm vào thanh kéo để chuyển trạng thái
    sheetHandleWrapper.addEventListener("click", () => {
      if (sidebar.classList.contains("sheet-collapsed")) {
        setBottomSheetState("sheet-half");
      } else if (sidebar.classList.contains("sheet-half")) {
        setBottomSheetState("sheet-full");
      } else {
        setBottomSheetState("sheet-half");
      }
    });

    // Cử chỉ vuốt tay (Swipe Gestures) chuẩn iOS
    let touchStartY = 0;
    sheetHandleWrapper.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    sheetHandleWrapper.addEventListener("touchend", (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchEndY - touchStartY;
      if (diffY < -30) {
        // Vuốt lên -> Mở rộng
        if (sidebar.classList.contains("sheet-collapsed")) setBottomSheetState("sheet-half");
        else setBottomSheetState("sheet-full");
      } else if (diffY > 30) {
        // Vuốt xuống -> Thu gọn
        if (sidebar.classList.contains("sheet-full")) setBottomSheetState("sheet-half");
        else setBottomSheetState("sheet-collapsed");
      }
    }, { passive: true });
  }

  // Nút nổi trên góc trái màn hình iPhone
  btnToggleSidebar.addEventListener("click", () => {
    if (sidebar.classList.contains("sheet-collapsed")) {
      setBottomSheetState("sheet-half");
    } else {
      setBottomSheetState("sheet-collapsed");
    }
  });

  // Tự động mở rộng sheet khi bấm vào ô tìm kiếm trên điện thoại
  startInput.addEventListener("focus", () => {
    if (window.innerWidth <= 768 && sidebar.classList.contains("sheet-collapsed")) {
      setBottomSheetState("sheet-half");
    }
  });
  destInput.addEventListener("focus", () => {
    if (window.innerWidth <= 768 && sidebar.classList.contains("sheet-collapsed")) {
      setBottomSheetState("sheet-half");
    }
  });

  // 12. CÔNG CỤ TẠO MÃ QR DÁN KHUÔN VIÊN TRƯỜNG (CHO GIÁO VIÊN / ADMIN)
  function setupQrGeneratorModal() {
    // Đổ danh sách vào select
    qrLocationSelect.innerHTML = "";
    window.CAMPUS_LOCATIONS.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc.id;
      opt.textContent = `[${loc.category}] ${loc.name}`;
      qrLocationSelect.appendChild(opt);
    });

    function generateQrForSelected() {
      const locId = qrLocationSelect.value;
      const loc = window.CAMPUS_LOCATIONS.find(l => l.id === locId);
      if (!loc) return;

      qrCardLocTitle.textContent = loc.name;

      // URL tạo mã: http://domain/index.html?from=locId
      const currentUrl = new URL(window.location.href);
      currentUrl.search = `?from=${loc.id}`;
      const qrCodeString = currentUrl.toString();

      qrPreviewBox.innerHTML = "";
      new QRCode(qrPreviewBox, {
        text: qrCodeString,
        width: 170,
        height: 170,
        colorDark: "#0f172a",
        colorLight: "#ffffff"
      });
    }

    qrLocationSelect.addEventListener("change", generateQrForSelected);

    btnOpenQrModal.addEventListener("click", () => {
      qrModal.classList.add("active");
      generateQrForSelected();
    });

    btnCloseQrModal.addEventListener("click", () => {
      qrModal.classList.remove("active");
    });

    btnPrintQr.addEventListener("click", () => {
      window.print();
    });
  }

  // KHỞI ĐỘNG CÁC THÀNH PHẦN
  setupMapRoomInteractions();
  resetMapView();
  handleUrlQueryParams();
  setupQrGeneratorModal();

  // Tự động căn chỉnh khi resize cửa sổ (chuyển đổi ngang/dọc trên điện thoại)
  window.addEventListener("resize", () => {
    if (currentRoute && currentRoute.points) {
      focusRouteBounds(currentRoute.points);
    } else {
      resetMapView();
    }
  });
});
