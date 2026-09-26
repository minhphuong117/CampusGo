/**
 * data.js - Dữ liệu Vị trí, Tọa độ & Mạng lưới Lối đi Khuôn viên Trường học
 * Đã sửa lỗi: Toàn bộ lối đi liên tòa nhà đều diễn ra ở MẶT ĐẤT / SÂN TRƯỜNG.
 * Cầu thang chỉ dùng để leo lên/xuống các tầng nội bộ của chính tòa nhà đó.
 */

// 1. DANH SÁCH TẤT CẢ VỊ TRÍ (LOCATIONS)
const CAMPUS_LOCATIONS = [
  // --- NGOẠI CẢNH & CỔNG & BÃI XE ---
  {
    id: "cong_truong",
    name: "Cổng Trường (Cổng chính)",
    category: "Cổng & Bãi xe",
    floor: "Sân trường",
    building: "Ngoại cảnh",
    x: 660,
    y: 1008,
    node: "node_gate_front",
    keywords: ["cổng", "cổng chính", "cổng trước", "ra vào", "gate", "main gate", "entrance"],
    description: "Cổng ra vào chính phía Nam khuôn viên trường"
  },
  {
    id: "nha_xe_truoc",
    name: "Nhà xe Học Sinh gần cổng trước",
    category: "Cổng & Bãi xe",
    floor: "Mặt đất",
    building: "Khu vực để xe",
    x: 1160,
    y: 925,
    node: "node_bike_front",
    keywords: ["nhà xe", "bãi xe", "xe học sinh", "xe cổng trước", "gửi xe", "parking"],
    description: "Khu vực để xe tập trung của học sinh gần cổng trước"
  },
  {
    id: "nha_xe_gv",
    name: "Nhà xe Giáo Viên",
    category: "Cổng & Bãi xe",
    floor: "Mặt đất",
    building: "Khu vực để xe",
    x: 170,
    y: 903,
    node: "node_bike_gv",
    keywords: ["nhà xe giáo viên", "xe gv", "bãi xe thầy cô", "giáo viên"],
    description: "Khu vực để xe dành riêng cho cán bộ giáo viên (Học sinh không đi lối này)"
  },
  {
    id: "cong_sau",
    name: "Cổng Sau",
    category: "Cổng & Bãi xe",
    floor: "Sân trường",
    building: "Ngoại cảnh",
    x: 280,
    y: 88,
    node: "node_gate_back",
    keywords: ["cổng sau", "cổng phụ", "lối sau", "back gate"],
    description: "Cổng phía Bắc trường học, gần nhà xe cổng sau"
  },
  {
    id: "nha_xe_sau",
    name: "Nhà xe gần cổng sau",
    category: "Cổng & Bãi xe",
    floor: "Mặt đất",
    building: "Khu vực để xe",
    x: 120,
    y: 112,
    node: "node_bike_back",
    keywords: ["nhà xe cổng sau", "bãi xe sau"],
    description: "Khu để xe học sinh khu vực cổng sau"
  },
  {
    id: "day_xe_tay",
    name: "Dãy để xe học sinh (Phía Tây)",
    category: "Cổng & Bãi xe",
    floor: "Mặt đất",
    building: "Khu vực để xe",
    x: 72,
    y: 430,
    node: "node_bike_west",
    keywords: ["dãy xe", "xe phía tây", "bãi xe tây"],
    description: "Dãy để xe học sinh dọc hành lang phía Tây"
  },
  {
    id: "khu_xe_dong",
    name: "Khu vực xe học sinh (Phía Đông)",
    category: "Cổng & Bãi xe",
    floor: "Mặt đất",
    building: "Khu vực để xe",
    x: 1445,
    y: 450,
    node: "node_bike_east",
    keywords: ["khu xe đông", "bãi xe đông"],
    description: "Khu vực để xe học sinh phía Đông gần sân bóng"
  },
  {
    id: "san_bong",
    name: "Lối vào Sân Bóng",
    category: "Ngoại cảnh",
    floor: "Mặt đất",
    building: "Khu thể thao",
    x: 1400,
    y: 580,
    node: "node_soccer_entrance",
    keywords: ["sân bóng", "thể thao", "sân đá banh", "football"],
    description: "Lối ra khu vực sân thể thao, sân bóng đá trường"
  },
  {
    id: "nha_lop_ton",
    name: "Nhà lợp tôn (Phía Đông Bắc)",
    category: "Ngoại cảnh",
    floor: "Mặt đất",
    building: "Khu vực chức năng",
    x: 1095,
    y: 95,
    node: "node_metal_roof",
    keywords: ["nhà lợp tôn", "nhà tôn", "kho"],
    description: "Nhà lợp tôn khu vực Đông Bắc khuôn viên"
  },
  {
    id: "cot_co",
    name: "Cột Cờ (Sân trung tâm)",
    category: "Ngoại cảnh",
    floor: "Sân trường",
    building: "Sân chính",
    x: 720,
    y: 720,
    node: "node_flagpole",
    keywords: ["cột cờ", "sân cờ", "sân trường", "chào cờ", "sân chính", "flag"],
    description: "Cột cờ trung tâm sân trường, nơi tổ chức các sự kiện chào cờ"
  },

  // --- DÃY NHÀ LỚP HỌC SAU (TẦNG TRỆT, 1, 2, 3) ---
  // Tầng trệt (Ở MẶT ĐẤT)
  {
    id: "sau_tret_thu_vien",
    name: "Thư Viện (Tầng trệt - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng trệt",
    building: "Dãy lớp sau",
    x: 537,
    y: 299,
    node: "node_back_g_library",
    keywords: ["thư viện", "đọc sách", "mượn sách", "thu vien", "library"],
    description: "Thư viện trường tại tầng trệt dãy nhà sau"
  },
  {
    id: "sau_tret_p03",
    name: "Phòng P.03 (Tầng trệt - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng trệt",
    building: "Dãy lớp sau",
    x: 302,
    y: 299,
    node: "node_back_g_rooms_left",
    keywords: ["p03", "p.03", "phòng 03", "phòng 3"],
    description: "Phòng học P.03 tầng trệt cụm trái dãy sau"
  },
  {
    id: "sau_tret_p04",
    name: "Phòng P.04 (Tầng trệt - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng trệt",
    building: "Dãy lớp sau",
    x: 357,
    y: 299,
    node: "node_back_g_rooms_left",
    keywords: ["p04", "p.04", "phòng 04", "phòng 4"],
    description: "Phòng học P.04 tầng trệt cụm trái dãy sau"
  },
  {
    id: "sau_tret_p05",
    name: "Phòng P.05 (Tầng trệt - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng trệt",
    building: "Dãy lớp sau",
    x: 717,
    y: 299,
    node: "node_back_g_rooms_right",
    keywords: ["p05", "p.05", "phòng 05", "phòng 5"],
    description: "Phòng học P.05 tầng trệt cụm phải dãy sau"
  },
  {
    id: "sau_tret_p06",
    name: "Phòng P.06 (Tầng trệt - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng trệt",
    building: "Dãy lớp sau",
    x: 772,
    y: 299,
    node: "node_back_g_rooms_right",
    keywords: ["p06", "p.06", "phòng 06", "phòng 6"],
    description: "Phòng học P.06 tầng trệt cụm phải dãy sau"
  },
  {
    id: "sau_tret_wc",
    name: "Khu Vệ Sinh WC (Tầng trệt - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng trệt",
    building: "Dãy lớp sau",
    x: 252,
    y: 299,
    node: "node_back_g_wc",
    keywords: ["wc", "nhà vệ sinh", "toilet", "ve sinh"],
    description: "Nhà vệ sinh tầng trệt góc phía Tây dãy lớp sau"
  },

  // Tầng 1 Dãy sau (Đi Cầu Thang 1 hoặc 2)
  {
    id: "sau_t1_p15",
    name: "Phòng P.15 (Tầng 1 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 1",
    building: "Dãy lớp sau",
    x: 302,
    y: 253,
    node: "node_back_stair1_t1",
    keywords: ["p15", "p.15", "phòng 15"],
    description: "Phòng học P.15 tầng 1 dãy sau (Đi Cầu thang 1)"
  },
  {
    id: "sau_t1_p16",
    name: "Phòng P.16 (Tầng 1 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 1",
    building: "Dãy lớp sau",
    x: 357,
    y: 253,
    node: "node_back_stair1_t1",
    keywords: ["p16", "p.16", "phòng 16"],
    description: "Phòng học P.16 tầng 1 dãy sau (Đi Cầu thang 1)"
  },
  {
    id: "sau_t1_p17",
    name: "Phòng P.17 (Tầng 1 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 1",
    building: "Dãy lớp sau",
    x: 482,
    y: 253,
    node: "node_back_stair1_t1",
    keywords: ["p17", "p.17", "phòng 17"],
    description: "Phòng học P.17 tầng 1 dãy sau (Đi Cầu thang 1)"
  },
  {
    id: "sau_t1_p18",
    name: "Phòng P.18 (Tầng 1 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 1",
    building: "Dãy lớp sau",
    x: 537,
    y: 253,
    node: "node_back_stair2_t1",
    keywords: ["p18", "p.18", "phòng 18"],
    description: "Phòng học P.18 tầng 1 dãy sau (Đi Cầu thang 2)"
  },
  {
    id: "sau_t1_p19",
    name: "Phòng P.19 (Tầng 1 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 1",
    building: "Dãy lớp sau",
    x: 592,
    y: 253,
    node: "node_back_stair2_t1",
    keywords: ["p19", "p.19", "phòng 19"],
    description: "Phòng học P.19 tầng 1 dãy sau (Đi Cầu thang 2)"
  },
  {
    id: "sau_t1_p08",
    name: "Phòng P.08 (Tầng 1 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 1",
    building: "Dãy lớp sau",
    x: 717,
    y: 253,
    node: "node_back_stair2_t1",
    keywords: ["p08", "p.08", "phòng 08", "phòng 8"],
    description: "Phòng học P.08 tầng 1 dãy sau (Đi Cầu thang 2)"
  },
  {
    id: "sau_t1_p07",
    name: "Phòng P.07 (Tầng 1 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 1",
    building: "Dãy lớp sau",
    x: 772,
    y: 253,
    node: "node_back_stair2_t1",
    keywords: ["p07", "p.07", "phòng 07", "phòng 7"],
    description: "Phòng học P.07 tầng 1 dãy sau (Đi Cầu thang 2)"
  },

  // Tầng 2 Dãy sau
  {
    id: "sau_t2_p09",
    name: "Phòng P.09 (Tầng 2 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 2",
    building: "Dãy lớp sau",
    x: 302,
    y: 207,
    node: "node_back_stair1_t2",
    keywords: ["p09", "p.09", "phòng 09", "phòng 9"],
    description: "Phòng học P.09 tầng 2 dãy sau (Đi Cầu thang 1 lên tầng 2)"
  },
  {
    id: "sau_t2_p10",
    name: "Phòng P.10 (Tầng 2 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 2",
    building: "Dãy lớp sau",
    x: 357,
    y: 207,
    node: "node_back_stair1_t2",
    keywords: ["p10", "p.10", "phòng 10"],
    description: "Phòng học P.10 tầng 2 dãy sau (Đi Cầu thang 1)"
  },
  {
    id: "sau_t2_p11",
    name: "Phòng P.11 (Tầng 2 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 2",
    building: "Dãy lớp sau",
    x: 482,
    y: 207,
    node: "node_back_stair1_t2",
    keywords: ["p11", "p.11", "phòng 11"],
    description: "Phòng học P.11 tầng 2 dãy sau (Đi Cầu thang 1)"
  },
  {
    id: "sau_t2_p12",
    name: "Phòng P.12 (Tầng 2 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 2",
    building: "Dãy lớp sau",
    x: 537,
    y: 207,
    node: "node_back_stair2_t2",
    keywords: ["p12", "p.12", "phòng 12"],
    description: "Phòng học P.12 tầng 2 dãy sau (Đi Cầu thang 2)"
  },
  {
    id: "sau_t2_p20",
    name: "Phòng P.20 (Tầng 2 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 2",
    building: "Dãy lớp sau",
    x: 592,
    y: 207,
    node: "node_back_stair2_t2",
    keywords: ["p20", "p.20", "phòng 20"],
    description: "Phòng học P.20 tầng 2 dãy sau (Đi Cầu thang 2)"
  },
  {
    id: "sau_t2_p13",
    name: "Phòng P.13 (Tầng 2 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 2",
    building: "Dãy lớp sau",
    x: 717,
    y: 207,
    node: "node_back_stair2_t2",
    keywords: ["p13", "p.13", "phòng 13"],
    description: "Phòng học P.13 tầng 2 dãy sau (Đi Cầu thang 2)"
  },
  {
    id: "sau_t2_p14",
    name: "Phòng P.14 (Tầng 2 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 2",
    building: "Dãy lớp sau",
    x: 772,
    y: 207,
    node: "node_back_stair2_t2",
    keywords: ["p14", "p.14", "phòng 14"],
    description: "Phòng học P.14 tầng 2 dãy sau (Đi Cầu thang 2)"
  },

  // Tầng 3 Dãy sau
  {
    id: "sau_t3_p18",
    name: "Phòng P.18 (Tầng 3 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 3",
    building: "Dãy lớp sau",
    x: 537,
    y: 161,
    node: "node_back_stair1_t3",
    keywords: ["p18 tầng 3", "p18 t3"],
    description: "Phòng học P.18 tầng 3 dãy sau"
  },
  {
    id: "sau_t3_p17",
    name: "Phòng P.17 (Tầng 3 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 3",
    building: "Dãy lớp sau",
    x: 592,
    y: 161,
    node: "node_back_stair2_t3",
    keywords: ["p17 tầng 3", "p17 t3"],
    description: "Phòng học P.17 tầng 3 dãy sau"
  },
  {
    id: "sau_t3_p16",
    name: "Phòng P.16 (Tầng 3 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 3",
    building: "Dãy lớp sau",
    x: 717,
    y: 161,
    node: "node_back_stair2_t3",
    keywords: ["p16 tầng 3", "p16 t3"],
    description: "Phòng học P.16 tầng 3 dãy sau"
  },
  {
    id: "sau_t3_p15",
    name: "Phòng P.15 (Tầng 3 - Dãy sau)",
    category: "Dãy Lớp Học Sau",
    floor: "Tầng 3",
    building: "Dãy lớp sau",
    x: 772,
    y: 161,
    node: "node_back_stair2_t3",
    keywords: ["p15 tầng 3", "p15 t3"],
    description: "Phòng học P.15 tầng 3 dãy sau"
  },

  // --- DÃY NHÀ LỚP HỌC TRƯỚC (TẦNG TRỆT, 1, 2, 3) ---
  // Tầng trệt
  {
    id: "truoc_tret_p01_l",
    name: "Phòng P.01 (Tầng trệt - Trái - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng trệt",
    building: "Dãy lớp trước",
    x: 262,
    y: 552,
    node: "node_front_g_rooms_left",
    keywords: ["p01", "p.01", "phòng 01", "phòng 1 dãy trước"],
    description: "Phòng học P.01 bên trái cầu thang tầng trệt dãy trước"
  },
  {
    id: "truoc_tret_p02",
    name: "Phòng P.02 (Tầng trệt - Trái - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng trệt",
    building: "Dãy lớp trước",
    x: 317,
    y: 552,
    node: "node_front_g_rooms_left",
    keywords: ["p02", "p.02", "phòng 02", "phòng 2"],
    description: "Phòng học P.02 tầng trệt dãy trước"
  },
  {
    id: "truoc_tret_p01_r",
    name: "Phòng P.01 (Tầng trệt - Phải - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng trệt",
    building: "Dãy lớp trước",
    x: 437,
    y: 552,
    node: "node_front_g_rooms_right",
    keywords: ["p01 phải", "p01", "p.01", "phòng 01"],
    description: "Phòng học P.01 bên phải cầu thang tầng trệt dãy trước"
  },
  {
    id: "truoc_tret_p03",
    name: "Phòng P.03 (Tầng trệt - Phải - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng trệt",
    building: "Dãy lớp trước",
    x: 492,
    y: 552,
    node: "node_front_g_rooms_right",
    keywords: ["p03", "p.03", "phòng 03 dãy trước"],
    description: "Phòng học P.03 tầng trệt dãy trước"
  },
  {
    id: "truoc_tret_wc",
    name: "Khu Vệ Sinh WC (Tầng trệt - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng trệt",
    building: "Dãy lớp trước",
    x: 212,
    y: 552,
    node: "node_front_g_wc",
    keywords: ["wc dãy trước", "nhà vệ sinh dãy trước", "toilet"],
    description: "WC góc trái tầng trệt dãy nhà trước"
  },

  // Tầng 1 Dãy trước
  {
    id: "truoc_t1_p07",
    name: "Phòng P.07 (Tầng 1 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 1",
    building: "Dãy lớp trước",
    x: 262,
    y: 507,
    node: "node_front_stair_t1",
    keywords: ["p07", "p.07", "phòng 07 dãy trước"],
    description: "Phòng học P.07 tầng 1 dãy trước (Đi cầu thang giữa)"
  },
  {
    id: "truoc_t1_p06",
    name: "Phòng P.06 (Tầng 1 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 1",
    building: "Dãy lớp trước",
    x: 317,
    y: 507,
    node: "node_front_stair_t1",
    keywords: ["p06", "p.06", "phòng 06 dãy trước"],
    description: "Phòng học P.06 tầng 1 dãy trước"
  },
  {
    id: "truoc_t1_p05",
    name: "Phòng P.05 (Tầng 1 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 1",
    building: "Dãy lớp trước",
    x: 437,
    y: 507,
    node: "node_front_stair_t1",
    keywords: ["p05", "p.05", "phòng 05 dãy trước"],
    description: "Phòng học P.05 tầng 1 dãy trước"
  },
  {
    id: "truoc_t1_p04",
    name: "Phòng P.04 (Tầng 1 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 1",
    building: "Dãy lớp trước",
    x: 492,
    y: 507,
    node: "node_front_stair_t1",
    keywords: ["p04", "p.04", "phòng 04 dãy trước"],
    description: "Phòng học P.04 tầng 1 dãy trước"
  },

  // Tầng 2 Dãy trước
  {
    id: "truoc_t2_p08",
    name: "Phòng P.08 (Tầng 2 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 2",
    building: "Dãy lớp trước",
    x: 262,
    y: 462,
    node: "node_front_stair_t2",
    keywords: ["p08", "p.08", "phòng 08 dãy trước"],
    description: "Phòng học P.08 tầng 2 dãy trước"
  },
  {
    id: "truoc_t2_p02",
    name: "Phòng P.02 (Tầng 2 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 2",
    building: "Dãy lớp trước",
    x: 317,
    y: 462,
    node: "node_front_stair_t2",
    keywords: ["p02 tầng 2", "phòng 02 tầng 2"],
    description: "Phòng học P.02 tầng 2 dãy trước"
  },
  {
    id: "truoc_t2_p09",
    name: "Phòng P.09 (Tầng 2 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 2",
    building: "Dãy lớp trước",
    x: 437,
    y: 462,
    node: "node_front_stair_t2",
    keywords: ["p09 dãy trước", "p.09 dãy trước"],
    description: "Phòng học P.09 tầng 2 dãy trước"
  },
  {
    id: "truoc_t2_p10",
    name: "Phòng P.10 (Tầng 2 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 2",
    building: "Dãy lớp trước",
    x: 492,
    y: 462,
    node: "node_front_stair_t2",
    keywords: ["p10 dãy trước", "p.10 dãy trước"],
    description: "Phòng học P.10 tầng 2 dãy trước"
  },

  // Tầng 3 Dãy trước
  {
    id: "truoc_t3_p14",
    name: "Phòng P.14 (Tầng 3 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 3",
    building: "Dãy lớp trước",
    x: 262,
    y: 417,
    node: "node_front_stair_t3",
    keywords: ["p14 dãy trước"],
    description: "Phòng học P.14 tầng 3 dãy trước"
  },
  {
    id: "truoc_t3_p13",
    name: "Phòng P.13 (Tầng 3 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 3",
    building: "Dãy lớp trước",
    x: 317,
    y: 417,
    node: "node_front_stair_t3",
    keywords: ["p13 dãy trước"],
    description: "Phòng học P.13 tầng 3 dãy trước"
  },
  {
    id: "truoc_t3_p12",
    name: "Phòng P.12 (Tầng 3 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 3",
    building: "Dãy lớp trước",
    x: 437,
    y: 417,
    node: "node_front_stair_t3",
    keywords: ["p12 dãy trước"],
    description: "Phòng học P.12 tầng 3 dãy trước"
  },
  {
    id: "truoc_t3_p11",
    name: "Phòng P.11 (Tầng 3 - Dãy trước)",
    category: "Dãy Lớp Học Trước",
    floor: "Tầng 3",
    building: "Dãy lớp trước",
    x: 492,
    y: 417,
    node: "node_front_stair_t3",
    keywords: ["p11 dãy trước"],
    description: "Phòng học P.11 tầng 3 dãy trước"
  },

  // --- DÃY HÀNH CHÍNH & PHÒNG HỘI ĐỒNG ---
  {
    id: "phong_hoi_dong",
    name: "Phòng Hội Đồng (Tầng 1 - Dãy Hành Chính)",
    category: "Dãy Hành Chính",
    floor: "Tầng 1",
    building: "Dãy Hành chính",
    x: 520,
    y: 640,
    node: "node_admin_stair_t1",
    keywords: ["hội đồng", "phòng hội đồng", "ban giám hiệu", "hop", "hoi dong"],
    description: "Phòng họp Hội đồng sư phạm nhà trường tại Tầng 1 Dãy Hành chính"
  },
  {
    id: "hanh_chinh_tret",
    name: "Văn Phòng Hành Chính (Tầng trệt)",
    category: "Dãy Hành Chính",
    floor: "Tầng trệt",
    building: "Dãy Hành chính",
    x: 430,
    y: 679,
    node: "node_admin_g_corridor",
    keywords: ["hành chính", "văn phòng", "học vụ", "văn thư", "kế toán"],
    description: "Khu vực các phòng ban làm việc Hành chính tầng trệt"
  },

  // --- DÃY THIẾT BỊ, CÁC PHÒNG CHỨC NĂNG & HỘI TRƯỜNG ---
  {
    id: "hoi_truong",
    name: "Hội Trường Lớn (Tầng trệt)",
    category: "Dãy Thiết Bị & Chức Năng",
    floor: "Tầng trệt",
    building: "Khối chức năng",
    x: 1083,
    y: 712,
    node: "node_hall_g_entry",
    keywords: ["hội trường", "hoi truong", "nhà đa năng", "sự kiện", "lễ", "hall"],
    description: "Hội trường lớn tầng trệt tổ chức đại hội, sự kiện văn nghệ"
  },
  {
    id: "phong_y_te",
    name: "Phòng Y Tế (+) (Tầng trệt)",
    category: "Dãy Thiết Bị & Chức Năng",
    floor: "Tầng trệt",
    building: "Khối chức năng",
    x: 978,
    y: 601,
    node: "node_func_g_yte",
    keywords: ["y tế", "y te", "sơ cấp cứu", "thuốc", "bác sĩ", "medical"],
    description: "Phòng chăm sóc y tế học đường tại tầng trệt khối chức năng"
  },
  {
    id: "phong_thi_nghiem",
    name: "Phòng Thí Nghiệm (Tầng trệt)",
    category: "Dãy Thiết Bị & Chức Năng",
    floor: "Tầng trệt",
    building: "Khối chức năng",
    x: 1133,
    y: 601,
    node: "node_func_g_lab",
    keywords: ["thí nghiệm", "thi nghiem", "hóa sinh", "vật lý", "lab"],
    description: "Phòng thí nghiệm thực hành các môn Khoa học (Kế bên phòng Y tế tầng trệt)"
  },
  {
    id: "vp_doan",
    name: "Văn Phòng Đoàn Thanh Niên (Tầng 1)",
    category: "Dãy Thiết Bị & Chức Năng",
    floor: "Tầng 1",
    building: "Khối chức năng",
    x: 978,
    y: 529,
    node: "node_func_stair_t1",
    keywords: ["đoàn", "vp đoàn", "thanh niên", "đội", "doan"],
    description: "Văn phòng Đoàn TNCS Hồ Chí Minh tại Tầng 1 (Đi cầu thang lên)"
  },
  {
    id: "tin_hoc_1",
    name: "Phòng Tin Học Số 1 (Tầng 1)",
    category: "Dãy Thiết Bị & Chức Năng",
    floor: "Tầng 1",
    building: "Khối chức năng",
    x: 1080,
    y: 529,
    node: "node_func_stair_t1",
    keywords: ["tin học 1", "tin hoc 1", "máy tính 1", "lab tin 1", "computer 1"],
    description: "Phòng thực hành Tin học máy tính số 1 tại Tầng 1 (Đi cầu thang lên)"
  },
  {
    id: "tin_hoc_2",
    name: "Phòng Tin Học Số 2 (Tầng 1)",
    category: "Dãy Thiết Bị & Chức Năng",
    floor: "Tầng 1",
    building: "Khối chức năng",
    x: 1185,
    y: 529,
    node: "node_func_stair_t1",
    keywords: ["tin học 2", "tin hoc 2", "máy tính 2", "lab tin 2", "computer 2"],
    description: "Phòng thực hành Tin học máy tính số 2 tại Tầng 1 (Đi cầu thang lên)"
  },
  {
    id: "day_nha_thiet_bi",
    name: "Dãy Nhà Thiết Bị (Tầng 2)",
    category: "Dãy Thiết Bị & Chức Năng",
    floor: "Tầng 2",
    building: "Khối chức năng",
    x: 1083,
    y: 446,
    node: "node_func_stair_t2",
    keywords: ["thiết bị", "thiet bi", "dụng cụ", "đồ dùng dạy học"],
    description: "Kho và phòng quản lý thiết bị dạy học tại Tầng 2"
  }
];

// 2. MẠNG LƯỚI ĐỒ THỊ LỐI ĐI CHUẨN XÁC THEO MẶT ĐẤT & CẦU THANG NỘI BỘ
const CAMPUS_GRAPH_NODES = {
  // --- A. TRỤC SÂN TRƯỜNG CHÍNH (GROUND LEVEL - MẶT ĐẤT) ---
  node_gate_front: { x: 660, y: 980, name: "Cổng trường" },
  node_main_split: { x: 660, y: 925, name: "Sảnh vào từ Cổng trường" },
  node_courtyard_south: { x: 720, y: 800, name: "Sân trường phía Nam" },
  node_flagpole: { x: 720, y: 720, name: "Khu vực Cột Cờ trung tâm" },
  node_courtyard_mid: { x: 720, y: 550, name: "Khoảng sân trung tâm rộng lớn" },
  node_courtyard_north: { x: 720, y: 340, name: "Sân trường trước Dãy Lớp Sau" },

  // --- B. CÁC LỐI ĐI VÀO BÃI XE & NGOẠI CẢNH (MẶT ĐẤT) ---
  node_bike_front_entry: { x: 920, y: 925, name: "Lối rẽ vào bãi xe học sinh trước" },
  node_bike_front: { x: 1160, y: 925, name: "Nhà xe HS gần cổng trước" },
  node_bike_gv_entry: { x: 350, y: 925, name: "Lối vào nhà xe Giáo viên" },
  node_bike_gv: { x: 170, y: 903, name: "Nhà xe Giáo Viên" },

  // --- C. HÀNH LANG TẦNG TRỆT DÃY LỚP SAU (MẶT ĐẤT - Y: 340) ---
  node_back_g_library: { x: 537, y: 340, name: "Sân trước Thư Viện (Tầng trệt)" },
  node_back_g_c1: { x: 390, y: 340, name: "Chân Cầu Thang 1 Dãy Sau (Tầng trệt)" },
  node_back_g_rooms_left: { x: 302, y: 340, name: "Hành lang phòng P.03, P.04 (Tầng trệt)" },
  node_back_g_wc: { x: 240, y: 340, name: "Hành lang WC Dãy Sau (Tầng trệt)" },
  node_back_g_c2: { x: 625, y: 340, name: "Chân Cầu Thang 2 Dãy Sau (Tầng trệt)" },
  node_back_g_rooms_right: { x: 740, y: 340, name: "Hành lang phòng P.05, P.06 (Tầng trệt)" },

  // Cổng sau & Dãy để xe Tây
  node_gate_back_walk: { x: 280, y: 200, name: "Đường ra Cổng Sau" },
  node_gate_back: { x: 280, y: 88, name: "Cổng Sau" },
  node_bike_back: { x: 120, y: 112, name: "Nhà xe Cổng Sau" },
  node_bike_west_corner: { x: 115, y: 165, name: "Khúc cua nhà xe Tây" },
  node_bike_west: { x: 72, y: 430, name: "Dãy để xe Học sinh phía Tây" },

  // --- D. CÁC TẦNG CẦU THANG NỘI BỘ DÃY LỚP SAU (CHỈ ĐI THẲNG ĐỨNG) ---
  // Cầu Thang 1 (Phía Tây):
  node_back_stair1_t1: { x: 390, y: 253, name: "Cầu Thang 1 - Tầng 1 Dãy Sau" },
  node_back_stair1_t2: { x: 390, y: 207, name: "Cầu Thang 1 - Tầng 2 Dãy Sau (lên P.09, P.10, P.11)" },
  node_back_stair1_t3: { x: 390, y: 161, name: "Cầu Thang 1 - Tầng 3 Dãy Sau (lên P.18)" },
  // Cầu Thang 2 (Phía Đông):
  node_back_stair2_t1: { x: 625, y: 253, name: "Cầu Thang 2 - Tầng 1 Dãy Sau (lên P.07, P.08, P.18, P.19)" },
  node_back_stair2_t2: { x: 625, y: 207, name: "Cầu Thang 2 - Tầng 2 Dãy Sau (lên P.12, P.13, P.14, P.20)" },
  node_back_stair2_t3: { x: 625, y: 161, name: "Cầu Thang 2 - Tầng 3 Dãy Sau (lên P.15, P.16, P.17)" },

  // --- E. HÀNH LANG TẦNG TRỆT DÃY LỚP TRƯỚC (MẶT ĐẤT - Y: 575) ---
  node_front_g_entry: { x: 540, y: 575, name: "Lối vào Tầng trệt Dãy Lớp Trước từ sân cờ" },
  node_front_g_rooms_right: { x: 465, y: 575, name: "Hành lang phòng P.01, P.03 Dãy Trước (Tầng trệt)" },
  node_front_g_stair: { x: 350, y: 575, name: "Chân Cầu Thang giữa Dãy Trước (Tầng trệt)" },
  node_front_g_rooms_left: { x: 290, y: 575, name: "Hành lang phòng P.01, P.02 Dãy Trước (Tầng trệt)" },
  node_front_g_wc: { x: 212, y: 575, name: "Hành lang WC Dãy Trước (Tầng trệt)" },

  // Cầu thang nội bộ Dãy Lớp Trước (CHỈ ĐI THẲNG ĐỨNG)
  node_front_stair_t1: { x: 350, y: 507, name: "Cầu Thang - Tầng 1 Dãy Trước (P.04, P.05, P.06, P.07)" },
  node_front_stair_t2: { x: 350, y: 462, name: "Cầu Thang - Tầng 2 Dãy Trước (P.02, P.08, P.09, P.10)" },
  node_front_stair_t3: { x: 350, y: 417, name: "Cầu Thang - Tầng 3 Dãy Trước (P.11, P.12, P.13, P.14)" },

  // --- F. DÃY HÀNH CHÍNH & PHÒNG HỘI ĐỒNG ---
  node_admin_g_entry: { x: 520, y: 700, name: "Lối vào Dãy Hành chính Tầng trệt" },
  node_admin_g_corridor: { x: 430, y: 700, name: "Văn phòng Hành chính Tầng trệt" },
  node_admin_g_stair: { x: 350, y: 700, name: "Chân Cầu Thang Dãy Hành chính (Tầng trệt)" },
  node_admin_stair_t1: { x: 350, y: 640, name: "Cầu Thang Tầng 1 - Phòng Hội Đồng" },

  // --- G. KHỐI CHỨC NĂNG, THIẾT BỊ & HỘI TRƯỜNG ---
  node_hall_g_entry: { x: 860, y: 712, name: "Cửa vào Hội Trường (Tầng trệt)" },
  node_func_g_yte: { x: 978, y: 601, name: "Phòng Y Tế (+) (Tầng trệt)" },
  node_func_g_lab: { x: 1133, y: 601, name: "Phòng Thí Nghiệm (Tầng trệt)" },
  node_func_g_stair: { x: 890, y: 601, name: "Chân Cầu Thang Dãy Thiết Bị (Tầng trệt)" },
  // Cầu thang nội bộ khối chức năng
  node_func_stair_t1: { x: 890, y: 529, name: "Cầu Thang Tầng 1 - Tin Học 1, 2 & VP Đoàn" },
  node_func_stair_t2: { x: 890, y: 446, name: "Cầu Thang Tầng 2 - Dãy Nhà Thiết Bị" },

  // Phía Đông (Sân bóng, Dãy xe Đông)
  node_east_walk_soccer: { x: 860, y: 580, name: "Lối sang khu thể thao phía Đông" },
  node_east_turn_soccer: { x: 1300, y: 580, name: "Lối vào Sân Bóng" },
  node_soccer_entrance: { x: 1400, y: 580, name: "Sân Bóng Đá" },
  node_bike_east: { x: 1445, y: 450, name: "Khu vực xe Học sinh phía Đông" },
  node_metal_roof: { x: 1095, y: 95, name: "Nhà Lợp Tôn" }
};

// 3. MẠNG LƯỚI ĐƯỜNG ĐI (EDGES) - ĐẢM BẢO KHÔNG LÊN LẦU SAI VỊ TRÍ
const CAMPUS_GRAPH_EDGES = [
  // --- TRỤC CHÍNH SÂN TRƯỜNG (HOÀN TOÀN MẶT ĐẤT) ---
  { from: "node_gate_front", to: "node_main_split", desc: "Đi thẳng qua Cổng chính vào trường" },
  { from: "node_main_split", to: "node_courtyard_south", desc: "Đi thẳng qua trục đường chính hướng về sân cờ" },
  { from: "node_courtyard_south", to: "node_flagpole", desc: "Đi thẳng qua khu vực Cột Cờ trung tâm" },
  { from: "node_flagpole", to: "node_courtyard_mid", desc: "Đi thẳng qua khoảng sân trung tâm giữa các tòa nhà" },
  { from: "node_courtyard_mid", to: "node_courtyard_north", desc: "Đi thẳng trên sân trường đến trước Dãy Lớp Sau" },

  // --- TỪ SÂN TRƯỜNG VÀO THƯ VIỆN & CÁC PHÒNG TẦNG TRỆT DÃY SAU ---
  // (ĐI HOÀN TOÀN TRÊN MẶT ĐẤT, KHÔNG HỀ LÊN CẦU THANG!)
  { from: "node_courtyard_north", to: "node_back_g_library", desc: "Rẽ sang sảnh trước Thư Viện (Tầng trệt)" },
  { from: "node_back_g_library", to: "node_back_g_c1", desc: "Đi dọc hành lang Tầng trệt đến Chân Cầu Thang 1" },
  { from: "node_back_g_c1", to: "node_back_g_rooms_left", desc: "Đi tiếp hành lang Tầng trệt qua phòng P.03, P.04" },
  { from: "node_back_g_rooms_left", to: "node_back_g_wc", desc: "Đi đến khu WC Tầng trệt phía Tây" },

  { from: "node_courtyard_north", to: "node_back_g_c2", desc: "Rẽ sang sảnh Chân Cầu Thang 2 Dãy Sau (Tầng trệt)" },
  { from: "node_back_g_c2", to: "node_back_g_rooms_right", desc: "Đi dọc hành lang Tầng trệt qua phòng P.05, P.06" },

  // Cổng sau & Dãy xe Tây (từ tầng trệt)
  { from: "node_back_g_c1", to: "node_gate_back_walk", desc: "Đi ra lối Cổng Sau" },
  { from: "node_gate_back_walk", to: "node_gate_back", desc: "Đi thẳng ra Cổng Sau" },
  { from: "node_gate_back", to: "node_bike_back", desc: "Rẽ vào Nhà xe Cổng Sau" },
  { from: "node_gate_back_walk", to: "node_bike_west_corner", desc: "Đi qua khúc cua vào Dãy xe Tây" },
  { from: "node_bike_west_corner", to: "node_bike_west", desc: "Đi dọc Dãy để xe học sinh phía Tây" },

  // --- CẦU THANG NỘI BỘ DÃY LỚP SAU (CHỈ DÙNG ĐỂ LÊN LẦU CỦA DÃY SAU) ---
  // Cầu Thang 1:
  { from: "node_back_g_c1", to: "node_back_stair1_t1", desc: "Bước lên Cầu Thang 1 lên Tầng 1" },
  { from: "node_back_stair1_t1", to: "node_back_stair1_t2", desc: "Tiếp tục lên Tầng 2 bằng Cầu Thang 1" },
  { from: "node_back_stair1_t2", to: "node_back_stair1_t3", desc: "Tiếp tục lên Tầng 3 bằng Cầu Thang 1" },

  // Cầu Thang 2:
  { from: "node_back_g_c2", to: "node_back_stair2_t1", desc: "Bước lên Cầu Thang 2 lên Tầng 1" },
  { from: "node_back_stair2_t1", to: "node_back_stair2_t2", desc: "Tiếp tục lên Tầng 2 bằng Cầu Thang 2" },
  { from: "node_back_stair2_t2", to: "node_back_stair2_t3", desc: "Tiếp tục lên Tầng 3 bằng Cầu Thang 2" },

  // --- TỪ SÂN TRƯỜNG VÀO DÃY LỚP TRƯỚC (TẦNG TRỆT) ---
  { from: "node_courtyard_mid", to: "node_front_g_entry", desc: "Rẽ vào sảnh Tầng trệt Dãy Lớp Trước" },
  { from: "node_front_g_entry", to: "node_front_g_rooms_right", desc: "Đi qua phòng P.01, P.03 Tầng trệt" },
  { from: "node_front_g_rooms_right", to: "node_front_g_stair", desc: "Đến Chân Cầu Thang giữa Dãy Trước" },
  { from: "node_front_g_stair", to: "node_front_g_rooms_left", desc: "Đi tiếp hành lang Tầng trệt qua phòng P.01, P.02" },
  { from: "node_front_g_rooms_left", to: "node_front_g_wc", desc: "Đến khu WC Tầng trệt Dãy Trước" },

  // Cầu thang nội bộ Dãy Lớp Trước (CHỈ DÙNG ĐỂ LÊN LẦU DÃY TRƯỚC)
  { from: "node_front_g_stair", to: "node_front_stair_t1", desc: "Đi Cầu Thang giữa lên Tầng 1" },
  { from: "node_front_stair_t1", to: "node_front_stair_t2", desc: "Tiếp tục lên Tầng 2 Dãy Trước" },
  { from: "node_front_stair_t2", to: "node_front_stair_t3", desc: "Tiếp tục lên Tầng 3 Dãy Trước" },

  // --- DÃY HÀNH CHÍNH & PHÒNG HỘI ĐỒNG ---
  { from: "node_flagpole", to: "node_admin_g_entry", desc: "Rẽ sang Dãy Hành chính" },
  { from: "node_admin_g_entry", to: "node_admin_g_corridor", desc: "Vào các văn phòng Hành chính Tầng trệt" },
  { from: "node_admin_g_corridor", to: "node_admin_g_stair", desc: "Đến Chân Cầu Thang Dãy Hành chính" },
  { from: "node_admin_g_stair", to: "node_admin_stair_t1", desc: "Lên Tầng 1 Dãy Hành chính (Phòng Hội Đồng)" },

  // --- KHỐI CHỨC NĂNG, THIẾT BỊ & HỘI TRƯỜNG ---
  { from: "node_flagpole", to: "node_hall_g_entry", desc: "Rẽ vào cửa Hội Trường Lớn (Tầng trệt)" },
  { from: "node_courtyard_mid", to: "node_func_g_yte", desc: "Rẽ vào Phòng Y Tế (+) (Tầng trệt)" },
  { from: "node_func_g_yte", to: "node_func_g_lab", desc: "Đi sang Phòng Thí Nghiệm (Kế bên phòng Y tế)" },
  { from: "node_func_g_yte", to: "node_func_g_stair", desc: "Đến Chân Cầu Thang Khối Chức Năng" },

  // Cầu thang nội bộ Khối chức năng (CHỈ DÙNG ĐỂ LÊN LẦU TIN HỌC / THIẾT BỊ)
  { from: "node_func_g_stair", to: "node_func_stair_t1", desc: "Đi Cầu Thang lên Tầng 1 (Phòng Tin Học 1, 2 & VP Đoàn)" },
  { from: "node_func_stair_t1", to: "node_func_stair_t2", desc: "Tiếp tục lên Tầng 2 (Dãy Nhà Thiết Bị)" },

  // --- KHU VỰC NHÀ XE & SÂN THỂ THAO ---
  { from: "node_main_split", to: "node_bike_front_entry", desc: "Rẽ phải theo lối vào nhà xe học sinh" },
  { from: "node_bike_front_entry", to: "node_bike_front", desc: "Đi thẳng vào Nhà xe học sinh gần cổng trước" },
  { from: "node_main_split", to: "node_bike_gv_entry", desc: "Rẽ trái theo lối đi nhà xe giáo viên" },
  { from: "node_bike_gv_entry", to: "node_bike_gv", desc: "Đi thẳng vào Nhà xe Giáo Viên" },

  // Sân bóng & Xe phía Đông
  { from: "node_courtyard_mid", to: "node_east_walk_soccer", desc: "Đi theo lối hành lang sang khu thể thao phía Đông" },
  { from: "node_east_walk_soccer", to: "node_east_turn_soccer", desc: "Đi thẳng đến lối vào Sân Bóng" },
  { from: "node_east_turn_soccer", to: "node_soccer_entrance", desc: "Đi vào Sân Bóng Đá" },
  { from: "node_east_turn_soccer", to: "node_bike_east", desc: "Đi vào Khu vực gửi xe học sinh phía Đông" },
  { from: "node_bike_east", to: "node_metal_roof", desc: "Đi tiếp đến khu Nhà Lợp Tôn" }
];

// Xuất các biến toàn cục cho các module JS
window.CAMPUS_LOCATIONS = CAMPUS_LOCATIONS;
window.CAMPUS_GRAPH_NODES = CAMPUS_GRAPH_NODES;
window.CAMPUS_GRAPH_EDGES = CAMPUS_GRAPH_EDGES;
