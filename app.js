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
  const routeTimeMainEl = document.getElementById("route-time-main");
  const routeDistanceSubEl = document.getElementById("route-distance-sub");
  const routeStepsBadge = document.getElementById("route-steps-badge");
  const routeCalBadge = document.getElementById("route-cal-badge");
  const routeFloorBadge = document.getElementById("route-floor-badge");

  const btnSimulateTour = document.getElementById("btn-simulate-tour");
  const btnSwapActiveRoute = document.getElementById("btn-swap-active-route");
  const btnClearActiveRoute = document.getElementById("btn-clear-active-route");

  // Popover chọn nhanh trên bản đồ
  const mapLocationPopover = document.getElementById("map-location-popover");
  const popoverCloseBtn = document.getElementById("popover-close-btn");
  const popoverIcon = document.getElementById("popover-icon");
  const popoverTitle = document.getElementById("popover-title");
  const popoverMeta = document.getElementById("popover-meta");
  const popoverBtnStart = document.getElementById("popover-btn-start");
  const popoverBtnDest = document.getElementById("popover-btn-dest");
  const popoverBtnFromGate = document.getElementById("popover-btn-from-gate");
  const popoverBtnQr = document.getElementById("popover-btn-qr");

  // Các phần tử ảnh thực tế trên Popover Card (Hiển thị ngay khi bấm chọn phòng)
  const popoverPhotoBox = document.getElementById("popover-photo-box");
  const popoverPhotoImg = document.getElementById("popover-photo-img");
  const popoverPhotoShimmer = document.getElementById("popover-photo-shimmer");
  const popoverPhotoBuilding = document.getElementById("popover-photo-building");
  const popoverPhotoBadge = document.getElementById("popover-photo-badge");
  const popoverImgPrev = document.getElementById("popover-img-prev");
  const popoverImgNext = document.getElementById("popover-img-next");

  // Toast thông báo
  const toastNotification = document.getElementById("toast-notification");
  const toastIcon = document.getElementById("toast-icon");
  const toastText = document.getElementById("toast-text");

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
  const qrSearchInput = document.getElementById("qr-search-input");
  const qrPreviewBox = document.getElementById("qr-preview-box");
  const qrCardLocTitle = document.getElementById("qr-card-loc-title");
  const qrCardLocSub = document.getElementById("qr-card-loc-sub");
  const btnCopyQrLink = document.getElementById("btn-copy-qr-link");
  const btnDownloadQrPng = document.getElementById("btn-download-qr-png");
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
    if (activeClickedLoc && mapLocationPopover && mapLocationPopover.style.display !== "none") {
      updatePopoverPosition();
    }
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

  // 5. TOAST THÔNG BÁO TIỆN ÍCH KIỂU GOOGLE MAPS
  let toastTimer = null;
  function showToast(message, icon = "ℹ️", duration = 2500) {
    if (!toastNotification) return;
    toastText.textContent = message;
    toastIcon.textContent = icon;
    toastNotification.style.display = "flex";
    toastNotification.classList.remove("hide");
    toastNotification.classList.add("show");

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove("show");
      toastNotification.classList.add("hide");
      setTimeout(() => {
        toastNotification.style.display = "none";
      }, 250);
    }, duration);
  }

  // 6. POPOVER CHỌN ĐỊA ĐIỂM TRỰC TIẾP TRÊN BẢN ĐỒ (KHÔNG CẦN GÕ TÌM KIẾM)
  let activeClickedLoc = null;
  let currentPopoverPhotos = [];
  let currentPopoverPhotoIdx = 0;

  function updatePopoverPosition() {
    if (!activeClickedLoc || mapLocationPopover.style.display === "none") return;

    // Trên màn hình mobile (<= 768px), popover hoạt động dạng Bottom Action Sheet ở cạnh dưới
    if (window.innerWidth <= 768) {
      mapLocationPopover.style.left = "";
      mapLocationPopover.style.top = "";
      mapLocationPopover.style.bottom = "";
      mapLocationPopover.style.right = "";
      mapLocationPopover.classList.remove("placement-bottom");
      return;
    }

    const appContainer = document.getElementById("app-container");
    const appRect = appContainer ? appContainer.getBoundingClientRect() : { left: 0, top: 0 };
    // Ưu tiên phần tử phòng trực quan (hình chữ nhật/khối), nếu không thì hit-area
    const targetEl = mainMapSvg.querySelector(`.map-interactive-room[data-loc-id="${activeClickedLoc.id}"]`) ||
                     mainMapSvg.querySelector(`[data-loc-id="${activeClickedLoc.id}"]`);

    let targetX, targetY, targetHeight;
    if (targetEl) {
      const elRect = targetEl.getBoundingClientRect();
      targetX = elRect.left + elRect.width / 2 - appRect.left;
      targetY = elRect.top - appRect.top;
      targetHeight = elRect.height;
    } else {
      const vpRect = mapViewport.getBoundingClientRect();
      targetX = vpRect.left + transform.x + activeClickedLoc.x * transform.scale - appRect.left;
      targetY = vpRect.top + transform.y + activeClickedLoc.y * transform.scale - appRect.top;
      targetHeight = 0;
    }

    const popoverWidth = 320;
    const halfWidth = popoverWidth / 2;
    const containerWidth = appContainer ? appContainer.clientWidth : window.innerWidth;
    const popoverHeight = 360; // Chiều cao của card popover kèm ảnh

    // Nếu vị trí quá sát mép trên viewport (targetY < popoverHeight + 35), lật khung xuống bên dưới
    const placeBelow = targetY < (popoverHeight + 35);

    let anchorY;
    if (placeBelow) {
      mapLocationPopover.classList.add("placement-bottom");
      anchorY = targetY + targetHeight + 2;
    } else {
      mapLocationPopover.classList.remove("placement-bottom");
      anchorY = targetY - 2;
    }

    // Giữ khung không bị tràn khỏi mép trái / phải của màn hình
    let cardLeft = targetX;
    if (cardLeft < halfWidth + 12) {
      cardLeft = halfWidth + 12;
    } else if (cardLeft > containerWidth - halfWidth - 12) {
      cardLeft = containerWidth - halfWidth - 12;
    }

    // Tọa độ mũi tên luôn chĩa thẳng chuẩn xác 100% vào tâm targetX
    const deltaX = targetX - cardLeft;
    const maxArrowOffset = halfWidth - 26;
    const arrowOffset = Math.max(-maxArrowOffset, Math.min(maxArrowOffset, deltaX));

    mapLocationPopover.style.left = `${cardLeft}px`;
    mapLocationPopover.style.top = `${anchorY}px`;
    mapLocationPopover.style.bottom = "auto";
    mapLocationPopover.style.right = "auto";

    const popoverCard = mapLocationPopover.querySelector(".popover-card");
    if (popoverCard) {
      popoverCard.style.setProperty("--arrow-left", `calc(50% + ${arrowOffset}px)`);
    }
  }

  function getCategoryLabel(category, loc) {
    if (loc && loc.name && loc.name.includes("WC")) return "Khu vệ sinh";
    if (loc && loc.name && loc.name.includes("Cầu thang")) return "Cầu thang";
    switch (category) {
      case "admin": return "Phòng Hành chính - Chức năng";
      case "classroom": return "Phòng học";
      case "facility": return "Khu tiện ích";
      case "stair": return "Cầu thang bộ";
      case "gate": return "Cổng trường";
      case "parking": return "Bãi giữ xe";
      case "landmark": return "Khuôn viên trường";
      default: return category || "Khuôn viên";
    }
  }

  function renderPopoverPhotoCard() {
    if (!popoverPhotoBox || !popoverPhotoImg) return;
    if (currentPopoverPhotos && currentPopoverPhotos.length > 0) {
      popoverPhotoBox.style.display = "block";
      const rawSrc = currentPopoverPhotos[currentPopoverPhotoIdx];
      const safeSrc = rawSrc.split("/").map(seg => encodeURIComponent(seg)).join("/");

      if (popoverPhotoShimmer) popoverPhotoShimmer.style.display = "block";
      popoverPhotoImg.onload = () => {
        if (popoverPhotoShimmer) popoverPhotoShimmer.style.display = "none";
      };
      popoverPhotoImg.onerror = () => {
        if (popoverPhotoShimmer) popoverPhotoShimmer.style.display = "none";
        if (popoverPhotoImg.src !== rawSrc) {
          popoverPhotoImg.src = rawSrc;
        }
      };
      popoverPhotoImg.src = safeSrc;

      if (popoverPhotoBuilding) {
        popoverPhotoBuilding.textContent = activeClickedLoc && activeClickedLoc.building
          ? `🏢 ${activeClickedLoc.building}`
          : "🏫 Trường THPT";
      }
      if (popoverPhotoBadge) {
        popoverPhotoBadge.textContent = currentPopoverPhotos.length > 1
          ? `📷 ${currentPopoverPhotoIdx + 1}/${currentPopoverPhotos.length} • Chạm xem lớn`
          : `📷 Chạm xem lớn`;
      }
      if (popoverImgPrev && popoverImgNext) {
        const multi = currentPopoverPhotos.length > 1;
        popoverImgPrev.style.display = multi ? "flex" : "none";
        popoverImgNext.style.display = multi ? "flex" : "none";
        popoverImgPrev.disabled = currentPopoverPhotoIdx === 0;
        popoverImgNext.disabled = currentPopoverPhotoIdx === currentPopoverPhotos.length - 1;
      }
    } else {
      popoverPhotoBox.style.display = "none";
    }
  }

  function showLocationPopover(loc) {
    activeClickedLoc = loc;
    popoverTitle.textContent = loc.name;

    // Định dạng danh mục & tòa nhà thành tiếng Việt thân thiện, không bao giờ để raw 'admin'
    const categoryLabel = getCategoryLabel(loc.category, loc);
    const buildingText = loc.building ? ` • ${loc.building}` : "";
    popoverMeta.textContent = `${loc.floor}${buildingText} • ${categoryLabel}`;

    // Icon phù hợp theo danh mục
    let icon = "🏫";
    if (loc.category && loc.category.includes("Khối")) icon = "🎒";
    else if (loc.name.includes("WC")) icon = "🚻";
    else if (loc.name.includes("Cổng")) icon = "🚪";
    else if (loc.name.includes("Xe")) icon = "🏍️";
    else if (loc.name.includes("Hành") || loc.category === "admin") icon = "🏛️";
    else if (loc.name.includes("Y Tế")) icon = "🏥";
    else if (loc.name.includes("Thư Viện")) icon = "📚";
    else if (loc.name.includes("Cờ")) icon = "🚩";
    popoverIcon.textContent = icon;

    // Tải ảnh thực tế trực tiếp ngay trên card
    currentPopoverPhotos = (window.ROOM_IMAGES && window.ROOM_IMAGES[loc.id]) || [];
    currentPopoverPhotoIdx = 0;
    renderPopoverPhotoCard();

    // Trên màn hình di động, tự động thu gọn thanh chỉ đường bên dưới để hiển thị toàn bộ popover & bản đồ
    if (window.innerWidth <= 768 && window.setBottomSheetState) {
      setBottomSheetState("sheet-collapsed");
    }

    mapLocationPopover.style.display = "block";
    updatePopoverPosition();

    // Lưu loc cho RoomPhotoViewer dùng qua custom event
    document.dispatchEvent(new CustomEvent("rpm:loc-updated", { detail: { loc } }));
  }

  function hideLocationPopover() {
    mapLocationPopover.style.display = "none";
    mapLocationPopover.classList.remove("placement-bottom");
    activeClickedLoc = null;
  }

  if (popoverCloseBtn) {
    popoverCloseBtn.addEventListener("click", hideLocationPopover);
  }

  // Tương tác với ảnh thực tế trên Popover Card
  if (popoverPhotoBox) {
    popoverPhotoBox.addEventListener("click", (e) => {
      if (e.target.closest(".popover-img-nav")) return;
      if (window.openRoomPhotoForLoc && activeClickedLoc) {
        window.openRoomPhotoForLoc(activeClickedLoc, currentPopoverPhotoIdx);
      }
    });
  }

  if (popoverImgPrev) {
    popoverImgPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentPopoverPhotoIdx > 0) {
        currentPopoverPhotoIdx--;
        renderPopoverPhotoCard();
      }
    });
  }

  if (popoverImgNext) {
    popoverImgNext.addEventListener("click", (e) => {
      e.stopPropagation();
      if (currentPopoverPhotoIdx < currentPopoverPhotos.length - 1) {
        currentPopoverPhotoIdx++;
        renderPopoverPhotoCard();
      }
    });
  }

  if (popoverBtnStart) {
    popoverBtnStart.addEventListener("click", () => {
      if (!activeClickedLoc) return;
      const loc = activeClickedLoc;
      startCombobox.selectLocation(loc);
      showToast(`Đã chọn điểm xuất phát: ${loc.name}`, "🟢");
      hideLocationPopover();

      if (selectedDestLoc && selectedDestLoc.id !== loc.id) {
        handleCalculateRoute();
      } else {
        highlightMarkerOnMap();
      }
    });
  }

  if (popoverBtnDest) {
    popoverBtnDest.addEventListener("click", () => {
      if (!activeClickedLoc) return;
      const loc = activeClickedLoc;

      // Nếu chưa chọn điểm đi, tự động chọn Cổng trường làm mặc định
      if (!selectedStartLoc) {
        const gate = window.CAMPUS_LOCATIONS.find(l => l.id === "cong_truong");
        if (gate) startCombobox.selectLocation(gate);
      }

      destCombobox.selectLocation(loc);
      showToast(`Đã chọn nơi muốn đến: ${loc.name}`, "🔴");
      hideLocationPopover();
      handleCalculateRoute();
    });
  }

  if (popoverBtnFromGate) {
    popoverBtnFromGate.addEventListener("click", () => {
      if (!activeClickedLoc) return;
      const loc = activeClickedLoc;

      const gate = window.CAMPUS_LOCATIONS.find(l => l.id === "cong_truong");
      if (gate) startCombobox.selectLocation(gate);

      destCombobox.selectLocation(loc);
      showToast(`Dẫn đường từ Cổng trường tới ${loc.name}`, "🚀");
      hideLocationPopover();
      handleCalculateRoute();
    });
  }

  if (popoverBtnQr) {
    popoverBtnQr.addEventListener("click", () => {
      if (!activeClickedLoc) return;
      const loc = activeClickedLoc;
      hideLocationPopover();
      qrModal.classList.add("active");
      generateQrForSelected(loc.id);
    });
  }

  // 7. TƯƠNG TÁC BẤM CHỌN PHÒNG TRÊN BẢN ĐỒ SVG
  function setupMapRoomInteractions() {
    function handleRoomSelection(loc) {
      showLocationPopover(loc);
    }

    // Click vào phòng trên SVG
    mainMapSvg.addEventListener("click", (e) => {
      const target = e.target.closest("[data-loc-id]");
      if (target) {
        const locId = target.getAttribute("data-loc-id");
        const loc = window.CAMPUS_LOCATIONS.find(l => l.id === locId);
        if (loc) {
          e.stopPropagation();
          handleRoomSelection(loc);
          return;
        }
      }
      hideLocationPopover();
    });

    // Tạo các hit-area tương tác phủ trên các phòng để bấm trên mobile cực nhạy
    window.CAMPUS_LOCATIONS.forEach(loc => {
      // Tìm element trên SVG
      const existingEl = mainMapSvg.querySelector(`[data-loc-id="${loc.id}"]`) || document.getElementById(loc.id);
      if (existingEl) {
        existingEl.classList.add("map-interactive-room");
        existingEl.setAttribute("data-loc-id", loc.id);
        existingEl.style.cursor = "pointer";
      }

      const hitArea = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      hitArea.setAttribute("cx", loc.x);
      hitArea.setAttribute("cy", loc.y);
      hitArea.setAttribute("r", "20");
      hitArea.setAttribute("fill", "transparent");
      hitArea.setAttribute("cursor", "pointer");
      hitArea.setAttribute("class", "map-room-hitarea");
      hitArea.setAttribute("data-loc-id", loc.id);

      const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
      titleEl.textContent = `${loc.name} (${loc.floor})`;
      hitArea.appendChild(titleEl);

      hitArea.addEventListener("click", (e) => {
        e.stopPropagation();
        handleRoomSelection(loc);
      });

      mainMapSvg.appendChild(hitArea);
    });
  }

  // 8. TÍNH TOÁN LỘ TRÌNH CHUẨN GOOGLE MAPS
  function handleCalculateRoute() {
    if (!selectedStartLoc || !selectedDestLoc) {
      showToast("Vui lòng chọn cả điểm xuất phát và nơi muốn đến!", "⚠️");
      return;
    }

    const result = router.navigate(selectedStartLoc.id, selectedDestLoc.id);
    if (!result.success) {
      showToast(result.message || "Không tìm thấy tuyến đường.", "❌");
      return;
    }

    currentRoute = result;
    drawRouteOnMap(result);
    displayRouteResults(result);

    // Trên điện thoại: mở nửa màn hình (sheet-half) để thấy cả lộ trình và hướng dẫn
    if (window.innerWidth <= 768) {
      setBottomSheetState("sheet-half");
    }
  }

  // 9. VẼ ĐƯỜNG DẪN VUÔNG GÓC 90 ĐỘ PHONG CÁCH GOOGLE MAPS (KHÔNG XIÊN VẸO)
  let simulationAnimId = null;

  function drawRouteOnMap(route) {
    if (simulationAnimId) {
      cancelAnimationFrame(simulationAnimId);
      simulationAnimId = null;
    }
    navOverlayLayer.innerHTML = "";

    if (route.isSameLocation) {
      drawGooglePin(route.startLoc.x, route.startLoc.y, "#10b981", "A", route.startLoc.name, true);
      showToast("Bạn đang ở ngay tại vị trí này!", "📍");
      return;
    }

    const pts = route.points;
    const pointsStr = pts.map(p => `${p.x},${p.y}`).join(" ");

    // 1. Viền ngoài tương phản cao (Google Maps Outer Casing)
    const casingPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    casingPath.setAttribute("points", pointsStr);
    casingPath.setAttribute("class", "nav-route-casing");
    navOverlayLayer.appendChild(casingPath);

    // 2. Đường kẻ chỉ hướng chính màu xanh lam nổi bật (Google Maps Blue Polyline)
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    linePath.setAttribute("points", pointsStr);
    linePath.setAttribute("class", "nav-route-line");
    navOverlayLayer.appendChild(linePath);

    // 3. Chuỗi hạt chấm trắng chuyển động theo chiều đi (Animated Walking Dots)
    const dotsPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    dotsPath.setAttribute("points", pointsStr);
    dotsPath.setAttribute("class", "nav-route-dots");
    navOverlayLayer.appendChild(dotsPath);

    // 4. Các điểm nút góc vuông 90 độ (Waypoints)
    for (let i = 1; i < pts.length - 1; i++) {
      const corner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      corner.setAttribute("cx", pts[i].x);
      corner.setAttribute("cy", pts[i].y);
      corner.setAttribute("r", "3.5");
      corner.setAttribute("class", "waypoint-corner");
      navOverlayLayer.appendChild(corner);
    }

    // 5. Ghim xuất phát Google Maps 🟢 (Điểm A)
    drawGooglePin(route.startLoc.x, route.startLoc.y, "#10b981", "A", route.startLoc.name, true);

    // 6. Ghim đích đến Google Maps 🔴 (Điểm B)
    drawGooglePin(route.destLoc.x, route.destLoc.y, "#ef4444", "B", route.destLoc.name, false);

    // Tự động căn góc nhìn bao quát toàn bộ lộ trình
    focusRouteBounds(pts);
  }

  // Vẽ ghim định vị giọt nước Google Maps
  function drawGooglePin(x, y, color, label, titleText, isStart = true) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "marker-pin-google");
    g.setAttribute("transform", `translate(${x}, ${y})`);

    // Vòng tròn tỏa sóng pulse
    const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pulse.setAttribute("r", "16");
    pulse.setAttribute("fill", color);
    pulse.setAttribute("class", "marker-pulse");
    g.appendChild(pulse);

    // Thân ghim giọt nước (Google Maps Pin)
    const pin = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pin.setAttribute("d", "M 0 0 C -4 -5, -12 -14, -12 -22 C -12 -30, -6 -36, 0 -36 C 6 -36, 12 -30, 12 -22 C 12 -14, 4 -5, 0 0 Z");
    pin.setAttribute("fill", color);
    pin.setAttribute("stroke", "#ffffff");
    pin.setAttribute("stroke-width", "2");
    pin.setAttribute("filter", "url(#boxShadow)");
    g.appendChild(pin);

    // Vòng tròn trắng lõi
    const disc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    disc.setAttribute("cx", "0");
    disc.setAttribute("cy", "-22");
    disc.setAttribute("r", "7.5");
    disc.setAttribute("fill", "#ffffff");
    g.appendChild(disc);

    // Ký tự A / B
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "0");
    text.setAttribute("y", "-21");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("fill", color);
    text.setAttribute("font-size", "10px");
    text.setAttribute("font-weight", "900");
    text.textContent = label;
    g.appendChild(text);

    const titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
    titleEl.textContent = `${isStart ? "Xuất phát" : "Đích đến"}: ${titleText}`;
    g.appendChild(titleEl);

    navOverlayLayer.appendChild(g);
  }

  // Tự động căn giữa bản đồ theo kích thước lộ trình
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
    const padding = isMobile ? 80 : 130;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(1600, maxX + padding);
    maxY = Math.min(1120, maxY + padding);

    const routeWidth = maxX - minX;
    const routeHeight = maxY - minY;

    const viewportRect = mapViewport.getBoundingClientRect();
    const visibleHeight = isMobile ? viewportRect.height * 0.48 : viewportRect.height;

    const scaleX = (viewportRect.width - 24) / routeWidth;
    const scaleY = (visibleHeight - 24) / routeHeight;
    const newScale = Math.min(scaleX, scaleY, 2.2);

    transform.scale = Math.max(0.2, newScale);

    const routeCenterX = (minX + maxX) / 2;
    const routeCenterY = (minY + maxY) / 2;

    transform.x = viewportRect.width / 2 - routeCenterX * transform.scale;
    transform.y = visibleHeight / 2 - routeCenterY * transform.scale;

    updateMapTransform();
  }

  function highlightMarkerOnMap() {
    navOverlayLayer.innerHTML = "";
    if (selectedStartLoc) {
      drawGooglePin(selectedStartLoc.x, selectedStartLoc.y, "#10b981", "A", selectedStartLoc.name, true);
    }
    if (selectedDestLoc) {
      drawGooglePin(selectedDestLoc.x, selectedDestLoc.y, "#ef4444", "B", selectedDestLoc.name, false);
    }
  }

  // 10. HIỂN THỊ PHÂN TÍCH THỜI GIAN, QUÃNG ĐƯỜNG, BƯỚC CHÂN VÀ CALO
  function displayRouteResults(route) {
    if (routeTimeMainEl) {
      routeTimeMainEl.textContent = route.formattedTime || `~${route.estimatedMinutes} phút`;
    }
    if (routeDistanceSubEl) {
      routeDistanceSubEl.textContent = `Khoảng cách: ${route.totalDistanceMeters}m (tối ưu nhất)`;
    }
    if (routeStepsBadge) {
      routeStepsBadge.textContent = `👣 ~${route.estimatedSteps || Math.round(route.totalDistanceMeters * 1.35)} bước`;
    }
    if (routeCalBadge) {
      routeCalBadge.textContent = `🔥 ~${route.calorieBurn || (route.totalDistanceMeters * 0.045).toFixed(1)} kcal`;
    }

    if (routeDistanceEl) routeDistanceEl.textContent = `${route.totalDistanceMeters}m`;
    if (routeTimeEl) routeTimeEl.textContent = `~${route.estimatedMinutes} phút`;

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

  // 11. MÔ PHỎNG ĐI THỬ THEO ĐƯỜNG DẪN (WALKING SIMULATOR)
  function simulateTour() {
    if (!currentRoute || !currentRoute.points || currentRoute.points.length < 2) {
      showToast("Chưa có lộ trình để mô phỏng đi thử!", "ℹ️");
      return;
    }

    if (simulationAnimId) {
      cancelAnimationFrame(simulationAnimId);
      simulationAnimId = null;
    }

    const existingAvatar = navOverlayLayer.querySelector(".avatar-walker");
    if (existingAvatar) existingAvatar.remove();

    const walker = document.createElementNS("http://www.w3.org/2000/svg", "g");
    walker.setAttribute("class", "avatar-walker");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "14");
    circle.setAttribute("fill", "#0284c7");
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "2.5");
    circle.setAttribute("filter", "url(#boxShadow)");
    walker.appendChild(circle);

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "text");
    icon.setAttribute("text-anchor", "middle");
    icon.setAttribute("dominant-baseline", "central");
    icon.setAttribute("font-size", "14px");
    icon.textContent = "🚶";
    walker.appendChild(icon);

    navOverlayLayer.appendChild(walker);

    const pts = currentRoute.points;
    let currentSegmentIndex = 0;
    let segmentProgress = 0;
    const speed = 4; // pixel mỗi frame

    showToast("Đang mô phỏng di chuyển thực tế theo đường thẳng...", "🚶‍♂️");

    function step() {
      if (currentSegmentIndex >= pts.length - 1) {
        showToast("Đã đến điểm đích!", "🎯");
        setTimeout(() => {
          if (walker.parentNode) walker.remove();
        }, 1500);
        return;
      }

      const p1 = pts[currentSegmentIndex];
      const p2 = pts[currentSegmentIndex + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLen = Math.hypot(dx, dy);

      if (segLen === 0) {
        currentSegmentIndex++;
        segmentProgress = 0;
        simulationAnimId = requestAnimationFrame(step);
        return;
      }

      segmentProgress += speed;
      const t = Math.min(segmentProgress / segLen, 1);
      const currX = p1.x + dx * t;
      const currY = p1.y + dy * t;

      walker.setAttribute("transform", `translate(${currX}, ${currY})`);

      if (t >= 1) {
        currentSegmentIndex++;
        segmentProgress = 0;
      }

      simulationAnimId = requestAnimationFrame(step);
    }

    simulationAnimId = requestAnimationFrame(step);
  }

  if (btnSimulateTour) {
    btnSimulateTour.addEventListener("click", simulateTour);
  }

  // 12. CÁC NÚT ĐỔI CHIỀU & XÓA LỘ TRÌNH
  function swapRouteLocations() {
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
  }

  btnSwapRoute.addEventListener("click", swapRouteLocations);
  if (btnSwapActiveRoute) {
    btnSwapActiveRoute.addEventListener("click", swapRouteLocations);
  }

  function clearActiveRoute() {
    startCombobox.clear();
    destCombobox.clear();
    selectedStartLoc = null;
    selectedDestLoc = null;
    currentRoute = null;
    if (simulationAnimId) {
      cancelAnimationFrame(simulationAnimId);
      simulationAnimId = null;
    }
    navOverlayLayer.innerHTML = "";
    resultsCard.classList.remove("active");
    hideLocationPopover();
    showToast("Đã xóa lộ trình", "🧹");
    resetMapView();
  }

  btnResetAll.addEventListener("click", clearActiveRoute);
  if (btnClearActiveRoute) {
    btnClearActiveRoute.addEventListener("click", clearActiveRoute);
  }

  btnSubmitRoute.addEventListener("click", handleCalculateRoute);

  // Quick Chips
  document.querySelectorAll(".chip-item").forEach(chip => {
    chip.addEventListener("click", () => {
      const targetId = chip.dataset.id;
      if (targetId) {
        destCombobox.setLocationById(targetId);
        if (selectedStartLoc) {
          handleCalculateRoute();
        } else {
          // Gợi ý Cổng trường nếu chưa chọn điểm đi
          const gate = window.CAMPUS_LOCATIONS.find(l => l.id === "cong_truong");
          if (gate) {
            startCombobox.selectLocation(gate);
            handleCalculateRoute();
          }
        }
      }
    });
  });

  // 13. XỬ LÝ QUÉT MÃ QR (URL PARAMETERS)
  function handleUrlQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from") || params.get("start") || params.get("location") || params.get("qr");
    const toParam = params.get("to") || params.get("dest") || params.get("destination");

    if (fromParam) {
      const foundStart = startCombobox.setLocationById(fromParam);
      if (foundStart && selectedStartLoc) {
        qrSourceName.textContent = selectedStartLoc.name;
        qrSourceBanner.classList.add("active");
        showToast(`Đã nhận diện vị trí hiện tại: ${selectedStartLoc.name}`, "📱");
        setTimeout(() => {
          destInput.focus();
        }, 300);
      }
    }

    if (toParam) {
      destCombobox.setLocationById(toParam);
    }

    if (selectedStartLoc && selectedDestLoc) {
      handleCalculateRoute();
    }
  }

  btnCloseQrBanner.addEventListener("click", () => {
    qrSourceBanner.classList.remove("active");
  });

  // 14. BOTTOM SHEET TRÊN MOBILE (SMARTPHONE)
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
    sheetHandleWrapper.addEventListener("click", () => {
      if (sidebar.classList.contains("sheet-collapsed")) {
        setBottomSheetState("sheet-half");
      } else if (sidebar.classList.contains("sheet-half")) {
        setBottomSheetState("sheet-full");
      } else {
        setBottomSheetState("sheet-half");
      }
    });

    let touchStartY = 0;
    sheetHandleWrapper.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    sheetHandleWrapper.addEventListener("touchend", (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchEndY - touchStartY;
      if (diffY < -30) {
        if (sidebar.classList.contains("sheet-collapsed")) setBottomSheetState("sheet-half");
        else setBottomSheetState("sheet-full");
      } else if (diffY > 30) {
        if (sidebar.classList.contains("sheet-full")) setBottomSheetState("sheet-half");
        else setBottomSheetState("sheet-collapsed");
      }
    }, { passive: true });
  }

  btnToggleSidebar.addEventListener("click", () => {
    if (sidebar.classList.contains("sheet-collapsed")) {
      setBottomSheetState("sheet-half");
    } else {
      setBottomSheetState("sheet-collapsed");
    }
  });

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

  // 15. TẠO MÃ QR TỪNG PHÒNG ĐẦY ĐỦ TIỆN ÍCH (TẢI ẢNH, SAO CHÉP LINK, IN DÁN)
  function setupQrGeneratorModal() {
    function populateQrSelect(filterTerm = "") {
      qrLocationSelect.innerHTML = "";
      const term = removeVietnameseTones(filterTerm.toLowerCase().trim());
      const filtered = window.CAMPUS_LOCATIONS.filter(loc => {
        if (!term) return true;
        const n = removeVietnameseTones(loc.name.toLowerCase());
        const c = removeVietnameseTones(loc.category.toLowerCase());
        return n.includes(term) || c.includes(term);
      });

      filtered.forEach(loc => {
        const opt = document.createElement("option");
        opt.value = loc.id;
        opt.textContent = `[${loc.category}] ${loc.name}`;
        qrLocationSelect.appendChild(opt);
      });

      if (filtered.length > 0) {
        generateQrForSelected(filtered[0].id);
      }
    }

    function generateQrForSelected(targetId) {
      const locId = targetId || qrLocationSelect.value;
      const loc = window.CAMPUS_LOCATIONS.find(l => l.id === locId);
      if (!loc) return;

      qrLocationSelect.value = loc.id;
      qrCardLocTitle.textContent = loc.name;
      if (qrCardLocSub) {
        qrCardLocSub.textContent = `${loc.floor} • ${loc.category}`;
      }

      // Link trực tiếp đến vị trí phòng này
      const baseUrl = window.location.origin + window.location.pathname;
      const qrCodeString = `${baseUrl}?from=${loc.id}`;

      qrPreviewBox.innerHTML = "";
      try {
        if (typeof QRCode !== "undefined") {
          const correctLvl = (QRCode.CorrectLevel && QRCode.CorrectLevel.H !== undefined) ? QRCode.CorrectLevel.H : 2;
          new QRCode(qrPreviewBox, {
            text: qrCodeString,
            width: 170,
            height: 170,
            colorDark: "#0f172a",
            colorLight: "#ffffff",
            correctLevel: correctLvl
          });
        }
      } catch (err) {
        console.warn("QR Code render warning:", err);
      }
    }
    window.generateQrForSelected = generateQrForSelected;

    populateQrSelect();

    if (qrSearchInput) {
      qrSearchInput.addEventListener("input", (e) => {
        populateQrSelect(e.target.value);
      });
    }

    qrLocationSelect.addEventListener("change", () => {
      generateQrForSelected(qrLocationSelect.value);
    });

    btnOpenQrModal.addEventListener("click", () => {
      qrModal.classList.add("active");
      generateQrForSelected(qrLocationSelect.value);
    });

    btnCloseQrModal.addEventListener("click", () => {
      qrModal.classList.remove("active");
    });

    if (btnCopyQrLink) {
      btnCopyQrLink.addEventListener("click", () => {
        const locId = qrLocationSelect.value;
        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?from=${locId}`;
        navigator.clipboard.writeText(link).then(() => {
          showToast("Đã sao chép link QR định vị!", "🔗");
        }).catch(() => {
          prompt("Sao chép liên kết này:", link);
        });
      });
    }

    if (btnDownloadQrPng) {
      btnDownloadQrPng.addEventListener("click", () => {
        const canvas = qrPreviewBox.querySelector("canvas");
        const locId = qrLocationSelect.value;
        if (canvas) {
          const link = document.createElement("a");
          link.download = `QR_${locId}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          showToast("Đã tải ảnh mã QR PNG!", "⬇️");
        } else {
          const img = qrPreviewBox.querySelector("img");
          if (img) {
            const link = document.createElement("a");
            link.download = `QR_${locId}.png`;
            link.href = img.src;
            link.click();
            showToast("Đã tải ảnh mã QR PNG!", "⬇️");
          }
        }
      });
    }

    btnPrintQr.addEventListener("click", () => {
      window.print();
    });
  }

  // 15. CHỨC NĂNG HƯỚNG DẪN TƯƠNG TÁC (ONBOARDING TOUR GUIDE)
  function setupOnboardingTour() {
    const tourContainer = document.getElementById("tour-overlay-container");
    if (!tourContainer) return;

    const tourBackdrop = document.getElementById("tour-backdrop");
    const spotlightBox = document.getElementById("tour-spotlight-box");
    const spotlightLabel = document.getElementById("tour-spotlight-label");
    const tourCard = document.getElementById("tour-card");
    const tourStepCounter = document.getElementById("tour-step-counter");
    const tourBtnClose = document.getElementById("tour-btn-close");
    const tourStepIcon = document.getElementById("tour-step-icon");
    const tourStepTitle = document.getElementById("tour-step-title");
    const tourStepDesc = document.getElementById("tour-step-desc");
    const tourDontShowAgain = document.getElementById("tour-dont-show-again");
    const tourProgressDots = document.getElementById("tour-progress-dots");
    const tourBtnSkip = document.getElementById("tour-btn-skip");
    const tourBtnPrev = document.getElementById("tour-btn-prev");
    const tourBtnNext = document.getElementById("tour-btn-next");
    const tourMapHighlights = document.getElementById("tour-map-highlights");

    const btnStartTour = document.getElementById("btn-start-tour");
    const btnMapHelpTour = document.getElementById("btn-map-help-tour");

    const STORAGE_KEY = "campusgo_2d_tour_completed";

    // Danh sách các bước hướng dẫn
    const tourSteps = [
      {
        target: ".sidebar-header",
        title: "Chào mừng đến với CampusGo 2D",
        icon: "🏫",
        label: "Tổng quan",
        placement: "right",
        desc: `Hệ thống bản đồ chỉ đường nội bộ thông minh trong khuôn viên trường học.<br><br>
        Giúp học sinh, phụ huynh và giáo viên tra cứu vị trí phòng học, các phòng bộ môn, thư viện, hội trường và nhà xe nhanh chóng, chính xác.`
      },
      {
        target: "#start-location-input",
        title: "1. Vị trí hiện tại (Điểm xuất phát)",
        icon: "📍",
        label: "Điểm xuất phát",
        placement: "right",
        desc: `Nhập nơi bạn đang đứng (ví dụ: <em>Cổng trường, Cột cờ, Lớp 10A1...</em>).<br><br>
        <div class="tour-tip-box">
          <span>📱</span>
          <span><strong>Mẹo thông minh:</strong> Khi quét mã QR dán tại cửa từng phòng bằng điện thoại, hệ thống sẽ tự động nhận diện và điền ngay điểm xuất phát này cho bạn!</span>
        </div>`
      },
      {
        target: "#dest-location-input",
        title: "2. Nơi muốn đến (Điểm đến)",
        icon: "🎯",
        label: "Nơi muốn đến",
        placement: "right",
        desc: `Nhập phòng học, phòng thực hành Tin học, phòng Y tế, Thư viện, Hội trường hoặc Nhà xe bạn muốn tới.<br><br>
        Hệ thống hỗ trợ tìm kiếm không dấu (vd: <em>tin hoc, hoi truong, 12a1</em>) và có danh mục <strong>Điểm đến thường tìm</strong> phía dưới để bấm chọn ngay.`
      },
      {
        target: ".action-buttons-group",
        title: "3. Tìm đường & chỉ dẫn chi tiết",
        icon: "🚀",
        label: "Tìm đường",
        placement: "right",
        desc: `Bấm nút <strong>Tìm đường ngay</strong> để thuật toán tự động vẽ tuyến đường tối ưu nhất.<br><br>
        Sau khi tìm đường, bạn sẽ nhận được:
        <ul>
          <li>⏱️ <strong>Thời gian & khoảng cách:</strong> Chính xác từng mét đi bộ</li>
          <li>👣 <strong>Số bước chân & Calo:</strong> Ước tính năng lượng vận động</li>
          <li>▶️ <strong>Nút Đi thử:</strong> Mô phỏng chuyển động người đi trên bản đồ</li>
          <li>🔄 <strong>Đổi chiều:</strong> Đảo ngược chiều đi và về nhanh chóng</li>
        </ul>`
      },
      {
        target: "#map-viewport",
        title: "4. Bản đồ mặt bằng tương tác 2D",
        icon: "🗺️",
        label: "Bản đồ tương tác",
        placement: "center",
        isMapStep: true,
        desc: `Không gian bản đồ số toàn diện của khuôn viên trường học:<br>
        <ul>
          <li>🖐️ <strong>Kéo / Vuốt:</strong> Di chuyển bản đồ đến mọi góc sân trường</li>
          <li>🔍 <strong>Lăn chuột / Chụm 2 ngón:</strong> Phóng to hoặc thu nhỏ tùy ý</li>
          <li>👆 <strong>Chạm trực tiếp vào phòng:</strong> Bạn có thể nhấp chuột vào bất kỳ phòng học hoặc khu vực nào (<em>như các khung viền đỏ nổi bật</em>) để xem thông tin và chỉ đường ngay!</li>
        </ul>`
      },
      {
        target: ".view-mode-bar",
        title: "5. Chuyển đổi chế độ 2D / 3D",
        icon: "🏢",
        label: "Chế độ xem",
        placement: "bottom",
        desc: `Bạn có thể dễ dàng chuyển đổi linh hoạt bất kỳ lúc nào:
        <ul>
          <li>🗺️ <strong>2D Mặt Bằng:</strong> Xem tổng thể toàn trường rõ ràng, dễ định hướng</li>
          <li>🏢 <strong>3D Không Gian:</strong> Trải nghiệm mô hình 3 chiều sinh động, thấy rõ độ cao và các tầng lầu!</li>
        </ul>`
      },
      {
        target: ".map-floating-controls",
        title: "6. Phím điều khiển & trợ giúp",
        icon: "💡",
        label: "Tiện ích & Trợ giúp",
        placement: "left",
        desc: `Bộ công cụ điều hướng tiện ích góc phải màn hình:
        <ul>
          <li><strong>+ / − :</strong> Phóng to và thu nhỏ bản đồ</li>
          <li><strong>⟲ :</strong> Đặt lại góc nhìn về toàn cảnh sân trường</li>
          <li><strong>❓ :</strong> Bấm vào đây bất cứ lúc nào để mở lại hướng dẫn này</li>
        </ul>
        <div class="tour-tip-box">
          <span>🖨️</span>
          <span>Dưới chân thanh chỉ đường có nút <strong>Tạo mã QR</strong> để giáo viên và nhà trường in dán trước cửa phòng!</span>
        </div>`
      }
    ];

    let currentStepIndex = 0;
    let isTourActive = false;

    // Render các chấm tiến trình (Dots)
    function renderProgressDots() {
      tourProgressDots.innerHTML = "";
      tourSteps.forEach((_, idx) => {
        const dot = document.createElement("div");
        dot.className = `tour-dot ${idx === currentStepIndex ? "active" : ""}`;
        dot.title = `Chuyển tới bước ${idx + 1}`;
        dot.addEventListener("click", () => {
          goToStep(idx);
        });
        tourProgressDots.appendChild(dot);
      });
    }

    // Hiển thị các khung minh họa màu đỏ trên bản đồ (như trong ảnh mẫu của user)
    function updateMapHighlights(visible) {
      if (!tourMapHighlights) return;
      if (!visible) {
        tourMapHighlights.style.display = "none";
        tourMapHighlights.innerHTML = "";
        return;
      }

      tourMapHighlights.innerHTML = "";
      tourMapHighlights.style.display = "block";

      // Danh sách các địa điểm tạo khung đỏ minh họa giống hệt ảnh vẽ của người dùng
      const demoLocations = [
        { id: "canopy_triangle", label: "Mái Tam Giác (Sảnh chính)" },
        { id: "cot_co", label: "Cột cờ" },
        { id: "hoi_truong", label: "Hội trường" },
        { id: "a_tret_thu_vien", label: "Thư viện (Trệt)" },
        { id: "b_tret_12a7", label: "Dãy 12 (Trệt)" },
        { id: "bm_tret_ly", label: "Phòng TN Lý" },
        { id: "cong_truong", label: "Cổng trường" }
      ];

      demoLocations.forEach(item => {
        const el = document.querySelector(`[data-loc-id="${item.id}"]`) || document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const box = document.createElement("div");
            box.className = "tour-map-box";
            box.style.left = `${rect.left}px`;
            box.style.top = `${rect.top}px`;
            box.style.width = `${rect.width}px`;
            box.style.height = `${rect.height}px`;

            const lbl = document.createElement("div");
            lbl.className = "tour-map-box-label";
            lbl.textContent = item.label;
            box.appendChild(lbl);

            tourMapHighlights.appendChild(box);
          }
        }
      });
    }

    // Định vị khung spotlight và thẻ card hướng dẫn
    // Định vị khung spotlight và thẻ card hướng dẫn (Tự động tính toán để KHÔNG BAO GIỜ che lấp mục tiêu đang sáng)
    function positionSpotlightAndCard(step) {
      const targetEl = document.querySelector(step.target);
      if (!targetEl) return;

      // Xử lý mobile: mở hoặc đóng sidebar phù hợp với target
      const isMobile = window.innerWidth <= 768;
      if (isMobile && typeof setBottomSheetState === "function") {
        if (step.target.includes("sidebar") || step.target.includes("input") || step.target.includes("group") || step.target.includes("action") || step.target.includes("route")) {
          setBottomSheetState("sheet-half");
        } else {
          setBottomSheetState("sheet-collapsed");
        }
      }

      // Cuộn phần tử vào màn hình nếu cần
      if (step.target !== "#map-viewport" && typeof targetEl.scrollIntoView === "function") {
        targetEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }

      // Đợi layout hoàn tất (trên mobile cần đợi bottom-sheet trượt xong)
      const waitTime = isMobile ? 320 : 80;
      setTimeout(() => {
        const rect = targetEl.getBoundingClientRect();
        const pad = step.target === "#map-viewport" ? 0 : (isMobile ? 4 : 8);

        // Đảm bảo khung spotlight không bao giờ bị tràn sang phải màn hình (đặc biệt trên mobile)
        const boxLeft = Math.max(0, rect.left - pad);
        const boxTop = Math.max(0, rect.top - pad);
        const maxAvailableW = Math.max(20, window.innerWidth - boxLeft - (isMobile ? 2 : 0));
        const boxWidth = Math.min(rect.width + pad * 2, maxAvailableW);
        const boxHeight = rect.height + pad * 2;

        spotlightBox.style.top = `${boxTop}px`;
        spotlightBox.style.left = `${boxLeft}px`;
        spotlightBox.style.width = `${boxWidth}px`;
        spotlightBox.style.height = `${boxHeight}px`;

        if (spotlightLabel) {
          spotlightLabel.innerHTML = `${step.icon ? `<span>${step.icon}</span> ` : ""}${step.label || `Bước ${currentStepIndex + 1}`}`;
          spotlightLabel.className = "tour-spotlight-label";

          // Reset toàn bộ toạ độ inline để tránh xung đột giữa các bước
          spotlightLabel.style.top = "auto";
          spotlightLabel.style.bottom = "auto";
          spotlightLabel.style.left = "auto";
          spotlightLabel.style.right = "auto";
          spotlightLabel.style.transform = "none";

          // Xử lý vị trí thông minh để TUYỆT ĐỐI KHÔNG CHE LẤP các nút bấm và khung tính năng:
          if (step.target.includes("view-mode")) {
            // Thanh chuyển 2D / 3D:
            if (isMobile) {
              // Trên mobile, thanh 2D/3D nằm sát góc trên bên phải -> đặt nhãn sang TRÁI thanh để không che 2D lẫn 3D
              if (boxLeft >= 100) {
                spotlightLabel.classList.add("label-pos-left");
                spotlightLabel.style.right = "calc(100% + 10px)";
                spotlightLabel.style.top = "50%";
                spotlightLabel.style.transform = "translateY(-50%)";
              } else {
                // Màn hình quá hẹp: đặt nhãn ngay DƯỚI thanh
                spotlightLabel.classList.add("label-pos-bottom");
                spotlightLabel.style.top = "calc(100% + 8px)";
                spotlightLabel.style.right = "4px";
              }
            } else {
              // Trên máy tính: đặt nhãn ngay DƯỚI thanh chuyển chế độ (nằm giữa)
              spotlightLabel.classList.add("label-pos-bottom");
              spotlightLabel.style.top = "calc(100% + 8px)";
              spotlightLabel.style.left = "50%";
              spotlightLabel.style.transform = "translateX(-50%)";
            }
          } else if (step.target.includes("controls")) {
            // Cụm phím điều khiển Zoom & Trợ giúp góc phải -> đặt nhãn sang TRÁI cột, chừa 100% các phím (+, -, ⟲, ?)
            spotlightLabel.classList.add("label-pos-left");
            spotlightLabel.style.right = "calc(100% + 10px)";
            spotlightLabel.style.top = "8px";
          } else if (step.target === "#map-viewport") {
            // Toàn cảnh bản đồ
            spotlightLabel.style.top = "16px";
            spotlightLabel.style.left = "16px";
          } else if (boxTop < 44) {
            // Phần tử quá sát mép trên màn hình (< 44px) -> đặt nhãn ngay dưới
            spotlightLabel.classList.add("label-pos-bottom");
            spotlightLabel.style.top = "calc(100% + 8px)";
            spotlightLabel.style.left = "8px";
          } else {
            // Mặc định: đặt nhãn nổi PHÍA TRÊN phần tử (ô nhập điểm đi, điểm đến, nút tìm đường)
            spotlightLabel.classList.add("label-pos-top");
            spotlightLabel.style.bottom = "calc(100% + 8px)";
            spotlightLabel.style.left = "8px";
          }
        }

        // Cập nhật thẻ Card sao cho TUYỆT ĐỐI KHÔNG CHE LẤP mục đang sáng
        const cardWidth = Math.min(410, window.innerWidth - 24);
        const cardHeight = tourCard.offsetHeight || 260;

        if (isMobile) {
          // Tính khoảng trống phía trên và phía dưới mục tiêu
          const spaceAbove = boxTop;
          const spaceBelow = window.innerHeight - (boxTop + boxHeight);

          // Nếu là bước Map, ưu tiên card ở dưới để lộ trọn vẹn bản đồ phía trên.
          // Đối với các mục khác (như Vị trí hiện tại, Nơi muốn đến, Nút tìm đường):
          // nếu mục tiêu nằm ở nửa dưới màn hình (spaceAbove >= spaceBelow hoặc boxTop > 38% chiều cao màn hình),
          // tự động đưa card lên ĐỈNH màn hình để người xem nhìn rõ 100% mục đang hướng dẫn!
          const placeAtTop = !step.isMapStep && (spaceAbove >= spaceBelow || boxTop > window.innerHeight * 0.38);

          if (placeAtTop) {
            tourCard.classList.remove("placement-bottom");
            tourCard.classList.add("placement-top");
            tourCard.style.top = "max(12px, env(safe-area-inset-top))";
            tourCard.style.bottom = "auto";
          } else {
            tourCard.classList.remove("placement-top");
            tourCard.classList.add("placement-bottom");
            tourCard.style.top = "auto";
            tourCard.style.bottom = "max(12px, env(safe-area-inset-bottom))";
          }

          tourCard.style.left = "10px";
          tourCard.style.right = "10px";
          tourCard.style.width = "auto";
        } else {
          tourCard.classList.remove("placement-top", "placement-bottom");
          tourCard.style.bottom = "auto";
          tourCard.style.right = "auto";
          tourCard.style.width = `${cardWidth}px`;

          let cardTop = 100;
          let cardLeft = 20;

          if (step.placement === "right") {
            cardLeft = rect.right + 20;
            cardTop = rect.top;
            if (cardLeft + cardWidth > window.innerWidth - 20) {
              cardLeft = rect.left - cardWidth - 20;
            }
          } else if (step.placement === "left") {
            cardLeft = rect.left - cardWidth - 20;
            cardTop = rect.top;
            if (cardLeft < 20) {
              cardLeft = rect.right + 20;
            }
          } else if (step.placement === "bottom") {
            cardLeft = Math.max(20, rect.left + (rect.width - cardWidth) / 2);
            cardTop = rect.bottom + 16;
            if (cardTop + cardHeight > window.innerHeight - 20) {
              cardTop = rect.top - cardHeight - 16;
            }
          } else if (step.placement === "center") {
            cardLeft = Math.max(460, window.innerWidth - cardWidth - 40);
            cardTop = 120;
          }

          // Giới hạn trong viewport
          cardLeft = Math.max(20, Math.min(cardLeft, window.innerWidth - cardWidth - 20));
          cardTop = Math.max(20, Math.min(cardTop, window.innerHeight - cardHeight - 20));

          tourCard.style.top = `${cardTop}px`;
          tourCard.style.left = `${cardLeft}px`;
        }

        // Hiển thị khung đỏ trên map nếu là bước Map
        updateMapHighlights(!!step.isMapStep);
      }, waitTime);
    }

    // Hiển thị bước cụ thể
    function showStep(index) {
      if (index < 0 || index >= tourSteps.length) return;
      currentStepIndex = index;
      const step = tourSteps[index];

      tourStepCounter.textContent = `Bước ${index + 1} / ${tourSteps.length}`;
      tourStepIcon.textContent = step.icon || "📍";
      tourStepTitle.textContent = step.title;
      tourStepDesc.innerHTML = step.desc;

      tourBtnPrev.disabled = index === 0;

      if (index === tourSteps.length - 1) {
        tourBtnNext.innerHTML = `<span>Bắt đầu ngay</span>`;
      } else {
        tourBtnNext.innerHTML = `<span>Tiếp theo</span>`;
      }

      renderProgressDots();
      positionSpotlightAndCard(step);
    }

    function goToStep(index) {
      showStep(index);
    }

    function nextStep() {
      if (currentStepIndex < tourSteps.length - 1) {
        showStep(currentStepIndex + 1);
      } else {
        finishTour();
      }
    }

    function prevStep() {
      if (currentStepIndex > 0) {
        showStep(currentStepIndex - 1);
      }
    }

    let closeTourTimeout = null;

    function startTour(fromBeginning = true) {
      if (closeTourTimeout) {
        clearTimeout(closeTourTimeout);
        closeTourTimeout = null;
      }

      isTourActive = true;
      if (fromBeginning) {
        currentStepIndex = 0;
      }

      if (tourDontShowAgain) {
        tourDontShowAgain.checked = false;
      }

      tourContainer.style.display = "block";
      requestAnimationFrame(() => {
        tourContainer.classList.add("active");
        showStep(currentStepIndex);
      });
    }
    window.startCampusTour = (fromBeginning = true) => startTour(fromBeginning);

    function finishTour() {
      if (tourDontShowAgain && tourDontShowAgain.checked) {
        localStorage.setItem(STORAGE_KEY, "true");
      }
      closeTour();
      showToast("Sẵn sàng khám phá bản đồ trường!", "🎒");
    }

    function closeTour() {
      isTourActive = false;
      tourContainer.classList.remove("active");
      updateMapHighlights(false);
      closeTourTimeout = setTimeout(() => {
        tourContainer.style.display = "none";
        closeTourTimeout = null;
      }, 280);
    }

    // Gắn sự kiện nút điều khiển trong Card
    tourBtnNext.addEventListener("click", nextStep);
    tourBtnPrev.addEventListener("click", prevStep);
    tourBtnSkip.addEventListener("click", () => {
      if (tourDontShowAgain && tourDontShowAgain.checked) {
        localStorage.setItem(STORAGE_KEY, "true");
      }
      closeTour();
    });
    tourBtnClose.addEventListener("click", () => {
      if (tourDontShowAgain && tourDontShowAgain.checked) {
        localStorage.setItem(STORAGE_KEY, "true");
      }
      closeTour();
    });

    if (tourBackdrop) {
      tourBackdrop.addEventListener("click", (e) => {
        // Tránh đóng nhầm khi click backdrop
        if (e.target === tourBackdrop) {
          // Người dùng click ra vùng tối ngoài card
        }
      });
    }

    // Phím tắt bàn phím
    document.addEventListener("keydown", (e) => {
      if (!isTourActive) return;
      if (e.key === "Escape") {
        closeTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        nextStep();
      } else if (e.key === "ArrowLeft") {
        prevStep();
      }
    });

    // Cập nhật vị trí khi resize hoặc cuộn
    window.addEventListener("resize", () => {
      if (isTourActive) {
        positionSpotlightAndCard(tourSteps[currentStepIndex]);
      }
    });

    // Gắn sự kiện mở tour từ nút trên giao diện (Luôn chạy lại từ Bước 1)
    if (btnStartTour) {
      btnStartTour.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startTour(true);
        showToast("Bắt đầu lại hướng dẫn sử dụng", "💡");
      });
    }

    if (btnMapHelpTour) {
      btnMapHelpTour.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        startTour(true);
        showToast("Bắt đầu lại hướng dẫn sử dụng", "💡");
      });
    }

    // Tự động kích hoạt khi vào trang nếu chưa từng xem
    const hasSeenTour = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenTour) {
      setTimeout(() => {
        startTour(true);
      }, 700);
    }
  }

  // KHỞI ĐỘNG CÁC THÀNH PHẦN
  setupMapRoomInteractions();
  resetMapView();
  handleUrlQueryParams();
  setupQrGeneratorModal();
  setupOnboardingTour();
    setupRoomPhotoViewer();

    window.addEventListener("resize", () => {
      if (currentRoute && currentRoute.points) {
        focusRouteBounds(currentRoute.points);
      } else {
        resetMapView();
      }
      if (activeClickedLoc && mapLocationPopover && mapLocationPopover.style.display !== "none") {
        updatePopoverPosition();
      }
    });

    // ============================================================================
    // ROOM PHOTO VIEWER - Hiển thị ảnh thực tế khi bấm vào phòng trên bản đồ 2D
    // ============================================================================
    function setupRoomPhotoViewer() {
      const modal = document.getElementById("room-photo-modal");
      const backdrop = document.getElementById("rpm-backdrop");
      const closeBtn = document.getElementById("rpm-close-btn");
      const mainImg = document.getElementById("rpm-main-img");
      const skeleton = document.getElementById("rpm-img-skeleton");
      const dotsContainer = document.getElementById("rpm-dots");
      const counter = document.getElementById("rpm-counter");
      const prevBtn = document.getElementById("rpm-prev-btn");
      const nextBtn = document.getElementById("rpm-next-btn");
      const rpmName = document.getElementById("rpm-name");
      const rpmMeta = document.getElementById("rpm-meta");
      const rpmIcon = document.getElementById("rpm-icon");
      const popoverBtnPhoto = document.getElementById("popover-btn-photo");

      // Action buttons bên trong modal
      const btnGate = document.getElementById("rpm-btn-gate");
      const btnStart = document.getElementById("rpm-btn-start");
      const btnDest = document.getElementById("rpm-btn-dest");

      if (!modal) return;

      let currentLoc = null;
      let currentImages = [];
      let currentIndex = 0;

      // Lắng nghe khi showLocationPopover dispatch loc mới
      document.addEventListener("rpm:loc-updated", (e) => {
        currentLoc = e.detail.loc;
      });

      // Mở modal khi bấm nút "Xem ảnh thực tế" trên popover
      if (popoverBtnPhoto) {
        popoverBtnPhoto.addEventListener("click", () => {
          if (!currentLoc) return;
          const images = window.ROOM_IMAGES && window.ROOM_IMAGES[currentLoc.id];
          if (!images || images.length === 0) return;
          openViewer(currentLoc, images);
        });
      }

      // Xử lý các nút hành động trực tiếp trong modal
      if (btnGate) {
        btnGate.addEventListener("click", () => {
          if (!currentLoc) return;
          const gateLoc = window.CAMPUS_LOCATIONS.find(l => l.id === "cong_truong");
          if (gateLoc) {
            startCombobox.selectLocation(gateLoc);
            destCombobox.selectLocation(currentLoc);
            handleCalculateRoute();
            closeViewer();
            showToast(`Đang dẫn đường từ Cổng trường đến ${currentLoc.name}`, "🚀");
          }
        });
      }

      if (btnStart) {
        btnStart.addEventListener("click", () => {
          if (!currentLoc) return;
          startCombobox.selectLocation(currentLoc);
          closeViewer();
          showToast(`Đã chọn điểm xuất phát: ${currentLoc.name}`, "🟢");
          if (selectedDestLoc && selectedDestLoc.id !== currentLoc.id) {
            handleCalculateRoute();
          } else {
            highlightMarkerOnMap();
          }
        });
      }

      if (btnDest) {
        btnDest.addEventListener("click", () => {
          if (!currentLoc) return;
          destCombobox.selectLocation(currentLoc);
          closeViewer();
          showToast(`Đã chọn điểm đến: ${currentLoc.name}`, "🔴");
          if (selectedStartLoc && selectedStartLoc.id !== currentLoc.id) {
            handleCalculateRoute();
          } else {
            highlightMarkerOnMap();
          }
        });
      }

      function openViewer(loc, images, initialIndex = 0) {
        currentLoc = loc;
        currentImages = images;
        currentIndex = (initialIndex >= 0 && initialIndex < images.length) ? initialIndex : 0;

        // Ẩn popover nếu đang mở để tránh vướng víu
        hideLocationPopover();

        // Điền thông tin header
        rpmName.textContent = loc.name;
        const catLabel = getCategoryLabel(loc.category, loc);
        const bldText = loc.building ? ` • ${loc.building}` : "";
        rpmMeta.textContent = `${loc.floor}${bldText} • ${catLabel}`;

        // Icon sinh động theo từng loại phòng
        let icon = "🏫";
        if (loc.name.includes("WC")) icon = "🚻";
        else if (loc.name.includes("Thư Viện")) icon = "📚";
        else if (loc.name.includes("Y Tế")) icon = "🏥";
        else if (loc.name.includes("Cầu thang")) icon = "🪜";
        else if (loc.name.includes("Hội Trường")) icon = "🏛️";
        else if (loc.category === "admin") icon = "🏛️";
        rpmIcon.textContent = icon;

        // Render dots & hiển thị ảnh
        renderDots();
        showImage(currentIndex);

        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
      }

      function closeViewer() {
        modal.style.display = "none";
        document.body.style.overflow = "";
        mainImg.src = "";
      }

      function showImage(index) {
        if (index < 0 || index >= currentImages.length) return;
        currentIndex = index;

        // Skeleton loading shimmer
        skeleton.classList.add("visible");
        mainImg.classList.add("loading");

        const src = encodeImagePath(currentImages[index]);
        mainImg.onload = () => {
          skeleton.classList.remove("visible");
          mainImg.classList.remove("loading");
        };
        mainImg.onerror = () => {
          if (mainImg.src !== currentImages[index]) {
            mainImg.src = currentImages[index];
            return;
          }
          skeleton.classList.remove("visible");
          mainImg.classList.remove("loading");
          mainImg.alt = "Không tải được ảnh";
        };
        mainImg.src = src;

        // Cập nhật bộ đếm
        counter.textContent = `${currentIndex + 1} / ${currentImages.length}`;

        // Cập nhật dots indicator
        dotsContainer.querySelectorAll(".rpm-dot").forEach((dot, i) => {
          dot.classList.toggle("active", i === currentIndex);
        });

        // Cập nhật trạng thái nút lùi/tiến
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === currentImages.length - 1;

        // Ẩn dots + nút điều hướng nếu chỉ có 1 ảnh
        const single = currentImages.length <= 1;
        dotsContainer.style.display = single ? "none" : "flex";
        prevBtn.style.display = single ? "none" : "flex";
        nextBtn.style.display = single ? "none" : "flex";
        counter.style.display = single ? "none" : "block";
      }

      function renderDots() {
        dotsContainer.innerHTML = "";
        currentImages.forEach((_, i) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "rpm-dot" + (i === currentIndex ? " active" : "");
          dot.setAttribute("aria-label", `Ảnh ${i + 1}`);
          dot.addEventListener("click", () => showImage(i));
          dotsContainer.appendChild(dot);
        });
      }

      function encodeImagePath(path) {
        return path.split("/").map(seg => encodeURIComponent(seg)).join("/");
      }

      // Event listeners điều hướng và đóng modal
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showImage(currentIndex - 1);
      });
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showImage(currentIndex + 1);
      });
      closeBtn.addEventListener("click", closeViewer);
      backdrop.addEventListener("click", closeViewer);

      // Phím tắt bàn phím
      document.addEventListener("keydown", (e) => {
        if (modal.style.display !== "flex") return;
        if (e.key === "Escape") closeViewer();
        if (e.key === "ArrowLeft") showImage(currentIndex - 1);
        if (e.key === "ArrowRight") showImage(currentIndex + 1);
      });

      // Vuốt chuyển ảnh ngang trên mobile
      let touchStartX = 0;
      mainImg.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      mainImg.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          if (dx < 0) showImage(currentIndex + 1);
          else showImage(currentIndex - 1);
        }
      }, { passive: true });

      // Vuốt trượt xuống để đóng modal trên mobile
      let panelStartY = 0;
      const panel = modal.querySelector(".rpm-panel");
      if (panel) {
        panel.addEventListener("touchstart", (e) => {
          panelStartY = e.touches[0].clientY;
        }, { passive: true });
        panel.addEventListener("touchend", (e) => {
          const dy = e.changedTouches[0].clientY - panelStartY;
          if (dy > 90) {
            closeViewer();
          }
        }, { passive: true });
      }

      // Expose hàm mở ảnh toàn cục để gọi từ click trên bản đồ
      window.openRoomPhotoForLoc = function(loc, initialIndex = 0) {
        const images = window.ROOM_IMAGES && window.ROOM_IMAGES[loc.id];
        if (images && images.length > 0) openViewer(loc, images, initialIndex);
      };
    }
  });
