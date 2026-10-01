/**
 * data.js - Dữ liệu Vị trí, Tọa độ & Mạng lưới Lối đi Khuôn viên Trường học
 * SƠ ĐỒ PHÒNG HỌC 3 KHỐI & VỊ TRÍ ĐỂ XE NĂM HỌC 2026 - 2027
 * Hệ tọa độ chuẩn: viewBox="0 0 1600 1120"
 * Kết hợp phong cách đồ họa Hình 1, kiến trúc phòng học Hình 2 và vị trí để xe Hình 3.
 */

// ============================================================================
// 1. DANH SÁCH TẤT CẢ VỊ TRÍ (CAMPUS_LOCATIONS)
// ============================================================================
const CAMPUS_LOCATIONS = [
  // --- KHU VỰC CỔNG & TRUNG TÂM SÂN ---
  {
    id: "cong_truong",
    name: "Cổng Trường",
    category: "gate",
    building: "Khu vực Cổng",
    floor: "Mặt đất",
    x: 684,
    y: 988,
    node: "node_cong_truong",
    keywords: ["cổng", "cổng chính", "cổng trường", "vào", "ra"],
    description: "Cổng chính ra vào trường học"
  },
  {
    id: "cot_co",
    name: "Cột Cờ (Sân trường)",
    category: "landmark",
    building: "Sân trường",
    floor: "Mặt đất",
    x: 740,
    y: 785,
    node: "node_cot_co",
    keywords: ["cột cờ", "sân cờ", "chào cờ", "sân trường"],
    description: "Khu vực Cột Cờ trung tâm sân trường"
  },
  {
    id: "canopy_triangle",
    name: "Mái Tam Giác",
    category: "landmark",
    building: "Sân trường",
    floor: "Mặt đất",
    x: 740,
    y: 635,
    node: "node_mai_tam_giac",
    keywords: ["mái tam giác", "sảnh tam giác"],
    description: "Công trình kiến trúc Mái Tam Giác giữa sân trường"
  },
  {
    id: "nha_xe_gv",
    name: "Nhà xe giáo viên",
    category: "facility",
    building: "Khu vực Cổng",
    floor: "Mặt đất",
    x: 169,
    y: 889,
    node: "node_nha_xe_gv",
    keywords: ["nhà xe gv", "xe giáo viên", "bãi xe gv"],
    description: "Khu vực để xe dành riêng cho giáo viên (góc dưới bên trái)"
  },
  {
    id: "hoi_truong",
    name: "Hội Trường",
    category: "facility",
    building: "Hội Trường",
    floor: "Tầng trệt",
    x: 1080,
    y: 773,
    node: "node_hoi_truong",
    keywords: ["hội trường", "nhà đa năng", "sự kiện", "lễ"],
    description: "Hội trường lớn của trường (phía trước bên phải)"
  },
  {
    id: "wc_hoi_truong",
    name: "WC Hội Trường",
    category: "facility",
    building: "Hội Trường",
    floor: "Tầng trệt",
    x: 1183,
    y: 721,
    node: "node_wc_hoi_truong",
    keywords: ["wc", "nhà vệ sinh", "wc hội trường"],
    description: "Nhà vệ sinh cạnh Hội Trường"
  },

  // --- DÃY HÀNH CHÍNH (HIỆU BỘ) ---
  // Tầng 2
  {
    id: "phong_hieu_truong",
    name: "Phòng Hiệu trưởng",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng 2",
    x: 251,
    y: 697,
    node: "node_hc_t2_ht",
    keywords: ["hiệu trưởng", "ht", "thầy hiệu trưởng"],
    description: "Phòng làm việc Hiệu trưởng (Tầng 2 Dãy Hành Chính)"
  },
  {
    id: "phong_van_thu",
    name: "Phòng Văn thư",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng 2",
    x: 313,
    y: 697,
    node: "node_hc_t2_vt",
    keywords: ["văn thư", "công văn", "dấu"],
    description: "Phòng Văn thư tiếp nhận công văn (Tầng 2 Dãy Hành Chính)"
  },
  {
    id: "phong_ke_toan",
    name: "Phòng Kế toán",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng 2",
    x: 417,
    y: 697,
    node: "node_hc_t2_kt",
    keywords: ["kế toán", "học phí", "tài vụ"],
    description: "Phòng Kế toán tài chính (Tầng 2 Dãy Hành Chính)"
  },
  {
    id: "phong_chi_bo",
    name: "Phòng Chi bộ (phòng họp GV)",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng 2",
    x: 507,
    y: 697,
    node: "node_hc_t2_cb",
    keywords: ["chi bộ", "phòng họp gv", "hội đồng"],
    description: "Phòng sinh hoạt Chi bộ và hội họp giáo viên (Tầng 2 Dãy Hành Chính)"
  },
  {
    id: "wc_hc_t2",
    name: "WC Dãy Hành Chính (T2)",
    category: "facility",
    building: "Dãy Hành Chính",
    floor: "Tầng 2",
    x: 201,
    y: 697,
    node: "node_hc_t2_wc",
    keywords: ["wc", "nhà vệ sinh"],
    description: "Nhà vệ sinh Tầng 2 Dãy Hành Chính"
  },
  // Tầng trệt HC
  {
    id: "phong_ho_so_1",
    name: "Phòng hồ sơ 1",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng trệt",
    x: 251,
    y: 739,
    node: "node_hc_tret_p1",
    keywords: ["hồ sơ", "lưu trữ"],
    description: "Phòng lưu trữ hồ sơ 1 (Tầng trệt Dãy Hành Chính)"
  },
  {
    id: "phong_ho_so_2",
    name: "Phòng hồ sơ 2",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng trệt",
    x: 313,
    y: 739,
    node: "node_hc_tret_p2",
    keywords: ["hồ sơ", "học bạ"],
    description: "Phòng lưu trữ hồ sơ 2 (Tầng trệt Dãy Hành Chính)"
  },
  {
    id: "phong_pho_ht",
    name: "Phòng Phó Hiệu Trưởng",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng trệt",
    x: 417,
    y: 739,
    node: "node_hc_tret_pht",
    keywords: ["phó hiệu trưởng", "phó ht"],
    description: "Phòng làm việc Phó Hiệu trưởng (Tầng trệt Dãy Hành Chính)"
  },
  {
    id: "phong_truyen_thong",
    name: "Phòng Truyền thống",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng trệt",
    x: 478,
    y: 739,
    node: "node_hc_tret_tt",
    keywords: ["truyền thống", "lịch sử"],
    description: "Phòng truyền thống trường học (Tầng trệt Dãy Hành Chính)"
  },
  {
    id: "phong_tiep_dan",
    name: "Phòng Tiếp dân",
    category: "admin",
    building: "Dãy Hành Chính",
    floor: "Tầng trệt",
    x: 537,
    y: 739,
    node: "node_hc_tret_td",
    keywords: ["tiếp dân", "phụ huynh"],
    description: "Phòng tiếp đón phụ huynh và khách (Tầng trệt Dãy Hành Chính)"
  },
  {
    id: "wc_hc_tret",
    name: "WC Dãy Hành Chính (Trệt)",
    category: "facility",
    building: "Dãy Hành Chính",
    floor: "Tầng trệt",
    x: 201,
    y: 739,
    node: "node_hc_tret_wc",
    keywords: ["wc", "nhà vệ sinh"],
    description: "Nhà vệ sinh Tầng trệt Dãy Hành Chính"
  },
  {
    id: "cau_thang_hc",
    name: "Cầu thang Hành chính",
    category: "stair",
    building: "Dãy Hành Chính",
    floor: "Cầu thang",
    x: 267,
    y: 768,
    node: "node_hc_stair",
    keywords: ["cầu thang hành chính", "thang bộ"],
    description: "Cầu thang bộ kết nối Trệt và Tầng 2 Dãy Hành Chính"
  },

  // --- DÃY B (KHỐI 12 - GIỮA BÊN TRÁI: 4 TẦNG) ---
  // Tầng 4
  { id: "wc_b_t4", name: "WC Dãy B (T4)", category: "facility", building: "Dãy B (Khối 12)", floor: "Tầng 4", x: 243, y: 500, node: "node_b_t4_wc", keywords: ["wc"] },
  // Tầng 3
  { id: "b_t3_12a1", name: "Phòng 12A1", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng 3", x: 294, y: 538, node: "node_b_t3_12a1", keywords: ["12a1"] },
  { id: "b_t3_12a2", name: "Phòng 12A2", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng 3", x: 354, y: 538, node: "node_b_t3_12a2", keywords: ["12a2"] },
  { id: "b_t3_10a10", name: "Phòng 10A10", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng 3", x: 464, y: 538, node: "node_b_t3_10a10", keywords: ["10a10"] },
  { id: "b_t3_10a9", name: "Phòng 10A9", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng 3", x: 524, y: 538, node: "node_b_t3_10a9", keywords: ["10a9"] },
  { id: "wc_b_t3", name: "WC Dãy B (T3)", category: "facility", building: "Dãy B (Khối 12)", floor: "Tầng 3", x: 243, y: 538, node: "node_b_t3_wc", keywords: ["wc"] },
  // Tầng 2
  { id: "b_t2_12a3", name: "Phòng 12A3", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng 2", x: 294, y: 576, node: "node_b_t2_12a3", keywords: ["12a3"] },
  { id: "b_t2_12a4", name: "Phòng 12A4", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng 2", x: 354, y: 576, node: "node_b_t2_12a4", keywords: ["12a4"] },
  { id: "b_t2_12a5", name: "Phòng 12A5", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng 2", x: 464, y: 576, node: "node_b_t2_12a5", keywords: ["12a5"] },
  { id: "b_t2_12a6", name: "Phòng 12A6", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng 2", x: 524, y: 576, node: "node_b_t2_12a6", keywords: ["12a6"] },
  { id: "wc_b_t2", name: "WC Dãy B (T2)", category: "facility", building: "Dãy B (Khối 12)", floor: "Tầng 2", x: 243, y: 576, node: "node_b_t2_wc", keywords: ["wc"] },
  // Tầng trệt
  { id: "b_tret_12a7", name: "Phòng 12A7", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng trệt", x: 294, y: 614, node: "node_b_tret_12a7", keywords: ["12a7"] },
  { id: "b_tret_12a8", name: "Phòng 12A8", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng trệt", x: 354, y: 614, node: "node_b_tret_12a8", keywords: ["12a8"] },
  { id: "b_tret_12a9", name: "Phòng 12A9", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng trệt", x: 464, y: 614, node: "node_b_tret_12a9", keywords: ["12a9"] },
  { id: "b_tret_12a10", name: "Phòng 12A10", category: "classroom", building: "Dãy B (Khối 12)", floor: "Tầng trệt", x: 524, y: 614, node: "node_b_tret_12a10", keywords: ["12a10"] },
  { id: "wc_b_tret", name: "WC Dãy B (Trệt)", category: "facility", building: "Dãy B (Khối 12)", floor: "Tầng trệt", x: 243, y: 614, node: "node_b_tret_wc", keywords: ["wc"] },
  { id: "cau_thang_b", name: "Cầu thang Dãy B", category: "stair", building: "Dãy B (Khối 12)", floor: "Cầu thang", x: 409, y: 557, node: "node_b_stair_tret", keywords: ["cầu thang b", "thang khối 12"] },

  // --- DÃY BỘ MÔN / PHÒNG CHỨC NĂNG (GIỮA BÊN PHẢI) ---
  // Tầng 4
  { id: "bm_t4_tin4", name: "Phòng Tin 4", category: "classroom", building: "Dãy Bộ Môn", floor: "Tầng 4", x: 1122, y: 500, node: "node_bm_t4_tin4", keywords: ["tin 4", "tin học"] },
  { id: "bm_t4_anh_van", name: "Phòng Anh văn", category: "classroom", building: "Dãy Bộ Môn", floor: "Tầng 4", x: 1192, y: 500, node: "node_bm_t4_av", keywords: ["anh văn", "ngoại ngữ"] },
  // Tầng 3
  { id: "bm_t3_may1", name: "Phòng Máy 1", category: "classroom", building: "Dãy Bộ Môn", floor: "Tầng 3", x: 1122, y: 538, node: "node_bm_t3_may1", keywords: ["phòng máy 1", "máy tính"] },
  { id: "bm_t3_may2", name: "Phòng Máy 2", category: "classroom", building: "Dãy Bộ Môn", floor: "Tầng 3", x: 1192, y: 538, node: "node_bm_t3_may2", keywords: ["phòng máy 2", "máy tính"] },
  // Tầng 2
  { id: "vp_doan", name: "VP Đoàn Thanh Niên", category: "admin", building: "Dãy Bộ Môn", floor: "Tầng 2", x: 1062, y: 576, node: "node_bm_t2_doan", keywords: ["đoàn", "vp đoàn"] },
  { id: "tin_hoc_1", name: "Phòng Tin 1", category: "classroom", building: "Dãy Bộ Môn", floor: "Tầng 2", x: 1122, y: 576, node: "node_bm_t2_tin1", keywords: ["tin 1"] },
  { id: "tin_hoc_2", name: "Phòng Tin 2", category: "classroom", building: "Dãy Bộ Môn", floor: "Tầng 2", x: 1192, y: 576, node: "node_bm_t2_tin2", keywords: ["tin 2"] },
  // Tầng trệt
  { id: "phong_y_te", name: "Phòng Y Tế", category: "facility", building: "Dãy Bộ Môn", floor: "Tầng trệt", x: 1002, y: 614, node: "node_bm_tret_yte", keywords: ["y tế", "sơ cứu", "thuốc"] },
  { id: "bm_tret_ly", name: "Phòng Thí nghiệm Lý", category: "classroom", building: "Dãy Bộ Môn", floor: "Tầng trệt", x: 1084, y: 614, node: "node_bm_tret_ly", keywords: ["lý", "vật lý", "thí nghiệm"] },
  { id: "bm_tret_hoa", name: "Phòng Thí nghiệm Hóa", category: "classroom", building: "Dãy Bộ Môn", floor: "Tầng trệt", x: 1184, y: 614, node: "node_bm_tret_hoa", keywords: ["hóa", "hóa học", "thí nghiệm"] },
  { id: "cau_thang_bm", name: "Cầu thang Dãy Bộ Môn", category: "stair", building: "Dãy Bộ Môn", floor: "Cầu thang", x: 942, y: 557, node: "node_bm_stair_tret", keywords: ["cầu thang bộ môn"] },

  // --- DÃY A (TRÊN CÙNG: KHỐI 10 & 11 & THƯ VIỆN) ---
  // Tầng 4
  { id: "a_t4_10a13", name: "Phòng 10A13", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 802, y: 80, node: "node_a_t4_10a13", keywords: ["10a13"] },
  { id: "a_t4_10a12", name: "Phòng 10A12", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 920, y: 80, node: "node_a_t4_10a12", keywords: ["10a12"] },
  { id: "a_t4_10a11", name: "Phòng 10A11", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 980, y: 80, node: "node_a_t4_10a11", keywords: ["10a11"] },
  { id: "wc_a_t4_left", name: "WC Dãy A Trái (T4)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 453, y: 80, node: "node_a_t4_wc_l", keywords: ["wc"] },
  { id: "wc_a_t4_right", name: "WC Dãy A Phải (T4)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 1031, y: 80, node: "node_a_t4_wc_r", keywords: ["wc"] },
  // Tầng 3
  { id: "a_t3_10a1", name: "Phòng 10A1", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 504, y: 118, node: "node_a_t3_10a1", keywords: ["10a1"] },
  { id: "a_t3_10a2", name: "Phòng 10A2", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 564, y: 118, node: "node_a_t3_10a2", keywords: ["10a2"] },
  { id: "a_t3_10a3", name: "Phòng 10A3", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 682, y: 118, node: "node_a_t3_10a3", keywords: ["10a3"] },
  { id: "a_t3_11a1", name: "Phòng 11A1", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 742, y: 118, node: "node_a_t3_11a1", keywords: ["11a1"] },
  { id: "a_t3_11a2", name: "Phòng 11A2", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 802, y: 118, node: "node_a_t3_11a2", keywords: ["11a2"] },
  { id: "a_t3_11a3", name: "Phòng 11A3", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 920, y: 118, node: "node_a_t3_11a3", keywords: ["11a3"] },
  { id: "a_t3_11a4", name: "Phòng 11A4", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 980, y: 118, node: "node_a_t3_11a4", keywords: ["11a4"] },
  { id: "wc_a_t3_left", name: "WC Dãy A Trái (T3)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 453, y: 118, node: "node_a_t3_wc_l", keywords: ["wc"] },
  { id: "wc_a_t3_right", name: "WC Dãy A Phải (T3)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 1031, y: 118, node: "node_a_t3_wc_r", keywords: ["wc"] },
  // Tầng 2
  { id: "a_t2_10a6", name: "Phòng 10A6", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 504, y: 156, node: "node_a_t2_10a6", keywords: ["10a6"] },
  { id: "a_t2_10a5", name: "Phòng 10A5", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 564, y: 156, node: "node_a_t2_10a5", keywords: ["10a5"] },
  { id: "a_t2_10a4", name: "Phòng 10A4", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 682, y: 156, node: "node_a_t2_10a4", keywords: ["10a4"] },
  { id: "a_t2_11a8", name: "Phòng 11A8", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 742, y: 156, node: "node_a_t2_11a8", keywords: ["11a8"] },
  { id: "a_t2_11a7", name: "Phòng 11A7", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 802, y: 156, node: "node_a_t2_11a7", keywords: ["11a7"] },
  { id: "a_t2_11a6", name: "Phòng 11A6", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 920, y: 156, node: "node_a_t2_11a6", keywords: ["11a6"] },
  { id: "a_t2_11a5", name: "Phòng 11A5", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 980, y: 156, node: "node_a_t2_11a5", keywords: ["11a5"] },
  { id: "wc_a_t2_left", name: "WC Dãy A Trái (T2)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 453, y: 156, node: "node_a_t2_wc_l", keywords: ["wc"] },
  { id: "wc_a_t2_right", name: "WC Dãy A Phải (T2)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 1031, y: 156, node: "node_a_t2_wc_r", keywords: ["wc"] },
  // Tầng trệt
  { id: "a_tret_10a7", name: "Phòng 10A7", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 504, y: 194, node: "node_a_tret_10a7", keywords: ["10a7"] },
  { id: "a_tret_10a8", name: "Phòng 10A8", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 564, y: 194, node: "node_a_tret_10a8", keywords: ["10a8"] },
  { id: "a_tret_thu_vien", name: "Thư Viện", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 742, y: 194, node: "node_a_tret_tv", keywords: ["thư viện", "sách", "đọc sách"] },
  { id: "a_tret_11a9", name: "Phòng 11A9", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 920, y: 194, node: "node_a_tret_11a9", keywords: ["11a9"] },
  { id: "a_tret_11a10", name: "Phòng 11A10", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 980, y: 194, node: "node_a_tret_11a10", keywords: ["11a10"] },
  { id: "wc_a_tret_left", name: "WC Dãy A Trái (Trệt)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 453, y: 194, node: "node_a_tret_wc_l", keywords: ["wc"] },
  { id: "wc_a_tret_right", name: "WC Dãy A Phải (Trệt)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 1031, y: 194, node: "node_a_tret_wc_r", keywords: ["wc"] },
  { id: "cau_thang_a1", name: "Cầu thang A1 (Trái)", category: "stair", building: "Dãy A (Trên cùng)", floor: "Cầu thang", x: 623, y: 137, node: "node_a1_stair_tret", keywords: ["cầu thang a1"] },
  { id: "cau_thang_a2", name: "Cầu thang A2 (Phải)", category: "stair", building: "Dãy A (Trên cùng)", floor: "Cầu thang", x: 861, y: 137, node: "node_a2_stair_tret", keywords: ["cầu thang a2"] },

  // =========================================================================
  // VỊ TRÍ ĐỂ XE CỦA CÁC LỚP (THEO ẢNH 3)
  // =========================================================================
  // Khối 10 (Nhà xe học sinh gần Cổng trước)
  { id: "park_10a13", name: "Vị trí để xe 10A13", category: "parking", building: "Khu vực Hội Trường", floor: "Mặt đất", x: 1057, y: 684, node: "node_pk_10a13", keywords: ["xe 10a13", "10a13"] },
  { id: "park_10a1", name: "Vị trí để xe 10A1", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 986, y: 918, node: "node_pk_10a1", keywords: ["xe 10a1", "nhà xe 10a1"] },
  { id: "park_10a2", name: "Vị trí để xe 10A2", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1030, y: 918, node: "node_pk_10a2", keywords: ["xe 10a2", "nhà xe 10a2"] },
  { id: "park_10a3", name: "Vị trí để xe 10A3", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1074, y: 918, node: "node_pk_10a3", keywords: ["xe 10a3", "nhà xe 10a3"] },
  { id: "park_10a4", name: "Vị trí để xe 10A4", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1117, y: 918, node: "node_pk_10a4", keywords: ["xe 10a4", "nhà xe 10a4"] },
  { id: "park_10a5", name: "Vị trí để xe 10A5", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1161, y: 918, node: "node_pk_10a5", keywords: ["xe 10a5", "nhà xe 10a5"] },
  { id: "park_10a6", name: "Vị trí để xe 10A6", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1205, y: 918, node: "node_pk_10a6", keywords: ["xe 10a6", "nhà xe 10a6"] },
  { id: "park_10a7", name: "Vị trí để xe 10A7", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1248, y: 918, node: "node_pk_10a7", keywords: ["xe 10a7", "nhà xe 10a7"] },
  { id: "park_10a8", name: "Vị trí để xe 10A8", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1292, y: 918, node: "node_pk_10a8", keywords: ["xe 10a8", "nhà xe 10a8"] },
  { id: "park_10a9", name: "Vị trí để xe 10A9", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1335, y: 918, node: "node_pk_10a9", keywords: ["xe 10a9", "nhà xe 10a9"] },
  { id: "park_10a10", name: "Vị trí để xe 10A10", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1379, y: 918, node: "node_pk_10a10", keywords: ["xe 10a10", "nhà xe 10a10"] },
  { id: "park_10a11", name: "Vị trí để xe 10A11", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1423, y: 918, node: "node_pk_10a11", keywords: ["xe 10a11", "nhà xe 10a11"] },
  { id: "park_10a12", name: "Vị trí để xe 10A12", category: "parking", building: "Khu vực Xe phía Đông", floor: "Mặt đất", x: 1497, y: 722, node: "node_pk_10a12", keywords: ["xe 10a12", "nhà xe 10a12"] },

  // Khối 11 (Nhà xe phía Đông & Nhà xe phía Bắc)
  { id: "park_11a1", name: "Vị trí để xe 11A1", category: "parking", building: "Khu vực Xe phía Đông", floor: "Mặt đất", x: 1497, y: 355, node: "node_pk_11a1", keywords: ["xe 11a1"] },
  { id: "park_11a2", name: "Vị trí để xe 11A2", category: "parking", building: "Khu vực Xe phía Đông", floor: "Mặt đất", x: 1497, y: 200, node: "node_pk_11a2", keywords: ["xe 11a2"] },
  { id: "park_11a3", name: "Vị trí để xe 11A3", category: "parking", building: "Dãy xe Nhà lớp tôn", floor: "Mặt đất", x: 1283, y: 126, node: "node_pk_11a3", keywords: ["xe 11a3"] },
  { id: "park_11a5", name: "Vị trí để xe 11A5", category: "parking", building: "Dãy xe Nhà lớp tôn", floor: "Mặt đất", x: 1048, y: 126, node: "node_pk_11a5", keywords: ["xe 11a5"] },
  { id: "park_11a6", name: "Vị trí để xe 11A6", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 839, y: 148, node: "node_pk_11a6", keywords: ["xe 11a6"] },
  { id: "park_11a7", name: "Vị trí để xe 11A7", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 753, y: 148, node: "node_pk_11a7", keywords: ["xe 11a7"] },
  { id: "park_11a8", name: "Vị trí để xe 11A8", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 667, y: 148, node: "node_pk_11a8", keywords: ["xe 11a8"] },

  // Khối 12 (Dãy xe Cổng sau & Dãy xe phía Tây)
  { id: "park_12a1", name: "Vị trí để xe 12A1", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 581, y: 148, node: "node_pk_12a1", keywords: ["xe 12a1"] },
  { id: "park_12a2", name: "Vị trí để xe 12A2", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 495, y: 148, node: "node_pk_12a2", keywords: ["xe 12a2"] },
  { id: "park_12a3", name: "Vị trí để xe 12A3", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 409, y: 129, node: "node_pk_12a3", keywords: ["xe 12a3"] },
  { id: "park_12a4", name: "Vị trí để xe 12A4", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 323, y: 129, node: "node_pk_12a4", keywords: ["xe 12a4"] },
  { id: "park_12a5", name: "Vị trí để xe 12A5", category: "parking", building: "Nhà xe gần Cổng sau", floor: "Mặt đất", x: 117, y: 110, node: "node_pk_12a5", keywords: ["xe 12a5"] },
  { id: "park_12a6", name: "Vị trí để xe 12A6", category: "parking", building: "Nhà xe gần Cổng sau", floor: "Mặt đất", x: 117, y: 127, node: "node_pk_12a6", keywords: ["xe 12a6"] },
  { id: "park_12a7", name: "Vị trí để xe 12A7", category: "parking", building: "Nhà xe gần Cổng sau", floor: "Mặt đất", x: 117, y: 144, node: "node_pk_12a7", keywords: ["xe 12a7"] },
  { id: "park_12a8", name: "Vị trí để xe 12A8", category: "parking", building: "Nhà xe gần Cổng sau", floor: "Mặt đất", x: 117, y: 161, node: "node_pk_12a8", keywords: ["xe 12a8"] },
  { id: "park_12a9", name: "Vị trí để xe 12A9", category: "parking", building: "Dãy để xe học sinh phía Tây", floor: "Mặt đất", x: 65, y: 372, node: "node_pk_12a9", keywords: ["xe 12a9"] },
  { id: "park_12a10", name: "Vị trí để xe 12A10", category: "parking", building: "Dãy để xe học sinh phía Tây", floor: "Mặt đất", x: 65, y: 617, node: "node_pk_12a10", keywords: ["xe 12a10"] }
];

// ============================================================================
// 2. NÚT ĐỒ THỊ LỐI ĐI CHUẨN XÁC 100% VUÔNG GÓC 90° (CAMPUS_GRAPH_NODES)
// Mọi cung nối đều song song 100% với trục X hoặc trục Y (không cắt chéo xiên vẹo)
// ============================================================================
const CAMPUS_GRAPH_NODES = {
  // Trục Cổng & Trục sân chính (X = 684 và X = 755)
  "node_cong_truong": { x: 684, y: 988, name: "Cổng Trường", floor: "Mặt đất" },
  "node_nga_re_cong": { x: 684, y: 918, name: "Ngã giao đường xe trước Cổng", floor: "Mặt đất" },
  "node_san_cong_truoc": { x: 684, y: 777, name: "Ngã giao sân trước Dãy Hành chính", floor: "Mặt đất" },

  // Trục sân giữa Cột Cờ & Mái Tam Giác (Trục dọc X = 755)
  "node_truc_san_giua": { x: 755, y: 777, name: "Lối giao sân trước Cột Cờ", floor: "Mặt đất" },
  "node_cot_co": { x: 755, y: 720, name: "Khu vực Cột Cờ", floor: "Mặt đất" },
  "node_mai_tam_giac": { x: 755, y: 612, name: "Trước Mái Tam Giác", floor: "Mặt đất" },
  "node_truc_san_bac": { x: 755, y: 378, name: "Lối giao sân phía Bắc (trước Dãy A)", floor: "Mặt đất" },

  // Trục Hội Trường (Trục ngang Y = 777)
  "node_loi_hoi_truong": { x: 927, y: 777, name: "Cửa chính Hội Trường", floor: "Tầng trệt" },
  "node_hoi_truong": { x: 1080, y: 777, name: "Trong Hội Trường", floor: "Tầng trệt" },
  "node_wc_hoi_truong_corner": { x: 1183, y: 777, name: "Lối rẽ vào WC Hội Trường", floor: "Tầng trệt" },
  "node_wc_hoi_truong": { x: 1183, y: 721, name: "WC Hội Trường", floor: "Tầng trệt" },

  // Trục Nhà xe Cổng trước (Trục ngang Y = 918)
  "node_nga_xe_gv": { x: 169, y: 918, name: "Trước Nhà xe giáo viên", floor: "Mặt đất" },
  "node_nha_xe_gv": { x: 169, y: 889, name: "Trong Nhà xe GV", floor: "Mặt đất" },
  "node_truoc_xe_hs": { x: 965, y: 918, name: "Lối vào Nhà xe học sinh Cổng trước", floor: "Mặt đất" },
  "node_pk_10a1": { x: 986, y: 918, name: "Ô xe 10A1", floor: "Mặt đất" },
  "node_pk_10a2": { x: 1030, y: 918, name: "Ô xe 10A2", floor: "Mặt đất" },
  "node_pk_10a3": { x: 1074, y: 918, name: "Ô xe 10A3", floor: "Mặt đất" },
  "node_pk_10a4": { x: 1117, y: 918, name: "Ô xe 10A4", floor: "Mặt đất" },
  "node_pk_10a5": { x: 1161, y: 918, name: "Ô xe 10A5", floor: "Mặt đất" },
  "node_pk_10a6": { x: 1205, y: 918, name: "Ô xe 10A6", floor: "Mặt đất" },
  "node_pk_10a7": { x: 1248, y: 918, name: "Ô xe 10A7", floor: "Mặt đất" },
  "node_pk_10a8": { x: 1292, y: 918, name: "Ô xe 10A8", floor: "Mặt đất" },
  "node_pk_10a9": { x: 1335, y: 918, name: "Ô xe 10A9", floor: "Mặt đất" },
  "node_pk_10a10": { x: 1379, y: 918, name: "Ô xe 10A10", floor: "Mặt đất" },
  "node_pk_10a11": { x: 1423, y: 918, name: "Ô xe 10A11", floor: "Mặt đất" },
  "node_goc_xe_dong": { x: 1497, y: 918, name: "Góc cua nhà xe phía Đông", floor: "Mặt đất" },
  "node_pk_10a12": { x: 1497, y: 722, name: "Ô xe 10A12", floor: "Mặt đất" },
  "node_pk_11a1": { x: 1497, y: 355, name: "Ô xe 11A1", floor: "Mặt đất" },
  "node_pk_11a2": { x: 1497, y: 200, name: "Ô xe 11A2", floor: "Mặt đất" },

  // Dãy để xe Tây & Bắc (Trục dọc X = 65, X = 112 và Trục ngang Y = 186, Y = 835)
  "node_goc_xe_tay_nam_1": { x: 112, y: 918, name: "Khúc rẽ Nhà xe Tây Nam", floor: "Mặt đất" },
  "node_goc_xe_tay_nam": { x: 112, y: 835, name: "Góc cua nhà xe phía Tây Nam", floor: "Mặt đất" },
  "node_goc_xe_tay_bac_1": { x: 65, y: 835, name: "Khúc cua nhà xe phía Tây", floor: "Mặt đất" },
  "node_pk_12a10": { x: 65, y: 617, name: "Ô xe 12A10", floor: "Mặt đất" },
  "node_pk_12a9": { x: 65, y: 372, name: "Ô xe 12A9", floor: "Mặt đất" },
  "node_goc_xe_tay_bac": { x: 65, y: 186, name: "Góc cua nhà xe phía Tây Bắc", floor: "Mặt đất" },
  "node_khuc_cua_tb": { x: 118, y: 186, name: "Khúc cua Cổng sau", floor: "Mặt đất" },
  "node_pk_12a5": { x: 117, y: 110, name: "Ô xe 12A5", floor: "Mặt đất" },
  "node_pk_12a6": { x: 117, y: 127, name: "Ô xe 12A6", floor: "Mặt đất" },
  "node_pk_12a7": { x: 117, y: 144, name: "Ô xe 12A7", floor: "Mặt đất" },
  "node_pk_12a8": { x: 117, y: 161, name: "Ô xe 12A8", floor: "Mặt đất" },
  "node_pk_12a4": { x: 323, y: 186, name: "Ô xe 12A4", floor: "Mặt đất" },
  "node_pk_12a3": { x: 409, y: 186, name: "Ô xe 12A3", floor: "Mặt đất" },
  "node_pk_12a2": { x: 495, y: 186, name: "Ô xe 12A2", floor: "Mặt đất" },
  "node_pk_12a1": { x: 581, y: 186, name: "Ô xe 12A1", floor: "Mặt đất" },
  "node_pk_11a8": { x: 667, y: 186, name: "Ô xe 11A8", floor: "Mặt đất" },
  "node_pk_11a7": { x: 753, y: 186, name: "Ô xe 11A7", floor: "Mặt đất" },
  "node_pk_11a6": { x: 839, y: 186, name: "Ô xe 11A6", floor: "Mặt đất" },
  "node_pk_11a5": { x: 1041, y: 186, name: "Ô xe 11A5", floor: "Mặt đất" },
  "node_pk_11a3": { x: 1246, y: 186, name: "Ô xe 11A3", floor: "Mặt đất" },
  "node_khuc_cua_db": { x: 1410, y: 186, name: "Khúc cua phía Đông Bắc", floor: "Mặt đất" },
  "node_pk_10a13": { x: 1057, y: 684, name: "Vị trí để xe 10A13", floor: "Mặt đất" },

  // --- DÃY HÀNH CHÍNH (HIỆU BỘ) ---
  // Tầng trệt (Trục ngang Y = 777)
  "node_loi_vao_hc": { x: 595, y: 777, name: "Lối vào Dãy Hành Chính", floor: "Tầng trệt" },
  "node_hc_tret_td": { x: 537, y: 777, name: "Phòng Tiếp dân", floor: "Tầng trệt" },
  "node_hc_tret_tt": { x: 478, y: 777, name: "Phòng Truyền thống", floor: "Tầng trệt" },
  "node_hc_tret_pht": { x: 417, y: 777, name: "Phòng Phó HT", floor: "Tầng trệt" },
  "node_hc_stair_tret": { x: 365, y: 777, name: "Chân Cầu thang HC", floor: "Tầng trệt" },
  "node_hc_tret_p2": { x: 313, y: 777, name: "Phòng hồ sơ 2", floor: "Tầng trệt" },
  "node_hc_tret_p1": { x: 251, y: 777, name: "Phòng hồ sơ 1", floor: "Tầng trệt" },
  "node_hc_tret_wc": { x: 201, y: 777, name: "WC Hành chính Trệt", floor: "Tầng trệt" },

  // Cầu thang Hành chính (Trục dọc X = 365)
  "node_hc_stair": { x: 365, y: 737, name: "Cầu thang Hành chính", floor: "Cầu thang" },
  "node_hc_stair_t2": { x: 365, y: 697, name: "Đỉnh Cầu thang HC (T2)", floor: "Tầng 2" },

  // Tầng 2 Hành chính (Trục ngang Y = 697)
  "node_hc_t2_cb": { x: 507, y: 697, name: "Phòng Chi bộ", floor: "Tầng 2" },
  "node_hc_t2_kt": { x: 417, y: 697, name: "Phòng Kế toán", floor: "Tầng 2" },
  "node_hc_t2_vt": { x: 313, y: 697, name: "Phòng Văn thư", floor: "Tầng 2" },
  "node_hc_t2_ht": { x: 251, y: 697, name: "Phòng Hiệu trưởng", floor: "Tầng 2" },
  "node_hc_t2_wc": { x: 201, y: 697, name: "WC Hành chính T2", floor: "Tầng 2" },
  "node_cau_noi_hc_b": { x: 595, y: 697, name: "Cầu hành lang nối Dãy B & HC", floor: "Tầng 2" },

  // --- DÃY B (KHỐI 12) ---
  // Tầng trệt (Trục ngang Y = 612)
  "node_b_tret_wc": { x: 243, y: 612, name: "WC Dãy B (Trệt)", floor: "Tầng trệt" },
  "node_b_tret_12a7": { x: 294, y: 612, name: "Phòng 12A7", floor: "Tầng trệt" },
  "node_b_tret_12a8": { x: 354, y: 612, name: "Phòng 12A8", floor: "Tầng trệt" },
  "node_b_stair_tret": { x: 409, y: 612, name: "Chân Cầu thang B (Trệt)", floor: "Tầng trệt" },
  "node_b_tret_12a9": { x: 464, y: 612, name: "Phòng 12A9", floor: "Tầng trệt" },
  "node_b_tret_12a10": { x: 524, y: 612, name: "Phòng 12A10", floor: "Tầng trệt" },
  "node_b_tret_east": { x: 595, y: 612, name: "Hành lang Dãy B (Đông)", floor: "Tầng trệt" },

  // Cầu thang Dãy B (Trục dọc X = 409)
  "node_b_stair_t2": { x: 409, y: 576, name: "Cầu thang B (T2)", floor: "Tầng 2" },
  "node_b_stair_t3": { x: 409, y: 538, name: "Cầu thang B (T3)", floor: "Tầng 3" },
  "node_b_stair_t4": { x: 409, y: 500, name: "Cầu thang B (T4)", floor: "Tầng 4" },

  // Tầng 2 Dãy B (Trục ngang Y = 576)
  "node_b_t2_wc": { x: 243, y: 576, name: "WC Dãy B (T2)", floor: "Tầng 2" },
  "node_b_t2_12a3": { x: 294, y: 576, name: "Phòng 12A3", floor: "Tầng 2" },
  "node_b_t2_12a4": { x: 354, y: 576, name: "Phòng 12A4", floor: "Tầng 2" },
  "node_b_t2_12a5": { x: 464, y: 576, name: "Phòng 12A5", floor: "Tầng 2" },
  "node_b_t2_12a6": { x: 524, y: 576, name: "Phòng 12A6", floor: "Tầng 2" },
  "node_b_t2_east": { x: 595, y: 576, name: "Hành lang Tầng 2 Dãy B", floor: "Tầng 2" },

  // Tầng 3 Dãy B (Trục ngang Y = 538)
  "node_b_t3_wc": { x: 243, y: 538, name: "WC Dãy B (T3)", floor: "Tầng 3" },
  "node_b_t3_12a1": { x: 294, y: 538, name: "Phòng 12A1", floor: "Tầng 3" },
  "node_b_t3_12a2": { x: 354, y: 538, name: "Phòng 12A2", floor: "Tầng 3" },
  "node_b_t3_10a10": { x: 464, y: 538, name: "Phòng 10A10", floor: "Tầng 3" },
  "node_b_t3_10a9": { x: 524, y: 538, name: "Phòng 10A9", floor: "Tầng 3" },

  // Tầng 4 Dãy B (Trục ngang Y = 500)
  "node_b_t4_wc": { x: 243, y: 500, name: "WC Dãy B (T4)", floor: "Tầng 4" },

  // Hành lang nối Dãy B sang Dãy A (Trục dọc X = 429)
  "node_noi_ba_south": { x: 429, y: 612, name: "Hành lang Tây Dãy B", floor: "Tầng trệt" },
  "node_noi_ba_north": { x: 429, y: 378, name: "Hành lang Tây Dãy A", floor: "Tầng trệt" },

  // --- DÃY BỘ MÔN (GIỮA BÊN PHẢI) ---
  // Tầng trệt (Trục ngang Y = 612)
  "node_bm_stair_tret": { x: 942, y: 612, name: "Chân Cầu thang Bộ Môn", floor: "Tầng trệt" },
  "node_bm_tret_yte": { x: 1002, y: 612, name: "Phòng Y Tế", floor: "Tầng trệt" },
  "node_bm_tret_ly": { x: 1084, y: 612, name: "Phòng Thí nghiệm Lý", floor: "Tầng trệt" },
  "node_bm_tret_hoa": { x: 1184, y: 612, name: "Phòng Thí nghiệm Hóa", floor: "Tầng trệt" },

  // Cầu thang Bộ Môn (Trục dọc X = 942)
  "node_bm_stair_t2": { x: 942, y: 576, name: "Cầu thang Bộ Môn (T2)", floor: "Tầng 2" },
  "node_bm_stair_t3": { x: 942, y: 538, name: "Cầu thang Bộ Môn (T3)", floor: "Tầng 3" },
  "node_bm_stair_t4": { x: 942, y: 500, name: "Cầu thang Bộ Môn (T4)", floor: "Tầng 4" },

  // Tầng 2 Bộ Môn (Trục ngang Y = 576)
  "node_bm_t2_doan": { x: 1062, y: 576, name: "VP Đoàn Thanh Niên", floor: "Tầng 2" },
  "node_bm_t2_tin1": { x: 1122, y: 576, name: "Phòng Tin 1", floor: "Tầng 2" },
  "node_bm_t2_tin2": { x: 1192, y: 576, name: "Phòng Tin 2", floor: "Tầng 2" },

  // Tầng 3 Bộ Môn (Trục ngang Y = 538)
  "node_bm_t3_may1": { x: 1122, y: 538, name: "Phòng Máy 1", floor: "Tầng 3" },
  "node_bm_t3_may2": { x: 1192, y: 538, name: "Phòng Máy 2", floor: "Tầng 3" },

  // Tầng 4 Bộ Môn (Trục ngang Y = 500)
  "node_bm_t4_tin4": { x: 1122, y: 500, name: "Phòng Tin 4", floor: "Tầng 4" },
  "node_bm_t4_av": { x: 1192, y: 500, name: "Phòng Anh văn", floor: "Tầng 4" },

  // --- DÃY A (TRÊN CÙNG: KHỐI 10 & 11 & THƯ VIỆN) ---
  // Tầng trệt (Trục ngang Y = 378)
  "node_a_tret_wc_l": { x: 255, y: 378, name: "WC Dãy A Trái (Trệt)", floor: "Tầng trệt" },
  "node_a_tret_10a7": { x: 306, y: 378, name: "Phòng 10A7", floor: "Tầng trệt" },
  "node_a_tret_10a8": { x: 367, y: 378, name: "Phòng 10A8", floor: "Tầng trệt" },
  "node_a_tret_tv": { x: 554, y: 378, name: "Thư Viện trường", floor: "Tầng trệt" },
  "node_a1_stair_tret": { x: 623, y: 378, name: "Chân Cầu thang A1 (Trệt)", floor: "Tầng trệt" },
  "node_a_tret_11a9": { x: 742, y: 378, name: "Phòng 11A9", floor: "Tầng trệt" },
  "node_a_tret_11a10": { x: 803, y: 378, name: "Phòng 11A10", floor: "Tầng trệt" },
  "node_a2_stair_tret": { x: 861, y: 378, name: "Chân Cầu thang A2 (Trệt)", floor: "Tầng trệt" },
  "node_a_tret_wc_r": { x: 910, y: 378, name: "WC Dãy A Phải (Trệt)", floor: "Tầng trệt" },

  // Cầu thang A1 (Trục dọc X = 623)
  "node_a1_stair_t2": { x: 623, y: 304, name: "Cầu thang A1 (T2)", floor: "Tầng 2" },
  "node_a1_stair_t3": { x: 623, y: 260, name: "Cầu thang A1 (T3)", floor: "Tầng 3" },
  "node_a1_stair_t4": { x: 623, y: 216, name: "Đỉnh Cầu thang A1 (T4)", floor: "Tầng 4" },

  // Cầu thang A2 (Trục dọc X = 861)
  "node_a2_stair_t2": { x: 861, y: 304, name: "Cầu thang A2 (T2)", floor: "Tầng 2" },
  "node_a2_stair_t3": { x: 861, y: 260, name: "Cầu thang A2 (T3)", floor: "Tầng 3" },
  "node_a2_stair_t4": { x: 861, y: 216, name: "Đỉnh Cầu thang A2 (T4)", floor: "Tầng 4" },

  // Tầng 2 Dãy A (Trục ngang Y = 304)
  "node_a_t2_wc_l": { x: 255, y: 304, name: "WC Dãy A Trái (T2)", floor: "Tầng 2" },
  "node_a_t2_10a6": { x: 306, y: 304, name: "Phòng 10A6", floor: "Tầng 2" },
  "node_a_t2_10a5": { x: 367, y: 304, name: "Phòng 10A5", floor: "Tầng 2" },
  "node_a_t2_10a4": { x: 491, y: 304, name: "Phòng 10A4", floor: "Tầng 2" },
  "node_a_t2_11a8": { x: 552, y: 304, name: "Phòng 11A8", floor: "Tầng 2" },
  "node_a_t2_11a7": { x: 615, y: 304, name: "Phòng 11A7", floor: "Tầng 2" },
  "node_a_t2_11a6": { x: 742, y: 304, name: "Phòng 11A6", floor: "Tầng 2" },
  "node_a_t2_11a5": { x: 803, y: 304, name: "Phòng 11A5", floor: "Tầng 2" },
  "node_a_t2_wc_r": { x: 910, y: 304, name: "WC Dãy A Phải (T2)", floor: "Tầng 2" },

  // Tầng 3 Dãy A (Trục ngang Y = 260)
  "node_a_t3_wc_l": { x: 255, y: 260, name: "WC Dãy A Trái (T3)", floor: "Tầng 3" },
  "node_a_t3_10a1": { x: 306, y: 260, name: "Phòng 10A1", floor: "Tầng 3" },
  "node_a_t3_10a2": { x: 367, y: 260, name: "Phòng 10A2", floor: "Tầng 3" },
  "node_a_t3_10a3": { x: 491, y: 260, name: "Phòng 10A3", floor: "Tầng 3" },
  "node_a_t3_11a1": { x: 552, y: 260, name: "Phòng 11A1", floor: "Tầng 3" },
  "node_a_t3_11a2": { x: 615, y: 260, name: "Phòng 11A2", floor: "Tầng 3" },
  "node_a_t3_11a3": { x: 742, y: 260, name: "Phòng 11A3", floor: "Tầng 3" },
  "node_a_t3_11a4": { x: 803, y: 260, name: "Phòng 11A4", floor: "Tầng 3" },
  "node_a_t3_wc_r": { x: 910, y: 260, name: "WC Dãy A Phải (T3)", floor: "Tầng 3" },

  // Tầng 4 Dãy A (Trục ngang Y = 216)
  "node_a_t4_wc_l": { x: 255, y: 216, name: "WC Dãy A Trái (T4)", floor: "Tầng 4" },
  "node_a_t4_10a13": { x: 615, y: 216, name: "Phòng 10A13", floor: "Tầng 4" },
  "node_a_t4_10a12": { x: 742, y: 216, name: "Phòng 10A12", floor: "Tầng 4" },
  "node_a_t4_10a11": { x: 803, y: 216, name: "Phòng 10A11", floor: "Tầng 4" },
  "node_a_t4_wc_r": { x: 910, y: 216, name: "WC Dãy A Phải (T4)", floor: "Tầng 4" }
};

// ============================================================================
// 3. MẠNG CẠNH ĐỒ THỊ 100% VUÔNG GÓC 90° (CAMPUS_GRAPH_EDGES)
// Mọi cung nối đều song song 100% với trục X hoặc trục Y (không cắt chéo xiên vẹo)
// ============================================================================
const CAMPUS_GRAPH_EDGES = [
  // CỔNG & TRỤC SÂN (Hoàn toàn thẳng đứng X = 684 và nằm ngang Y = 777, Y = 918)
  { from: "node_cong_truong", to: "node_nga_re_cong", desc: "Đi thẳng qua Cổng Trường vào đường nội bộ" },
  { from: "node_nga_re_cong", to: "node_san_cong_truoc", desc: "Đi thẳng trục chính vào sân trường (hướng Bắc)" },
  { from: "node_san_cong_truoc", to: "node_loi_vao_hc", desc: "Rẽ trái vào Hành lang Dãy Hành chính" },
  { from: "node_san_cong_truoc", to: "node_truc_san_giua", desc: "Rẽ phải đi theo trục sân về phía Cột Cờ" },
  
  // TRỤC GIỮA SÂN, CỘT CỜ & MÁI TAM GIÁC (Thẳng đứng X = 755)
  { from: "node_truc_san_giua", to: "node_cot_co", desc: "Đi thẳng dọc trục sân đến Cột Cờ trung tâm" },
  { from: "node_cot_co", to: "node_mai_tam_giac", desc: "Đi thẳng tiếp đến sảnh Mái Tam Giác" },
  { from: "node_mai_tam_giac", to: "node_truc_san_bac", desc: "Đi thẳng trục sân lên Dãy A (phía Bắc)" },

  // HỘI TRƯỜNG (Trục ngang Y = 777)
  { from: "node_truc_san_giua", to: "node_loi_hoi_truong", desc: "Rẽ phải đi thẳng sang lối vào Hội Trường" },
  { from: "node_loi_hoi_truong", to: "node_hoi_truong", desc: "Bước vào cửa chính Hội Trường" },
  { from: "node_loi_hoi_truong", to: "node_wc_hoi_truong_corner", desc: "Đi tiếp đến lối vào WC Hội Trường" },
  { from: "node_wc_hoi_truong_corner", to: "node_wc_hoi_truong", desc: "Rẽ vào WC Hội Trường" },

  // NHÀ XE HỌC SINH CỔNG TRƯỚC (Trục ngang Y = 918)
  { from: "node_nga_re_cong", to: "node_truoc_xe_hs", desc: "Rẽ phải đi theo lối vào Nhà xe học sinh" },
  { from: "node_truoc_xe_hs", to: "node_pk_10a1", desc: "Đến vị trí để xe lớp 10A1" },
  { from: "node_pk_10a1", to: "node_pk_10a2", desc: "Đến vị trí để xe lớp 10A2" },
  { from: "node_pk_10a2", to: "node_pk_10a3", desc: "Đến vị trí để xe lớp 10A3" },
  { from: "node_pk_10a3", to: "node_pk_10a4", desc: "Đến vị trí để xe lớp 10A4" },
  { from: "node_pk_10a4", to: "node_pk_10a5", desc: "Đến vị trí để xe lớp 10A5" },
  { from: "node_pk_10a5", to: "node_pk_10a6", desc: "Đến vị trí để xe lớp 10A6" },
  { from: "node_pk_10a6", to: "node_pk_10a7", desc: "Đến vị trí để xe lớp 10A7" },
  { from: "node_pk_10a7", to: "node_pk_10a8", desc: "Đến vị trí để xe lớp 10A8" },
  { from: "node_pk_10a8", to: "node_pk_10a9", desc: "Đến vị trí để xe lớp 10A9" },
  { from: "node_pk_10a9", to: "node_pk_10a10", desc: "Đến vị trí để xe lớp 10A10" },
  { from: "node_pk_10a10", to: "node_pk_10a11", desc: "Đến vị trí để xe lớp 10A11" },
  { from: "node_pk_10a11", to: "node_goc_xe_dong", desc: "Đến góc cua nhà xe phía Đông" },

  // DÃY XE PHÍA ĐÔNG (Trục dọc X = 1497)
  { from: "node_goc_xe_dong", to: "node_pk_10a12", desc: "Rẽ vuông góc dọc dãy xe đến ô 10A12" },
  { from: "node_pk_10a12", to: "node_pk_11a1", desc: "Đi thẳng dọc theo dãy xe đến ô 11A1" },
  { from: "node_pk_11a1", to: "node_pk_11a2", desc: "Đi thẳng tiếp đến ô xe 11A2" },

  // NHÀ XE GIÁO VIÊN & ĐƯỜNG XE PHÍA TÂY (Trục ngang Y = 918 & Y = 835)
  { from: "node_nga_re_cong", to: "node_nga_xe_gv", desc: "Rẽ trái đi theo lối vào Nhà xe giáo viên" },
  { from: "node_nga_xe_gv", to: "node_nha_xe_gv", desc: "Đi vào trong Nhà xe giáo viên" },
  { from: "node_nga_xe_gv", to: "node_goc_xe_tay_nam_1", desc: "Đi thẳng sang góc cua phía Tây Nam" },
  { from: "node_goc_xe_tay_nam_1", to: "node_goc_xe_tay_nam", desc: "Rẽ phải theo đường xe phía Tây" },
  { from: "node_goc_xe_tay_nam", to: "node_goc_xe_tay_bac_1", desc: "Rẽ trái vào dãy để xe học sinh phía Tây" },
  { from: "node_goc_xe_tay_bac_1", to: "node_pk_12a10", desc: "Đến vị trí để xe 12A10" },
  { from: "node_pk_12a10", to: "node_pk_12a9", desc: "Đi thẳng dọc dãy xe đến ô 12A9" },
  { from: "node_pk_12a9", to: "node_goc_xe_tay_bac", desc: "Đi đến góc cua phía Tây Bắc" },

  // DÃY XE CẠNH CỔNG SAU (Trục ngang Y = 186)
  { from: "node_goc_xe_tay_bac", to: "node_khuc_cua_tb", desc: "Rẽ phải theo đường xe Cổng sau" },
  { from: "node_khuc_cua_tb", to: "node_pk_12a4", desc: "Đến ô xe 12A4" },
  { from: "node_pk_12a4", to: "node_pk_12a3", desc: "Đến ô xe 12A3" },
  { from: "node_pk_12a3", to: "node_pk_12a2", desc: "Đến ô xe 12A2" },
  { from: "node_pk_12a2", to: "node_pk_12a1", desc: "Đến ô xe 12A1" },
  { from: "node_pk_12a1", to: "node_pk_11a8", desc: "Đến ô xe 11A8" },
  { from: "node_pk_11a8", to: "node_pk_11a7", desc: "Đến ô xe 11A7" },
  { from: "node_pk_11a7", to: "node_pk_11a6", desc: "Đến ô xe 11A6" },
  { from: "node_pk_11a6", to: "node_pk_11a5", desc: "Đến ô xe 11A5" },
  { from: "node_pk_11a5", to: "node_pk_11a3", desc: "Đến ô xe 11A3" },
  { from: "node_pk_11a3", to: "node_khuc_cua_db", desc: "Đến góc cua phía Đông Bắc" },

  // DÃY HÀNH CHÍNH (Tầng trệt Y = 777)
  { from: "node_loi_vao_hc", to: "node_hc_tret_td", desc: "Đến trước Phòng Tiếp dân" },
  { from: "node_hc_tret_td", to: "node_hc_tret_tt", desc: "Đi thẳng qua Phòng Truyền thống" },
  { from: "node_hc_tret_tt", to: "node_hc_tret_pht", desc: "Đi thẳng qua Phòng Phó Hiệu Trưởng" },
  { from: "node_hc_tret_pht", to: "node_hc_stair_tret", desc: "Đến Cầu thang Dãy Hành Chính (Trệt)" },
  { from: "node_hc_stair_tret", to: "node_hc_tret_p2", desc: "Đi thẳng qua Phòng hồ sơ 2" },
  { from: "node_hc_tret_p2", to: "node_hc_tret_p1", desc: "Đi thẳng qua Phòng hồ sơ 1" },
  { from: "node_hc_tret_p1", to: "node_hc_tret_wc", desc: "Đến WC Dãy Hành Chính (Trệt)" },

  // Cầu thang Hành chính (Trục dọc X = 365)
  { from: "node_hc_stair_tret", to: "node_hc_stair", desc: "Bước vào Cầu thang Hành chính" },
  { from: "node_hc_stair", to: "node_hc_stair_t2", desc: "Leo cầu thang bộ lên Tầng 2 Dãy Hành Chính" },

  // Tầng 2 Hành chính (Trục ngang Y = 697)
  { from: "node_hc_stair_t2", to: "node_hc_t2_kt", desc: "Đi thẳng đến Phòng Kế toán" },
  { from: "node_hc_t2_kt", to: "node_hc_t2_cb", desc: "Đi thẳng đến Phòng Chi bộ (Họp GV)" },
  { from: "node_hc_t2_cb", to: "node_cau_noi_hc_b", desc: "Đến đầu Cầu hành lang nối Dãy B" },
  { from: "node_hc_stair_t2", to: "node_hc_t2_vt", desc: "Đi thẳng sang Phòng Văn thư" },
  { from: "node_hc_t2_vt", to: "node_hc_t2_ht", desc: "Đi thẳng đến Phòng Hiệu trưởng" },
  { from: "node_hc_t2_ht", to: "node_hc_t2_wc", desc: "Đến WC Tầng 2 Hành chính" },

  // CẦU HÀNH LANG NỐI DÃY HC VÀ DÃY B (Trục dọc X = 595)
  { from: "node_cau_noi_hc_b", to: "node_b_tret_east", desc: "Đi qua Cầu hành lang trên cao sang Dãy B" },
  { from: "node_cau_noi_hc_b", to: "node_b_t2_east", desc: "Đi qua Cầu hành lang Tầng 2 sang Dãy B" },

  // DÃY B (KHỐI 12)
  // Tầng trệt (Trục ngang Y = 612)
  { from: "node_b_tret_wc", to: "node_b_tret_12a7", desc: "Hành lang Trệt Dãy B qua 12A7" },
  { from: "node_b_tret_12a7", to: "node_b_tret_12a8", desc: "Đi thẳng qua Phòng 12A8" },
  { from: "node_b_tret_12a8", to: "node_b_stair_tret", desc: "Đến Cầu thang Dãy B (Trệt)" },
  { from: "node_b_stair_tret", to: "node_b_tret_12a9", desc: "Đi thẳng qua Phòng 12A9" },
  { from: "node_b_tret_12a9", to: "node_b_tret_12a10", desc: "Đi thẳng qua Phòng 12A10" },
  { from: "node_b_tret_12a10", to: "node_b_tret_east", desc: "Đến đầu hành lang phía Đông Dãy B" },
  { from: "node_b_tret_east", to: "node_mai_tam_giac", desc: "Đi thẳng theo hành lang ra sảnh Mái Tam Giác" },

  // Cầu thang Dãy B (Trục dọc X = 409)
  { from: "node_b_stair_tret", to: "node_b_stair_t2", desc: "Leo lên Tầng 2 Dãy B qua cầu thang bộ" },
  { from: "node_b_stair_t2", to: "node_b_stair_t3", desc: "Leo tiếp lên Tầng 3 Dãy B qua cầu thang bộ" },
  { from: "node_b_stair_t3", to: "node_b_stair_t4", desc: "Leo lên Tầng 4 Dãy B qua cầu thang bộ" },

  // Tầng 2 Dãy B (Trục ngang Y = 576)
  { from: "node_b_t2_wc", to: "node_b_t2_12a3", desc: "Hành lang Tầng 2 qua 12A3" },
  { from: "node_b_t2_12a3", to: "node_b_t2_12a4", desc: "Đi thẳng qua 12A4" },
  { from: "node_b_t2_12a4", to: "node_b_stair_t2", desc: "Đến Cầu thang Tầng 2 Dãy B" },
  { from: "node_b_stair_t2", to: "node_b_t2_12a5", desc: "Đi thẳng qua 12A5" },
  { from: "node_b_t2_12a5", to: "node_b_t2_12a6", desc: "Đi thẳng đến 12A6" },
  { from: "node_b_t2_12a6", to: "node_b_t2_east", desc: "Đến đầu hành lang Tầng 2 Dãy B" },

  // Tầng 3 Dãy B (Trục ngang Y = 538)
  { from: "node_b_t3_wc", to: "node_b_t3_12a1", desc: "Hành lang Tầng 3 qua 12A1" },
  { from: "node_b_t3_12a1", to: "node_b_t3_12a2", desc: "Đi thẳng qua 12A2" },
  { from: "node_b_t3_12a2", to: "node_b_stair_t3", desc: "Đến Cầu thang Tầng 3 Dãy B" },
  { from: "node_b_stair_t3", to: "node_b_t3_10a10", desc: "Đi thẳng qua 10A10" },
  { from: "node_b_t3_10a10", to: "node_b_t3_10a9", desc: "Đi thẳng đến 10A9" },

  // Tầng 4 Dãy B (Trục ngang Y = 500)
  { from: "node_b_t4_wc", to: "node_b_stair_t4", desc: "Đến Cầu thang Tầng 4 Dãy B" },

  // HÀNH LANG TÂY BẮC NỐI DÃY B VÀ DÃY A (Trục dọc X = 429)
  { from: "node_b_stair_tret", to: "node_noi_ba_south", desc: "Rẽ vào hành lang Tây Dãy B" },
  { from: "node_noi_ba_south", to: "node_noi_ba_north", desc: "Đi thẳng dọc theo Hành lang Tây Bắc" },
  { from: "node_noi_ba_north", to: "node_a1_stair_tret", desc: "Rẽ phải đến Cầu thang A1 (Trệt Dãy A)" },

  // DÃY BỘ MÔN (Trục ngang Y = 612)
  { from: "node_mai_tam_giac", to: "node_bm_stair_tret", desc: "Rẽ phải theo hành lang sang Dãy Bộ Môn" },
  { from: "node_bm_stair_tret", to: "node_bm_tret_yte", desc: "Đi thẳng qua Phòng Y Tế" },
  { from: "node_bm_tret_yte", to: "node_bm_tret_ly", desc: "Đi thẳng qua Phòng Thí nghiệm Lý" },
  { from: "node_bm_tret_ly", to: "node_bm_tret_hoa", desc: "Đi thẳng đến Phòng Thí nghiệm Hóa" },

  // Cầu thang Bộ Môn (Trục dọc X = 942)
  { from: "node_bm_stair_tret", to: "node_bm_stair_t2", desc: "Leo lên Tầng 2 Dãy Bộ Môn qua cầu thang bộ" },
  { from: "node_bm_stair_t2", to: "node_bm_stair_t3", desc: "Leo tiếp lên Tầng 3 Dãy Bộ Môn qua cầu thang bộ" },
  { from: "node_bm_stair_t3", to: "node_bm_stair_t4", desc: "Leo lên Tầng 4 Dãy Bộ Môn qua cầu thang bộ" },

  // Tầng 2 Bộ Môn (Trục ngang Y = 576)
  { from: "node_bm_stair_t2", to: "node_bm_t2_doan", desc: "Đến VP Đoàn Thanh Niên" },
  { from: "node_bm_t2_doan", to: "node_bm_t2_tin1", desc: "Đi thẳng qua Phòng Tin 1" },
  { from: "node_bm_t2_tin1", to: "node_bm_t2_tin2", desc: "Đi đến Phòng Tin 2" },

  // Tầng 3 Bộ Môn (Trục ngang Y = 538)
  { from: "node_bm_stair_t3", to: "node_bm_t3_may1", desc: "Đến Phòng Máy 1" },
  { from: "node_bm_t3_may1", to: "node_bm_t3_may2", desc: "Đi đến Phòng Máy 2" },

  // Tầng 4 Bộ Môn (Trục ngang Y = 500)
  { from: "node_bm_stair_t4", to: "node_bm_t4_tin4", desc: "Đến Phòng Tin 4" },
  { from: "node_bm_t4_tin4", to: "node_bm_t4_av", desc: "Đi đến Phòng Anh văn" },

  // DÃY A (TRÊN CÙNG: KHỐI 10 & 11 & THƯ VIỆN)
  // Tầng trệt (Trục ngang Y = 378)
  { from: "node_truc_san_bac", to: "node_a_tret_tv", desc: "Đến khu vực Thư Viện trường" },
  { from: "node_truc_san_bac", to: "node_a1_stair_tret", desc: "Đến Cầu thang A1 (Trệt Dãy A)" },
  { from: "node_truc_san_bac", to: "node_a2_stair_tret", desc: "Đến Cầu thang A2 (Trệt Dãy A)" },
  { from: "node_a_tret_wc_l", to: "node_a_tret_10a7", desc: "Hành lang Trệt Dãy A qua 10A7" },
  { from: "node_a_tret_10a7", to: "node_a_tret_10a8", desc: "Đi thẳng qua 10A8" },
  { from: "node_a_tret_10a8", to: "node_a1_stair_tret", desc: "Đến Cầu thang A1 (Trái)" },
  { from: "node_a1_stair_tret", to: "node_a_tret_tv", desc: "Đi qua khu vực Thư Viện" },
  { from: "node_a_tret_tv", to: "node_a2_stair_tret", desc: "Đến Cầu thang A2 (Phải)" },
  { from: "node_a2_stair_tret", to: "node_a_tret_11a9", desc: "Đi thẳng qua 11A9" },
  { from: "node_a_tret_11a9", to: "node_a_tret_11a10", desc: "Đi thẳng qua 11A10" },
  { from: "node_a_tret_11a10", to: "node_a_tret_wc_r", desc: "Đến WC Dãy A Phải (Trệt)" },

  // Cầu thang A1 (Trục dọc X = 623)
  { from: "node_a1_stair_tret", to: "node_a1_stair_t2", desc: "Leo cầu thang A1 lên Tầng 2" },
  { from: "node_a1_stair_t2", to: "node_a1_stair_t3", desc: "Leo tiếp lên Tầng 3" },
  { from: "node_a1_stair_t3", to: "node_a1_stair_t4", desc: "Leo lên Tầng 4 Dãy A" },

  // Cầu thang A2 (Trục dọc X = 861)
  { from: "node_a2_stair_tret", to: "node_a2_stair_t2", desc: "Leo cầu thang A2 lên Tầng 2" },
  { from: "node_a2_stair_t2", to: "node_a2_stair_t3", desc: "Leo tiếp lên Tầng 3" },
  { from: "node_a2_stair_t3", to: "node_a2_stair_t4", desc: "Leo lên Tầng 4 Dãy A" },

  // Tầng 2 Dãy A (Trục ngang Y = 304)
  { from: "node_a_t2_wc_l", to: "node_a_t2_10a6", desc: "Hành lang Tầng 2 qua 10A6" },
  { from: "node_a_t2_10a6", to: "node_a_t2_10a5", desc: "Đi thẳng qua 10A5" },
  { from: "node_a_t2_10a5", to: "node_a1_stair_t2", desc: "Đến Cầu thang A1 (T2)" },
  { from: "node_a1_stair_t2", to: "node_a_t2_10a4", desc: "Đi thẳng qua 10A4" },
  { from: "node_a_t2_10a4", to: "node_a_t2_11a8", desc: "Đi thẳng qua 11A8" },
  { from: "node_a_t2_11a8", to: "node_a_t2_11a7", desc: "Đi thẳng qua 11A7" },
  { from: "node_a_t2_11a7", to: "node_a2_stair_t2", desc: "Đến Cầu thang A2 (T2)" },
  { from: "node_a2_stair_t2", to: "node_a_t2_11a6", desc: "Đi thẳng qua 11A6" },
  { from: "node_a_t2_11a6", to: "node_a_t2_11a5", desc: "Đi thẳng qua 11A5" },
  { from: "node_a_t2_11a5", to: "node_a_t2_wc_r", desc: "Đến WC Dãy A Phải (T2)" },

  // Tầng 3 Dãy A (Trục ngang Y = 260)
  { from: "node_a_t3_wc_l", to: "node_a_t3_10a1", desc: "Hành lang Tầng 3 qua 10A1" },
  { from: "node_a_t3_10a1", to: "node_a_t3_10a2", desc: "Đi thẳng qua 10A2" },
  { from: "node_a_t3_10a2", to: "node_a1_stair_t3", desc: "Đến Cầu thang A1 (T3)" },
  { from: "node_a1_stair_t3", to: "node_a_t3_10a3", desc: "Đi thẳng qua 10A3" },
  { from: "node_a_t3_10a3", to: "node_a_t3_11a1", desc: "Đi thẳng qua 11A1" },
  { from: "node_a_t3_11a1", to: "node_a_t3_11a2", desc: "Đi thẳng qua 11A2" },
  { from: "node_a_t3_11a2", to: "node_a2_stair_t3", desc: "Đến Cầu thang A2 (T3)" },
  { from: "node_a2_stair_t3", to: "node_a_t3_11a3", desc: "Đi thẳng qua 11A3" },
  { from: "node_a_t3_11a3", to: "node_a_t3_11a4", desc: "Đi thẳng qua 11A4" },
  { from: "node_a_t3_11a4", to: "node_a_t3_wc_r", desc: "Đến WC Dãy A Phải (T3)" },

  // Tầng 4 Dãy A (Trục ngang Y = 216)
  { from: "node_a_t4_wc_l", to: "node_a1_stair_t4", desc: "Đến Cầu thang A1 (T4)" },
  { from: "node_a1_stair_t4", to: "node_a_t4_10a13", desc: "Đi thẳng đến Phòng 10A13" },
  { from: "node_a_t4_10a13", to: "node_a2_stair_t4", desc: "Đến Cầu thang A2 (T4)" },
  { from: "node_a2_stair_t4", to: "node_a_t4_10a12", desc: "Đi thẳng qua 10A12" },
  { from: "node_a_t4_10a11", to: "node_a_t4_wc_r", desc: "Đến WC Dãy A Phải (T4)" },
  // Vị trí để xe 10A13 (Kế bên Hội Trường)
  { from: "node_loi_hoi_truong", to: "node_pk_10a13", desc: "Rẽ sang Khu vực để xe lớp 10A13" }
];

window.CAMPUS_LOCATIONS = CAMPUS_LOCATIONS;
window.CAMPUS_GRAPH_NODES = CAMPUS_GRAPH_NODES;
window.CAMPUS_GRAPH_EDGES = CAMPUS_GRAPH_EDGES;
