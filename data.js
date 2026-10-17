/**
 * data.js - Dữ liệu Vị trí, Tọa độ & Mạng lưới Lối đi Khuôn viên Trường THPT TAM PHƯỚC
 * SƠ ĐỒ PHÒNG HỌC 3 KHỐI & VỊ TRÍ ĐỂ XE NĂM HỌC 2026 - 2027
 * Hệ tọa độ chuẩn: viewBox="0 0 1600 1120"
 * Hệ thống chỉ đường:
 * - Đi dọc 100% theo các trục Hành Lang (Corridors) và Đường nội bộ
 * - Chuyển tầng bắt buộc đi qua Cầu Thang (Stairs)
 * - Tối ưu quãng đường ngắn nhất (Dijkstra)
 */

// ============================================================================
// 1. DANH SÁCH TẤT CẢ VỊ TRÍ (CAMPUS_LOCATIONS) - TỌA ĐỘ CHUẨN XÁC 100% SVG
// ============================================================================
const CAMPUS_LOCATIONS = [
  // --- KHU VỰC CỔNG & TRUNG TÂM SÂN ---
  { id: "cong_truong", name: "Cổng Trường", category: "gate", building: "Khu vực Cổng", floor: "Mặt đất", x: 684, y: 997, node: "node_cong_truong", keywords: ["cổng", "cổng chính", "cổng trường", "vào", "ra"], description: "Cổng chính ra vào trường học" },
  { id: "cot_co", name: "Cột Cờ (Sân trường)", category: "landmark", building: "Sân trường", floor: "Mặt đất", x: 755, y: 780, node: "node_cot_co", keywords: ["cột cờ", "sân cờ", "chào cờ", "sân trường"], description: "Khu vực Cột Cờ trung tâm sân trường" },
  { id: "canopy_triangle", name: "Mái Tam Giác", category: "landmark", building: "Sân trường", floor: "Mặt đất", x: 755, y: 615, node: "node_mai_tam_giac", keywords: ["mái tam giác", "sảnh tam giác"], description: "Công trình kiến trúc Mái Tam Giác giữa sân trường" },
  { id: "nha_xe_gv", name: "Nhà xe giáo viên", category: "facility", building: "Khu vực Cổng", floor: "Mặt đất", x: 169, y: 909, node: "node_nha_xe_gv", keywords: ["nhà xe gv", "xe giáo viên", "bãi xe gv"], description: "Khu vực để xe dành riêng cho giáo viên (góc dưới bên trái)" },
  { id: "hoi_truong", name: "Hội Trường", category: "facility", building: "Hội Trường", floor: "Tầng trệt", x: 1080, y: 775, node: "node_hoi_truong", keywords: ["hội trường", "nhà đa năng", "sự kiện", "lễ"], description: "Hội trường lớn của trường (phía trước bên phải)" },
  { id: "wc_hoi_truong", name: "WC Hội Trường", category: "facility", building: "Hội Trường", floor: "Tầng trệt", x: 1183, y: 721, node: "node_wc_hoi_truong", keywords: ["wc", "nhà vệ sinh", "wc hội trường"], description: "Nhà vệ sinh cạnh Hội Trường" },

  // --- DÃY HÀNH CHÍNH (HIỆU BỘ) ---
  // Tầng 2
  { id: "phong_hieu_truong", name: "Phòng Hiệu trưởng", category: "admin", building: "Dãy Hành Chính", floor: "Tầng 2", x: 183, y: 697, node: "node_hc_t2_ht", keywords: ["hiệu trưởng", "ht", "thầy hiệu trưởng"], description: "Phòng làm việc Hiệu trưởng (Tầng 2 Dãy Hành Chính)" },
  { id: "phong_van_thu", name: "Phòng Văn thư", category: "admin", building: "Dãy Hành Chính", floor: "Tầng 2", x: 237, y: 697, node: "node_hc_t2_vt", keywords: ["văn thư", "công văn", "dấu"], description: "Phòng Văn thư tiếp nhận công văn (Tầng 2 Dãy Hành Chính)" },
  { id: "phong_ke_toan", name: "Phòng Kế toán", category: "admin", building: "Dãy Hành Chính", floor: "Tầng 2", x: 331, y: 697, node: "node_hc_t2_kt", keywords: ["kế toán", "học phí", "tài chính"], description: "Phòng Tài vụ & Kế toán (Tầng 2 Dãy Hành Chính)" },
  { id: "phong_chi_bo", name: "Phòng Chi bộ (họp GV)", category: "admin", building: "Dãy Hành Chính", floor: "Tầng 2", x: 387, y: 697, node: "node_hc_t2_cb", keywords: ["chi bộ", "họp gv", "hội trường nhỏ", "phòng giáo viên"], description: "Phòng họp Chi bộ và Hội đồng Giáo viên (Tầng 2 Dãy Hành Chính)" },
  { id: "wc_hc_t2", name: "WC Dãy Hành Chính (T2)", category: "facility", building: "Dãy Hành Chính", floor: "Tầng 2", x: 138, y: 697, node: "node_hc_t2_wc", keywords: ["wc", "nhà vệ sinh"], description: "Nhà vệ sinh Tầng 2 Dãy Hành Chính" },

  // Tầng trệt
  { id: "phong_ho_so_1", name: "Phòng hồ sơ 1", category: "admin", building: "Dãy Hành Chính", floor: "Tầng trệt", x: 183, y: 739, node: "node_hc_tret_p1", keywords: ["hồ sơ", "học bạ", "hồ sơ 1"], description: "Phòng lưu trữ hồ sơ học sinh 1 (Tầng trệt Dãy Hành Chính)" },
  { id: "phong_ho_so_2", name: "Phòng hồ sơ 2", category: "admin", building: "Dãy Hành Chính", floor: "Tầng trệt", x: 237, y: 739, node: "node_hc_tret_p2", keywords: ["hồ sơ", "hồ sơ 2"], description: "Phòng lưu trữ hồ sơ học sinh 2 (Tầng trệt Dãy Hành Chính)" },
  { id: "phong_pho_ht", name: "Phòng Phó HT", category: "admin", building: "Dãy Hành Chính", floor: "Tầng trệt", x: 331, y: 739, node: "node_hc_tret_pht", keywords: ["phó hiệu trưởng", "phó ht", "thầy phó"], description: "Phòng Phó Hiệu Trưởng (Tầng trệt Dãy Hành Chính)" },
  { id: "phong_truyen_thong", name: "Phòng Truyền thống", category: "admin", building: "Dãy Hành Chính", floor: "Tầng trệt", x: 373, y: 739, node: "node_hc_tret_tt", keywords: ["truyền thống", "lịch sử"], description: "Phòng truyền thống trường học (Tầng trệt Dãy Hành Chính)" },
  { id: "phong_tiep_dan", name: "Phòng Tiếp dân", category: "admin", building: "Dãy Hành Chính", floor: "Tầng trệt", x: 401, y: 739, node: "node_hc_tret_td", keywords: ["tiếp dân", "phụ huynh"], description: "Phòng tiếp đón phụ huynh và khách (Tầng trệt Dãy Hành Chính)" },
  { id: "wc_hc_tret", name: "WC Dãy Hành Chính (Trệt)", category: "facility", building: "Dãy Hành Chính", floor: "Tầng trệt", x: 138, y: 739, node: "node_hc_tret_wc", keywords: ["wc", "nhà vệ sinh"], description: "Nhà vệ sinh Tầng trệt Dãy Hành Chính" },
  { id: "cau_thang_hc", name: "Cầu thang Hành chính", category: "stair", building: "Dãy Hành Chính", floor: "Cầu thang", x: 284, y: 718, node: "node_hc_stair_tret", keywords: ["cầu thang hành chính", "thang bộ"], description: "Cầu thang bộ kết nối Trệt và Tầng 2 Dãy Hành Chính" },
  { id: "loi_vao_hanh_chinh", name: "Lối vào Dãy Hành Chính", category: "gate", building: "Dãy Hành Chính", floor: "Mặt đất", x: 284, y: 814, node: "node_hc_sanh_truoc", keywords: ["lối vào hành chính", "sảnh hành chính", "cửa hành chính", "sảnh hiệu bộ", "hiệu bộ", "lối vào"], description: "Sảnh đón và lối vào chính của Dãy Hành Chính (Hiệu Bộ)" },

  // --- TÒA 3 (DÃY B: KHỐI 12 - GIỮA BÊN TRÁI: 4 TẦNG) ---
  // Tầng 4
  { id: "b_t4_p14", name: "Phòng P14", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 4", x: 274, y: 460, node: "node_b_t3_12a1", keywords: ["p14", "14"] },
  { id: "b_t4_p15", name: "Phòng P15", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 4", x: 334, y: 460, node: "node_b_t3_12a2", keywords: ["p15", "15"] },
  { id: "b_t4_p16", name: "Phòng P16", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 4", x: 442, y: 460, node: "node_b_t3_10a10", keywords: ["p16", "16"] },
  { id: "b_t4_media", name: "Phòng Media", category: "facility", building: "Tòa 3 (Khối 12)", floor: "Tầng 4", x: 502, y: 460, node: "node_b_t3_10a9", keywords: ["media", "truyền thông"] },
  { id: "b_t4_nghi_gv_nam", name: "Phòng nghỉ GV Nam", category: "admin", building: "Tòa 3 (Khối 12)", floor: "Tầng 4", x: 550, y: 460, node: "node_b_t3_10a9", keywords: ["nghỉ gv", "gv nam"] },
  { id: "wc_b_t4", name: "WC Tòa 3 (T4)", category: "facility", building: "Tòa 3 (Khối 12)", floor: "Tầng 4", x: 223, y: 460, node: "node_b_t4_wc", keywords: ["wc"] },
  // Tầng 3
  { id: "b_t3_12a1", name: "Phòng 12A1", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 3", x: 274, y: 498, node: "node_b_t3_12a1", keywords: ["12a1"] },
  { id: "b_t3_12a2", name: "Phòng 12A2", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 3", x: 334, y: 498, node: "node_b_t3_12a2", keywords: ["12a2"] },
  { id: "b_t3_10a10", name: "Phòng 10A10", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 3", x: 442, y: 498, node: "node_b_t3_10a10", keywords: ["10a10"] },
  { id: "b_t3_10a9", name: "Phòng 10A9", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 3", x: 502, y: 498, node: "node_b_t3_10a9", keywords: ["10a9"] },
  { id: "b_t3_nghi_gv_nu", name: "Phòng nghỉ GV Nữ", category: "admin", building: "Tòa 3 (Khối 12)", floor: "Tầng 3", x: 550, y: 498, node: "node_b_t3_10a9", keywords: ["nghỉ gv nữ", "gv nữ"] },
  { id: "wc_b_t3", name: "WC Tòa 3 (T3)", category: "facility", building: "Tòa 3 (Khối 12)", floor: "Tầng 3", x: 223, y: 498, node: "node_b_t3_wc", keywords: ["wc"] },
  // Tầng 2
  { id: "b_t2_12a3", name: "Phòng 12A3", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 2", x: 274, y: 536, node: "node_b_t2_12a3", keywords: ["12a3"] },
  { id: "b_t2_12a4", name: "Phòng 12A4", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 2", x: 334, y: 536, node: "node_b_t2_12a4", keywords: ["12a4"] },
  { id: "b_t2_12a5", name: "Phòng 12A5", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 2", x: 442, y: 536, node: "node_b_t2_12a5", keywords: ["12a5"] },
  { id: "b_t2_12a6", name: "Phòng 12A6", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng 2", x: 502, y: 536, node: "node_b_t2_12a6", keywords: ["12a6"] },
  { id: "b_t2_thi_vu", name: "Phòng Thi vụ", category: "admin", building: "Tòa 3 (Khối 12)", floor: "Tầng 2", x: 550, y: 536, node: "node_b_t2_12a6", keywords: ["thi vụ", "khảo thí"] },
  { id: "wc_b_t2", name: "WC Tòa 3 (T2)", category: "facility", building: "Tòa 3 (Khối 12)", floor: "Tầng 2", x: 223, y: 536, node: "node_b_t2_wc", keywords: ["wc"] },
  // Tầng trệt
  { id: "b_tret_12a7", name: "Phòng 12A7", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng trệt", x: 274, y: 574, node: "node_b_tret_12a7", keywords: ["12a7"] },
  { id: "b_tret_12a8", name: "Phòng 12A8", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng trệt", x: 334, y: 574, node: "node_b_tret_12a8", keywords: ["12a8"] },
  { id: "b_tret_12a9", name: "Phòng 12A9", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng trệt", x: 442, y: 574, node: "node_b_tret_12a9", keywords: ["12a9"] },
  { id: "b_tret_12a10", name: "Phòng 12A10", category: "classroom", building: "Tòa 3 (Khối 12)", floor: "Tầng trệt", x: 502, y: 574, node: "node_b_tret_12a10", keywords: ["12a10"] },
  { id: "b_tret_am_thanh", name: "Phòng Âm thanh", category: "facility", building: "Tòa 3 (Khối 12)", floor: "Tầng trệt", x: 550, y: 574, node: "node_b_tret_12a10", keywords: ["âm thanh", "loa"] },
  { id: "wc_b_tret", name: "WC Tòa 3 (Trệt)", category: "facility", building: "Tòa 3 (Khối 12)", floor: "Tầng trệt", x: 223, y: 574, node: "node_b_tret_wc", keywords: ["wc"] },
  { id: "cau_thang_b", name: "Cầu thang Tòa 3", category: "stair", building: "Tòa 3 (Khối 12)", floor: "Cầu thang", x: 388, y: 517, node: "node_b_stair_tret", keywords: ["cầu thang b", "cầu thang tòa 3", "thang khối 12"] },

  // --- TÒA 1 (DÃY BỘ MÔN / PHÒNG CHỨC NĂNG - GIỮA BÊN PHẢI) ---
  // Tầng 4
  { id: "bm_t4_luu_tru", name: "Phòng Lưu trữ", category: "admin", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 4", x: 1048, y: 460, node: "node_bm_t4_tin4", keywords: ["lưu trữ", "kho"] },
  { id: "bm_t4_tin4", name: "Phòng Tin 4", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 4", x: 1108, y: 460, node: "node_bm_t4_tin4", keywords: ["tin 4", "tin học"] },
  { id: "bm_t4_anh_van", name: "Phòng Anh văn (T4)", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 4", x: 1178, y: 460, node: "node_bm_t4_av", keywords: ["anh văn", "ngoại ngữ"] },
  { id: "wc_bm_t4", name: "WC Tòa 1 (T4)", category: "facility", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 4", x: 1245, y: 460, node: "node_bm_t4_av", keywords: ["wc"] },
  // Tầng 3
  { id: "bm_t3_tam_ly", name: "Phòng TV Tâm lý", category: "facility", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 3", x: 988, y: 498, node: "node_bm_t3_may1", keywords: ["tâm lý", "tư vấn tâm lý"] },
  { id: "bm_t3_anh_van", name: "Phòng học Anh văn (T3)", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 3", x: 1048, y: 498, node: "node_bm_t3_may1", keywords: ["anh văn", "tiếng anh"] },
  { id: "bm_t3_may1", name: "Phòng Máy 1", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 3", x: 1108, y: 498, node: "node_bm_t3_may1", keywords: ["phòng máy 1", "máy tính"] },
  { id: "bm_t3_may2", name: "Phòng Máy 2", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 3", x: 1178, y: 498, node: "node_bm_t3_may2", keywords: ["phòng máy 2", "máy tính"] },
  { id: "wc_bm_t3", name: "WC Tòa 1 (T3)", category: "facility", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 3", x: 1245, y: 498, node: "node_bm_t3_may2", keywords: ["wc"] },
  // Tầng 2
  { id: "bm_t2_qp", name: "Phòng Thể dục QP", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 2", x: 988, y: 536, node: "node_bm_t2_doan", keywords: ["quốc phòng", "thể dục", "qp"] },
  { id: "vp_doan", name: "VP Đoàn Thanh Niên", category: "admin", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 2", x: 1048, y: 536, node: "node_bm_t2_doan", keywords: ["đoàn", "vp đoàn"] },
  { id: "tin_hoc_1", name: "Phòng Tin 1", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 2", x: 1108, y: 536, node: "node_bm_t2_tin1", keywords: ["tin 1"] },
  { id: "tin_hoc_2", name: "Phòng Tin 2", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 2", x: 1178, y: 536, node: "node_bm_t2_tin2", keywords: ["tin 2"] },
  { id: "wc_bm_t2", name: "WC Tòa 1 (T2)", category: "facility", building: "Tòa 1 (Bộ Môn)", floor: "Tầng 2", x: 1245, y: 536, node: "node_bm_t2_tin2", keywords: ["wc"] },
  // Tầng trệt
  { id: "phong_y_te", name: "Phòng Y Tế", category: "facility", building: "Tòa 1 (Bộ Môn)", floor: "Tầng trệt", x: 988, y: 574, node: "node_bm_tret_yte", keywords: ["y tế", "sơ cứu", "thuốc"] },
  { id: "bm_tret_ly", name: "Phòng Thí nghiệm Lý", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng trệt", x: 1070, y: 574, node: "node_bm_tret_ly", keywords: ["lý", "vật lý", "thí nghiệm"] },
  { id: "bm_tret_hoa", name: "Phòng Thí nghiệm Hóa", category: "classroom", building: "Tòa 1 (Bộ Môn)", floor: "Tầng trệt", x: 1170, y: 574, node: "node_bm_tret_hoa", keywords: ["hóa", "hóa học", "thí nghiệm"] },
  { id: "wc_bm_tret", name: "WC Tòa 1 (Trệt)", category: "facility", building: "Tòa 1 (Bộ Môn)", floor: "Tầng trệt", x: 1245, y: 574, node: "node_bm_tret_hoa", keywords: ["wc"] },
  { id: "cau_thang_bm", name: "Cầu thang Tòa 1", category: "stair", building: "Tòa 1 (Bộ Môn)", floor: "Cầu thang", x: 928, y: 517, node: "node_bm_stair_tret", keywords: ["cầu thang bộ môn", "cầu thang tòa 1"] },

  // --- TÒA 2 (DÃY A: TRÊN CÙNG - KHỐI 10 & 11 & THƯ VIỆN) ---
  // Tầng 4
  { id: "wc_a_t4_left", name: "WC Tòa 2 Trái (T4)", category: "facility", building: "Tòa 2 (Khối 10, 11)", floor: "Tầng 4", x: 423, y: 225, node: "node_a_t4_wc_l", keywords: ["wc"] },
  { id: "a_t4_ben_su_dia", name: "Phòng bên cạnh Sử Địa", category: "classroom", building: "Tòa 2 (Khối 10, 11)", floor: "Tầng 4", x: 474, y: 225, node: "node_a_t4_10a13", keywords: ["sử địa"] },
  { id: "a_t4_su_dia", name: "Phòng Sử Địa (GDKTPL)", category: "classroom", building: "Tòa 2 (Khối 10, 11)", floor: "Tầng 4", x: 534, y: 225, node: "node_a_t4_10a13", keywords: ["sử địa", "gdktpl", "lịch sử"] },
  { id: "a_t4_p38", name: "Phòng P38", category: "classroom", building: "Tòa 2 (Khối 10, 11)", floor: "Tầng 4", x: 658, y: 225, node: "node_a_t4_10a13", keywords: ["p38", "38"] },
  { id: "a_t4_p39", name: "Phòng P39", category: "classroom", building: "Tòa 2 (Khối 10, 11)", floor: "Tầng 4", x: 732, y: 225, node: "node_a_t4_10a13", keywords: ["p39", "39"] },
  { id: "a_t4_10a13", name: "Phòng 10A13", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 806, y: 225, node: "node_a_t4_10a13", keywords: ["10a13"] },
  { id: "a_t4_10a12", name: "Phòng 10A12", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 934, y: 225, node: "node_a_t4_10a12", keywords: ["10a12"] },
  { id: "a_t4_10a11", name: "Phòng 10A11", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 994, y: 225, node: "node_a_t4_10a11", keywords: ["10a11"] },
  { id: "wc_a_t4_left", name: "WC Dãy A Trái (T4)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 423, y: 225, node: "node_a_t4_wc_l", keywords: ["wc"] },
  { id: "wc_a_t4_right", name: "WC Dãy A Phải (T4)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 4", x: 1045, y: 225, node: "node_a_t4_wc_r", keywords: ["wc"] },
  // Tầng 3
  { id: "a_t3_10a1", name: "Phòng 10A1", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 474, y: 263, node: "node_a_t3_10a1", keywords: ["10a1"] },
  { id: "a_t3_10a2", name: "Phòng 10A2", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 534, y: 263, node: "node_a_t3_10a2", keywords: ["10a2"] },
  { id: "a_t3_10a3", name: "Phòng 10A3", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 658, y: 263, node: "node_a_t3_10a3", keywords: ["10a3"] },
  { id: "a_t3_11a1", name: "Phòng 11A1", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 732, y: 263, node: "node_a_t3_11a1", keywords: ["11a1"] },
  { id: "a_t3_11a2", name: "Phòng 11A2", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 806, y: 263, node: "node_a_t3_11a2", keywords: ["11a2"] },
  { id: "a_t3_11a3", name: "Phòng 11A3", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 934, y: 263, node: "node_a_t3_11a3", keywords: ["11a3"] },
  { id: "a_t3_11a4", name: "Phòng 11A4", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 994, y: 263, node: "node_a_t3_11a4", keywords: ["11a4"] },
  { id: "wc_a_t3_left", name: "WC Dãy A Trái (T3)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 423, y: 263, node: "node_a_t3_wc_l", keywords: ["wc"] },
  { id: "wc_a_t3_right", name: "WC Dãy A Phải (T3)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 3", x: 1045, y: 263, node: "node_a_t3_wc_r", keywords: ["wc"] },
  // Tầng 2
  { id: "a_t2_10a6", name: "Phòng 10A6", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 474, y: 301, node: "node_a_t2_10a6", keywords: ["10a6"] },
  { id: "a_t2_10a5", name: "Phòng 10A5", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 534, y: 301, node: "node_a_t2_10a5", keywords: ["10a5"] },
  { id: "a_t2_10a4", name: "Phòng 10A4", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 658, y: 301, node: "node_a_t2_10a4", keywords: ["10a4"] },
  { id: "a_t2_11a8", name: "Phòng 11A8", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 732, y: 301, node: "node_a_t2_11a8", keywords: ["11a8"] },
  { id: "a_t2_11a7", name: "Phòng 11A7", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 806, y: 301, node: "node_a_t2_11a7", keywords: ["11a7"] },
  { id: "a_t2_11a6", name: "Phòng 11A6", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 934, y: 301, node: "node_a_t2_11a6", keywords: ["11a6"] },
  { id: "a_t2_11a5", name: "Phòng 11A5", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 994, y: 301, node: "node_a_t2_11a5", keywords: ["11a5"] },
  { id: "wc_a_t2_left", name: "WC Dãy A Trái (T2)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 423, y: 301, node: "node_a_t2_wc_l", keywords: ["wc"] },
  { id: "wc_a_t2_right", name: "WC Dãy A Phải (T2)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng 2", x: 1045, y: 301, node: "node_a_t2_wc_r", keywords: ["wc"] },
  // Tầng trệt
  { id: "a_tret_10a7", name: "Phòng 10A7", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 474, y: 339, node: "node_a_tret_10a7", keywords: ["10a7"] },
  { id: "a_tret_10a8", name: "Phòng 10A8", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 534, y: 339, node: "node_a_tret_10a8", keywords: ["10a8"] },
  { id: "a_tret_thu_vien", name: "Thư Viện", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 732, y: 339, node: "node_a_tret_tv", keywords: ["thư viện", "sách", "đọc sách"] },
  { id: "a_tret_11a9", name: "Phòng 11A9", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 934, y: 339, node: "node_a_tret_11a9", keywords: ["11a9"] },
  { id: "a_tret_11a10", name: "Phòng 11A10", category: "classroom", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 994, y: 339, node: "node_a_tret_11a10", keywords: ["11a10"] },
  { id: "wc_a_tret_left", name: "WC Dãy A Trái (Trệt)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 423, y: 339, node: "node_a_tret_wc_l", keywords: ["wc"] },
  { id: "wc_a_tret_right", name: "WC Dãy A Phải (Trệt)", category: "facility", building: "Dãy A (Trên cùng)", floor: "Tầng trệt", x: 1045, y: 339, node: "node_a_tret_wc_r", keywords: ["wc"] },
  { id: "cau_thang_a1", name: "Cầu thang A1 (Trái)", category: "stair", building: "Dãy A (Trên cùng)", floor: "Cầu thang", x: 593, y: 282, node: "node_a1_stair_tret", keywords: ["cầu thang a1"] },
  { id: "cau_thang_a2", name: "Cầu thang A2 (Phải)", category: "stair", building: "Dãy A (Trên cùng)", floor: "Cầu thang", x: 873, y: 282, node: "node_a2_stair_tret", keywords: ["cầu thang a2"] },

  // --- VỊ TRÍ ĐỂ XE HỌC SINH CỔNG TRƯỚC ---
  { id: "park_10a1", name: "Vị trí để xe 10A1", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 987, y: 938, node: "node_pk_10a1", keywords: ["xe 10a1", "nhà xe 10a1"] },
  { id: "park_10a2", name: "Vị trí để xe 10A2", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1030, y: 938, node: "node_pk_10a2", keywords: ["xe 10a2", "nhà xe 10a2"] },
  { id: "park_10a3", name: "Vị trí để xe 10A3", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1074, y: 938, node: "node_pk_10a3", keywords: ["xe 10a3", "nhà xe 10a3"] },
  { id: "park_10a4", name: "Vị trí để xe 10A4", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1118, y: 938, node: "node_pk_10a4", keywords: ["xe 10a4", "nhà xe 10a4"] },
  { id: "park_10a5", name: "Vị trí để xe 10A5", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1161, y: 938, node: "node_pk_10a5", keywords: ["xe 10a5", "nhà xe 10a5"] },
  { id: "park_10a6", name: "Vị trí để xe 10A6", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1205, y: 938, node: "node_pk_10a6", keywords: ["xe 10a6", "nhà xe 10a6"] },
  { id: "park_10a7", name: "Vị trí để xe 10A7", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1248, y: 938, node: "node_pk_10a7", keywords: ["xe 10a7", "nhà xe 10a7"] },
  { id: "park_10a8", name: "Vị trí để xe 10A8", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1292, y: 938, node: "node_pk_10a8", keywords: ["xe 10a8", "nhà xe 10a8"] },
  { id: "park_10a9", name: "Vị trí để xe 10A9", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1336, y: 938, node: "node_pk_10a9", keywords: ["xe 10a9", "nhà xe 10a9"] },
  { id: "park_10a10", name: "Vị trí để xe 10A10", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1379, y: 938, node: "node_pk_10a10", keywords: ["xe 10a10", "nhà xe 10a10"] },
  { id: "park_10a11", name: "Vị trí để xe 10A11", category: "parking", building: "Nhà xe Cổng trước", floor: "Mặt đất", x: 1423, y: 938, node: "node_pk_10a11", keywords: ["xe 10a11", "nhà xe 10a11"] },

  // --- VỊ TRÍ ĐỂ XE PHÍA ĐÔNG & PHÍA BẮC ---
  { id: "park_10a12", name: "Vị trí để xe 10A12", category: "parking", building: "Khu vực Xe phía Đông", floor: "Mặt đất", x: 1498, y: 728, node: "node_pk_10a12", keywords: ["xe 10a12", "nhà xe 10a12"] },
  { id: "park_11a1", name: "Vị trí để xe 11A1", category: "parking", building: "Khu vực Xe phía Đông", floor: "Mặt đất", x: 1498, y: 355, node: "node_pk_11a1", keywords: ["xe 11a1"] },
  { id: "park_11a2", name: "Vị trí để xe 11A2", category: "parking", building: "Khu vực Xe phía Đông", floor: "Mặt đất", x: 1498, y: 198, node: "node_pk_11a2", keywords: ["xe 11a2"] },
  { id: "park_11a3", name: "Vị trí để xe 11A3", category: "parking", building: "Dãy xe Nhà lợp tôn", floor: "Mặt đất", x: 1246, y: 144, node: "node_pk_11a3", keywords: ["xe 11a3", "nhà lợp tôn"] },
  { id: "park_11a5", name: "Vị trí để xe 11A5", category: "parking", building: "Dãy xe Nhà lợp tôn", floor: "Mặt đất", x: 1041, y: 144, node: "node_pk_11a5", keywords: ["xe 11a5", "nhà lợp tôn"] },
  { id: "park_11a6", name: "Vị trí để xe 11A6", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 839, y: 144, node: "node_pk_11a6", keywords: ["xe 11a6"] },
  { id: "park_11a7", name: "Vị trí để xe 11A7", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 753, y: 144, node: "node_pk_11a7", keywords: ["xe 11a7"] },
  { id: "park_11a8", name: "Vị trí để xe 11A8", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 667, y: 144, node: "node_pk_11a8", keywords: ["xe 11a8"] },
  { id: "park_12a1", name: "Vị trí để xe 12A1", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 581, y: 144, node: "node_pk_12a1", keywords: ["xe 12a1"] },
  { id: "park_12a2", name: "Vị trí để xe 12A2", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 495, y: 144, node: "node_pk_12a2", keywords: ["xe 12a2"] },
  { id: "park_12a3", name: "Vị trí để xe 12A3", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 409, y: 144, node: "node_pk_12a3", keywords: ["xe 12a3"] },
  { id: "park_12a4", name: "Vị trí để xe 12A4", category: "parking", building: "Dãy xe cạnh Cổng sau", floor: "Mặt đất", x: 323, y: 144, node: "node_pk_12a4", keywords: ["xe 12a4"] },
  { id: "park_12a5", name: "Vị trí để xe 12A5", category: "parking", building: "Nhà xe gần Cổng sau", floor: "Mặt đất", x: 117, y: 111, node: "node_pk_12a5", keywords: ["xe 12a5"] },
  { id: "park_12a6", name: "Vị trí để xe 12A6", category: "parking", building: "Nhà xe gần Cổng sau", floor: "Mặt đất", x: 117, y: 128, node: "node_pk_12a6", keywords: ["xe 12a6"] },
  { id: "park_12a7", name: "Vị trí để xe 12A7", category: "parking", building: "Nhà xe gần Cổng sau", floor: "Mặt đất", x: 117, y: 145, node: "node_pk_12a7", keywords: ["xe 12a7"] },
  { id: "park_12a8", name: "Vị trí để xe 12A8", category: "parking", building: "Nhà xe gần Cổng sau", floor: "Mặt đất", x: 117, y: 162, node: "node_pk_12a8", keywords: ["xe 12a8"] },

  // --- VỊ TRÍ ĐỂ XE PHÍA TÂY & KHU VỰC HỘI TRƯỜNG ---
  { id: "park_10a13", name: "Vị trí để xe 10A13", category: "parking", building: "Khu vực Hội Trường", floor: "Mặt đất", x: 1057, y: 684, node: "node_pk_10a13", keywords: ["xe 10a13", "10a13"] },
  { id: "park_12a9", name: "Vị trí để xe 12A9", category: "parking", building: "Dãy để xe học sinh phía Tây", floor: "Mặt đất", x: 65, y: 373, node: "node_pk_12a9", keywords: ["xe 12a9"] },
  { id: "park_12a10", name: "Vị trí để xe 12A10", category: "parking", building: "Dãy để xe học sinh phía Tây", floor: "Mặt đất", x: 65, y: 618, node: "node_pk_12a10", keywords: ["xe 12a10"] }
];

// ============================================================================
// 2. MẠNG LƯỚI ĐỈNH ĐỒ THỊ CHUẨN HÀNH LANG (CAMPUS_GRAPH_NODES)
// ============================================================================
const CAMPUS_GRAPH_NODES = {
  // === CỔNG & KHU VỰC SÂN ===
  "node_cong_truong": { x: 684, y: 997, name: "Cổng Trường", floor: "Mặt đất" },
  "node_nga_re_cong": { x: 684, y: 938, name: "Ngã ba đường nội bộ trước Cổng", floor: "Mặt đất" },
  "node_truc_cong_bac": { x: 684, y: 777, name: "Trục sân trước Cột Cờ", floor: "Mặt đất" },
  "node_cot_co_entry": { x: 755, y: 777, name: "Lối vào Cột Cờ", floor: "Mặt đất" },
  "node_cot_co": { x: 755, y: 780, name: "Cột Cờ (Sân trường)", floor: "Mặt đất" },
  "node_mai_tam_giac": { x: 755, y: 612, name: "Mái Tam Giác (Sảnh trung tâm)", floor: "Mặt đất" },

  // === HÀNH LANG KẾT NỐI CHÍNH (COVERED CORRIDORS) ===
  // Trục dọc Tây (X = 595)
  "node_hl_a_west": { x: 595, y: 378, name: "Hành lang Dãy A (giao trục Tây)", floor: "Tầng trệt" },
  "node_hl_west_mid": { x: 595, y: 612, name: "Ngã tư hành lang Tây - Dãy B", floor: "Tầng trệt" },
  "node_hl_west_south": { x: 595, y: 777, name: "Hành lang Tây - Dãy Hành Chính", floor: "Tầng trệt" },

  // Trục dọc Đông (X = 873)
  "node_hl_a_east": { x: 873, y: 378, name: "Hành lang Dãy A (giao trục Đông)", floor: "Tầng trệt" },
  "node_hl_east_mid": { x: 873, y: 612, name: "Ngã ba hành lang Đông - Bộ Môn", floor: "Tầng trệt" },

  // Trục dọc Hội Trường (X = 928)
  "node_hl_ht_612": { x: 928, y: 612, name: "Đầu hành lang Hội Trường", floor: "Tầng trệt" },
  "node_hl_ht_684": { x: 928, y: 684, name: "Lối rẽ vào bãi xe 10A13", floor: "Mặt đất" },
  "node_hl_ht_721": { x: 928, y: 721, name: "Lối rẽ vào WC Hội Trường", floor: "Tầng trệt" },
  "node_hl_ht_775": { x: 928, y: 775, name: "Cửa vào Hội Trường", floor: "Tầng trệt" },
  "node_hl_ht_south": { x: 928, y: 777, name: "Hành lang Nam Hội Trường", floor: "Tầng trệt" },
  "node_hoi_truong": { x: 1080, y: 775, name: "Hội Trường", floor: "Tầng trệt" },
  "node_wc_hoi_truong": { x: 1183, y: 721, name: "WC Hội Trường", floor: "Tầng trệt" },
  "node_pk_10a13": { x: 1057, y: 684, name: "Vị trí để xe 10A13", floor: "Mặt đất" },

  // === DÃY A (TRÊN CÙNG: KHỐI 10 & 11 & THƯ VIỆN) ===
  // Tầng trệt (Y = 378 là hành lang, Y = 339 là phòng)
  "node_a_tret_wc_l": { x: 423, y: 378, name: "WC Dãy A Trái (Trệt)", floor: "Tầng trệt" },
  "node_a_tret_10a7": { x: 474, y: 378, name: "Phòng 10A7", floor: "Tầng trệt" },
  "node_a_tret_10a8": { x: 534, y: 378, name: "Phòng 10A8", floor: "Tầng trệt" },
  "node_a1_stair_tret": { x: 593, y: 378, name: "Chân Cầu thang A1 (Trệt)", floor: "Tầng trệt" },
  "node_a_tret_tv": { x: 732, y: 378, name: "Thư Viện trường", floor: "Tầng trệt" },
  "node_a2_stair_tret": { x: 873, y: 378, name: "Chân Cầu thang A2 (Trệt)", floor: "Tầng trệt" },
  "node_a_tret_11a9": { x: 934, y: 378, name: "Phòng 11A9", floor: "Tầng trệt" },
  "node_a_tret_11a10": { x: 994, y: 378, name: "Phòng 11A10", floor: "Tầng trệt" },
  "node_a_tret_wc_r": { x: 1045, y: 378, name: "WC Dãy A Phải (Trệt)", floor: "Tầng trệt" },

  // Cầu thang A1 (X = 593)
  "node_a1_stair_t2": { x: 593, y: 301, name: "Cầu thang A1 (T2)", floor: "Tầng 2" },
  "node_a1_stair_t3": { x: 593, y: 263, name: "Cầu thang A1 (T3)", floor: "Tầng 3" },
  "node_a1_stair_t4": { x: 593, y: 225, name: "Đỉnh Cầu thang A1 (T4)", floor: "Tầng 4" },

  // Cầu thang A2 (X = 873 - Thẳng hàng với trục Hành lang Dọc Đông)
  "node_a2_stair_t2": { x: 873, y: 301, name: "Cầu thang A2 (T2)", floor: "Tầng 2" },
  "node_a2_stair_t3": { x: 873, y: 263, name: "Cầu thang A2 (T3)", floor: "Tầng 3" },
  "node_a2_stair_t4": { x: 873, y: 225, name: "Đỉnh Cầu thang A2 (T4)", floor: "Tầng 4" },

  // Tầng 2 Dãy A (Y = 301)
  "node_a_t2_wc_l": { x: 423, y: 301, name: "WC Dãy A Trái (T2)", floor: "Tầng 2" },
  "node_a_t2_10a6": { x: 474, y: 301, name: "Phòng 10A6", floor: "Tầng 2" },
  "node_a_t2_10a5": { x: 534, y: 301, name: "Phòng 10A5", floor: "Tầng 2" },
  "node_a_t2_10a4": { x: 658, y: 301, name: "Phòng 10A4", floor: "Tầng 2" },
  "node_a_t2_11a8": { x: 732, y: 301, name: "Phòng 11A8", floor: "Tầng 2" },
  "node_a_t2_11a7": { x: 806, y: 301, name: "Phòng 11A7", floor: "Tầng 2" },
  "node_a_t2_11a6": { x: 934, y: 301, name: "Phòng 11A6", floor: "Tầng 2" },
  "node_a_t2_11a5": { x: 994, y: 301, name: "Phòng 11A5", floor: "Tầng 2" },
  "node_a_t2_wc_r": { x: 1045, y: 301, name: "WC Dãy A Phải (T2)", floor: "Tầng 2" },

  // Tầng 3 Dãy A (Y = 263)
  "node_a_t3_wc_l": { x: 423, y: 263, name: "WC Dãy A Trái (T3)", floor: "Tầng 3" },
  "node_a_t3_10a1": { x: 474, y: 263, name: "Phòng 10A1", floor: "Tầng 3" },
  "node_a_t3_10a2": { x: 534, y: 263, name: "Phòng 10A2", floor: "Tầng 3" },
  "node_a_t3_10a3": { x: 658, y: 263, name: "Phòng 10A3", floor: "Tầng 3" },
  "node_a_t3_11a1": { x: 732, y: 263, name: "Phòng 11A1", floor: "Tầng 3" },
  "node_a_t3_11a2": { x: 806, y: 263, name: "Phòng 11A2", floor: "Tầng 3" },
  "node_a_t3_11a3": { x: 934, y: 263, name: "Phòng 11A3", floor: "Tầng 3" },
  "node_a_t3_11a4": { x: 994, y: 263, name: "Phòng 11A4", floor: "Tầng 3" },
  "node_a_t3_wc_r": { x: 1045, y: 263, name: "WC Dãy A Phải (T3)", floor: "Tầng 3" },

  // Tầng 4 Dãy A (Y = 225)
  "node_a_t4_wc_l": { x: 423, y: 225, name: "WC Dãy A Trái (T4)", floor: "Tầng 4" },
  "node_a_t4_10a13": { x: 806, y: 225, name: "Phòng 10A13", floor: "Tầng 4" },
  "node_a_t4_10a12": { x: 934, y: 225, name: "Phòng 10A12", floor: "Tầng 4" },
  "node_a_t4_10a11": { x: 994, y: 225, name: "Phòng 10A11", floor: "Tầng 4" },
  "node_a_t4_wc_r": { x: 1045, y: 225, name: "WC Dãy A Phải (T4)", floor: "Tầng 4" },

  // === DÃY B (KHỐI 12 - GIỮA BÊN TRÁI) ===
  // Tầng trệt (Y = 612 là hành lang)
  "node_b_exit_west": { x: 140, y: 612, name: "Lối thoát hiểm Tây Dãy B", floor: "Tầng trệt" },
  "node_b_tret_wc": { x: 223, y: 612, name: "WC Dãy B (Trệt)", floor: "Tầng trệt" },
  "node_b_tret_12a7": { x: 274, y: 612, name: "Phòng 12A7", floor: "Tầng trệt" },
  "node_b_tret_12a8": { x: 334, y: 612, name: "Phòng 12A8", floor: "Tầng trệt" },
  "node_b_stair_tret": { x: 388, y: 612, name: "Chân Cầu thang B (Trệt)", floor: "Tầng trệt" },
  "node_b_tret_12a9": { x: 442, y: 612, name: "Phòng 12A9", floor: "Tầng trệt" },
  "node_b_tret_12a10": { x: 502, y: 612, name: "Phòng 12A10", floor: "Tầng trệt" },

  // Cầu thang Dãy B (X = 388)
  "node_b_stair_t2": { x: 388, y: 536, name: "Cầu thang B (T2)", floor: "Tầng 2" },
  "node_b_stair_t3": { x: 388, y: 498, name: "Cầu thang B (T3)", floor: "Tầng 3" },
  "node_b_stair_t4": { x: 388, y: 460, name: "Cầu thang B (T4)", floor: "Tầng 4" },

  // Tầng 2 Dãy B (Y = 536)
  "node_b_t2_wc": { x: 223, y: 536, name: "WC Dãy B (T2)", floor: "Tầng 2" },
  "node_b_t2_12a3": { x: 274, y: 536, name: "Phòng 12A3", floor: "Tầng 2" },
  "node_b_t2_12a4": { x: 334, y: 536, name: "Phòng 12A4", floor: "Tầng 2" },
  "node_b_t2_12a5": { x: 442, y: 536, name: "Phòng 12A5", floor: "Tầng 2" },
  "node_b_t2_12a6": { x: 502, y: 536, name: "Phòng 12A6", floor: "Tầng 2" },

  // Tầng 3 Dãy B (Y = 498)
  "node_b_t3_wc": { x: 223, y: 498, name: "WC Dãy B (T3)", floor: "Tầng 3" },
  "node_b_t3_12a1": { x: 274, y: 498, name: "Phòng 12A1", floor: "Tầng 3" },
  "node_b_t3_12a2": { x: 334, y: 498, name: "Phòng 12A2", floor: "Tầng 3" },
  "node_b_t3_10a10": { x: 442, y: 498, name: "Phòng 10A10", floor: "Tầng 3" },
  "node_b_t3_10a9": { x: 502, y: 498, name: "Phòng 10A9", floor: "Tầng 3" },

  // Tầng 4 Dãy B (Y = 460)
  "node_b_t4_wc": { x: 223, y: 460, name: "WC Dãy B (T4)", floor: "Tầng 4" },

  // === DÃY BỘ MÔN / CHỨC NĂNG (GIỮA BÊN PHẢI) ===
  // Tầng trệt (Y = 612 là hành lang)
  "node_bm_stair_tret": { x: 928, y: 612, name: "Chân Cầu thang Bộ Môn", floor: "Tầng trệt" },
  "node_bm_tret_yte": { x: 988, y: 612, name: "Phòng Y Tế", floor: "Tầng trệt" },
  "node_bm_tret_ly": { x: 1070, y: 612, name: "Phòng Thí nghiệm Lý", floor: "Tầng trệt" },
  "node_bm_tret_hoa": { x: 1170, y: 612, name: "Phòng Thí nghiệm Hóa", floor: "Tầng trệt" },

  // Cầu thang Bộ Môn (X = 928)
  "node_bm_stair_t2": { x: 928, y: 536, name: "Cầu thang Bộ Môn (T2)", floor: "Tầng 2" },
  "node_bm_stair_t3": { x: 928, y: 498, name: "Cầu thang Bộ Môn (T3)", floor: "Tầng 3" },
  "node_bm_stair_t4": { x: 928, y: 460, name: "Cầu thang Bộ Môn (T4)", floor: "Tầng 4" },

  // Tầng 2 Bộ Môn (Y = 536)
  "node_bm_t2_doan": { x: 1048, y: 536, name: "VP Đoàn Thanh Niên", floor: "Tầng 2" },
  "node_bm_t2_tin1": { x: 1108, y: 536, name: "Phòng Tin 1", floor: "Tầng 2" },
  "node_bm_t2_tin2": { x: 1178, y: 536, name: "Phòng Tin 2", floor: "Tầng 2" },

  // Tầng 3 Bộ Môn (Y = 498)
  "node_bm_t3_may1": { x: 1108, y: 498, name: "Phòng Máy 1", floor: "Tầng 3" },
  "node_bm_t3_may2": { x: 1178, y: 498, name: "Phòng Máy 2", floor: "Tầng 3" },

  // Tầng 4 Bộ Môn (Y = 460)
  "node_bm_t4_tin4": { x: 1108, y: 460, name: "Phòng Tin 4", floor: "Tầng 4" },
  "node_bm_t4_av": { x: 1178, y: 460, name: "Phòng Anh văn", floor: "Tầng 4" },

  // === DÃY HÀNH CHÍNH (HIỆU BỘ - DƯỚI BÊN TRÁI) ===
  // Tầng trệt (Y = 777 là hành lang)
  "node_hc_tret_wc": { x: 138, y: 777, name: "WC Hành chính Trệt", floor: "Tầng trệt" },
  "node_hc_tret_p1": { x: 183, y: 777, name: "Phòng hồ sơ 1", floor: "Tầng trệt" },
  "node_hc_tret_p2": { x: 237, y: 777, name: "Phòng hồ sơ 2", floor: "Tầng trệt" },
  "node_hc_stair_tret": { x: 284, y: 777, name: "Chân Cầu thang HC", floor: "Tầng trệt" },
  "node_hc_tret_pht": { x: 331, y: 777, name: "Phòng Phó HT", floor: "Tầng trệt" },
  "node_hc_tret_tt": { x: 373, y: 777, name: "Phòng Truyền thống", floor: "Tầng trệt" },
  "node_hc_tret_td": { x: 401, y: 777, name: "Phòng Tiếp dân", floor: "Tầng trệt" },
  "node_hl_hc_east": { x: 442, y: 777, name: "Hành lang Dãy Hành chính (Phía Đông)", floor: "Tầng trệt" },

  // Hành lang nối giữa Tòa 3 và Tòa GV (thẳng đối diện cửa lớp 12A9)
  "node_hl_connect_b_hc": { x: 442, y: 695, name: "Hành lang nối Tòa 3 - Tòa GV", floor: "Tầng trệt" },
  "node_hl_connect_b_hc_t2": { x: 442, y: 616, name: "Cầu hành lang nối Tầng 2 (Tòa 3 - Tòa GV)", floor: "Tầng 2" },

  // Lối vào sảnh Hành chính & Kết nối sân trước
  "node_hc_sanh_truoc": { x: 284, y: 835, name: "Lối vào Sảnh Dãy Hành Chính", floor: "Mặt đất" },
  "node_duong_xe_hc": { x: 284, y: 938, name: "Đường nội bộ trước Dãy Hành Chính", floor: "Mặt đất" },
  "node_san_truoc_hc": { x: 684, y: 835, name: "Sân trước Cổng", floor: "Mặt đất" },

  // Cầu thang Hành chính
  "node_hc_stair_t2": { x: 284, y: 697, name: "Đỉnh Cầu thang HC (T2)", floor: "Tầng 2" },

  // Tầng 2 Hành chính (Y = 697)
  "node_hc_t2_wc": { x: 138, y: 697, name: "WC Hành chính T2", floor: "Tầng 2" },
  "node_hc_t2_ht": { x: 183, y: 697, name: "Phòng Hiệu trưởng", floor: "Tầng 2" },
  "node_hc_t2_vt": { x: 237, y: 697, name: "Phòng Văn thư", floor: "Tầng 2" },
  "node_hc_t2_kt": { x: 331, y: 697, name: "Phòng Kế toán", floor: "Tầng 2" },
  "node_hc_t2_cb": { x: 387, y: 697, name: "Phòng Chi bộ", floor: "Tầng 2" },

  // === NHÀ XE & ĐƯỜNG NGOẠI VI (RING ROADS) ===
  // Nhà xe GV (góc Tây Nam)
  "node_truoc_nha_xe_gv": { x: 169, y: 938, name: "Đường trước Nhà xe GV", floor: "Mặt đất" },
  "node_nha_xe_gv": { x: 169, y: 909, name: "Nhà xe giáo viên", floor: "Mặt đất" },
  "node_khuc_cua_gv": { x: 112, y: 938, name: "Khúc cua Nhà xe GV", floor: "Mặt đất" },
  "node_khuc_cua_tn": { x: 112, y: 835, name: "Khúc cua Tây Nam", floor: "Mặt đất" },
  "node_goc_xe_tay_nam": { x: 65, y: 835, name: "Đường xe phía Tây Nam", floor: "Mặt đất" },

  // Đường xe phía Tây (X = 65)
  "node_pk_12a10": { x: 65, y: 618, name: "Vị trí để xe 12A10", floor: "Mặt đất" },
  "node_loi_ra_day_b": { x: 65, y: 612, name: "Lối ra Dãy B sang bãi xe Tây", floor: "Mặt đất" },
  "node_pk_12a9": { x: 65, y: 373, name: "Vị trí để xe 12A9", floor: "Mặt đất" },
  "node_goc_xe_tay_bac": { x: 65, y: 186, name: "Góc cua nhà xe phía Tây Bắc", floor: "Mặt đất" },

  // Đường xe Cổng sau & phía Bắc (Y = 186)
  "node_khuc_cua_tb": { x: 117, y: 186, name: "Đường xe Cổng sau", floor: "Mặt đất" },
  "node_pk_12a8": { x: 117, y: 162, name: "Ô xe 12A8", floor: "Mặt đất" },
  "node_pk_12a7": { x: 117, y: 145, name: "Ô xe 12A7", floor: "Mặt đất" },
  "node_pk_12a6": { x: 117, y: 128, name: "Ô xe 12A6", floor: "Mặt đất" },
  "node_pk_12a5": { x: 117, y: 111, name: "Ô xe 12A5", floor: "Mặt đất" },

  "node_pk_12a4": { x: 323, y: 144, name: "Ô xe 12A4", floor: "Mặt đất" },
  "node_rd_12a4": { x: 323, y: 186, name: "Đường trước ô 12A4", floor: "Mặt đất" },
  "node_pk_12a3": { x: 409, y: 144, name: "Ô xe 12A3", floor: "Mặt đất" },
  "node_rd_12a3": { x: 409, y: 186, name: "Đường trước ô 12A3", floor: "Mặt đất" },
  "node_pk_12a2": { x: 495, y: 144, name: "Ô xe 12A2", floor: "Mặt đất" },
  "node_rd_12a2": { x: 495, y: 186, name: "Đường trước ô 12A2", floor: "Mặt đất" },
  "node_pk_12a1": { x: 581, y: 144, name: "Ô xe 12A1", floor: "Mặt đất" },
  "node_rd_12a1": { x: 581, y: 186, name: "Đường trước ô 12A1", floor: "Mặt đất" },
  "node_pk_11a8": { x: 667, y: 144, name: "Ô xe 11A8", floor: "Mặt đất" },
  "node_rd_11a8": { x: 667, y: 186, name: "Đường trước ô 11A8", floor: "Mặt đất" },
  "node_pk_11a7": { x: 753, y: 144, name: "Ô xe 11A7", floor: "Mặt đất" },
  "node_rd_11a7": { x: 753, y: 186, name: "Đường trước ô 11A7", floor: "Mặt đất" },
  "node_pk_11a6": { x: 839, y: 144, name: "Ô xe 11A6", floor: "Mặt đất" },
  "node_rd_11a6": { x: 839, y: 186, name: "Đường trước ô 11A6", floor: "Mặt đất" },
  "node_pk_11a5": { x: 1041, y: 144, name: "Ô xe 11A5", floor: "Mặt đất" },
  "node_rd_11a5": { x: 1041, y: 186, name: "Đường trước ô 11A5", floor: "Mặt đất" },
  "node_pk_11a3": { x: 1246, y: 144, name: "Ô xe 11A3", floor: "Mặt đất" },
  "node_rd_11a3": { x: 1246, y: 186, name: "Đường trước ô 11A3", floor: "Mặt đất" },
  "node_goc_xe_dong_bac": { x: 1498, y: 186, name: "Khúc cua Đông Bắc", floor: "Mặt đất" },

  // Đường xe phía Đông (X = 1498)
  "node_pk_11a2": { x: 1498, y: 198, name: "Ô xe 11A2", floor: "Mặt đất" },
  "node_pk_11a1": { x: 1498, y: 355, name: "Ô xe 11A1", floor: "Mặt đất" },
  "node_pk_10a12": { x: 1498, y: 728, name: "Ô xe 10A12", floor: "Mặt đất" },
  "node_goc_xe_dong_nam": { x: 1498, y: 938, name: "Khúc cua Đông Nam", floor: "Mặt đất" },

  // Nhà xe học sinh Cổng trước (Y = 938)
  "node_pk_10a1": { x: 987, y: 938, name: "Ô xe 10A1", floor: "Mặt đất" },
  "node_pk_10a2": { x: 1030, y: 938, name: "Ô xe 10A2", floor: "Mặt đất" },
  "node_pk_10a3": { x: 1074, y: 938, name: "Ô xe 10A3", floor: "Mặt đất" },
  "node_pk_10a4": { x: 1118, y: 938, name: "Ô xe 10A4", floor: "Mặt đất" },
  "node_pk_10a5": { x: 1161, y: 938, name: "Ô xe 10A5", floor: "Mặt đất" },
  "node_pk_10a6": { x: 1205, y: 938, name: "Ô xe 10A6", floor: "Mặt đất" },
  "node_pk_10a7": { x: 1248, y: 938, name: "Ô xe 10A7", floor: "Mặt đất" },
  "node_pk_10a8": { x: 1292, y: 938, name: "Ô xe 10A8", floor: "Mặt đất" },
  "node_pk_10a9": { x: 1336, y: 938, name: "Ô xe 10A9", floor: "Mặt đất" },
  "node_pk_10a10": { x: 1379, y: 938, name: "Ô xe 10A10", floor: "Mặt đất" },
  "node_pk_10a11": { x: 1423, y: 938, name: "Ô xe 10A11", floor: "Mặt đất" }
};

// ============================================================================
// 3. MẠNG CẠNH ĐỒ THỊ ĐI THEO HÀNH LANG & CẦU THANG (CAMPUS_GRAPH_EDGES)
// ============================================================================
const CAMPUS_GRAPH_EDGES = [
  // --- CỔNG VÀO & TRỤC CHÍNH SÂN TRƯỜNG ---
  { from: "node_cong_truong", to: "node_nga_re_cong", desc: "Đi qua Cổng Trường vào ngã rẽ nội bộ" },
  { from: "node_nga_re_cong", to: "node_san_truoc_hc", desc: "Đi thẳng trục sân trước" },
  { from: "node_san_truoc_hc", to: "node_truc_cong_bac", desc: "Đi thẳng trục chính sân trường hướng về Cột Cờ" },
  { from: "node_san_truoc_hc", to: "node_hc_sanh_truoc", desc: "Rẽ trái đi ngang sân vào Lối vào Dãy Hành Chính" },
  { from: "node_truc_cong_bac", to: "node_cot_co_entry", desc: "Đi thẳng vào khu vực Cột Cờ trung tâm" },
  { from: "node_cot_co_entry", to: "node_cot_co", desc: "Đến chân Cột Cờ" },

  // --- TRỤC HÀNH LANG NAM (Y = 777) & KẾT NỐI SÂN TRƯỜNG ---
  { from: "node_truc_cong_bac", to: "node_hl_hc_east", desc: "Rẽ trái đi ngang qua sân về phía hành lang Dãy Hành Chính" },
  { from: "node_san_truoc_hc", to: "node_hl_hc_east", desc: "Đi ngang qua sân trước về phía hành lang Dãy Hành Chính" },
  { from: "node_cot_co_entry", to: "node_hl_ht_south", desc: "Rẽ phải đi theo hành lang về phía Hội Trường" },

  // --- TRỤC HÀNH LANG DỌC TÂY (X = 595: TỪ DÃY A XUỐNG DÃY B & SÂN TRƯỚC) ---
  { from: "node_hl_west_mid", to: "node_hl_a_west", desc: "Đi dọc theo Hành lang Tây lên Dãy A" },
  { from: "node_hl_west_mid", to: "node_hl_west_south", desc: "Đi dọc theo Hành lang Tây xuống phía Nam" },
  { from: "node_hl_west_south", to: "node_truc_cong_bac", desc: "Từ Hành lang Tây rẽ ra trục sân trước Cột Cờ" },
  { from: "node_hl_west_south", to: "node_san_truoc_hc", desc: "Đi từ Hành lang Tây ra sân trước Dãy Hành Chính" },

  // --- TRỤC HÀNH LANG DỌC ĐÔNG (X = 873: TỪ DÃY A XUỐNG DÃY BỘ MÔN) ---
  { from: "node_hl_a_east", to: "node_hl_east_mid", desc: "Đi dọc theo Hành lang Đông từ Dãy A xuống Dãy Bộ Môn" },

  // --- TRỤC HÀNH LANG NGANG TRUNG TÂM (Y = 612: NỐI TÂY - MÁI TAM GIÁC - ĐÔNG) ---
  { from: "node_b_tret_12a10", to: "node_hl_west_mid", desc: "Đi tiếp qua sảnh Mái Tam Giác" },
  { from: "node_hl_west_mid", to: "node_mai_tam_giac", desc: "Đi thẳng theo hành lang ra sảnh Mái Tam Giác" },
  { from: "node_mai_tam_giac", to: "node_hl_east_mid", desc: "Đi tiếp qua sảnh Mái Tam Giác sang Hành lang Đông" },

  // --- HÀNH LANG NỐI TÒA 3 (ĐỐI DIỆN CỬA 12A9) SANG TÒA GIÁO VIÊN ---
  { from: "node_b_tret_12a9", to: "node_hl_connect_b_hc", desc: "Từ trước Phòng 12A9 rẽ vào Hành lang nối sang Tòa GV" },
  { from: "node_hl_connect_b_hc", to: "node_hl_hc_east", desc: "Đi thẳng theo Hành lang nối sang Dãy Hành chính" },
  { from: "node_hl_hc_east", to: "node_hc_tret_td", desc: "Vào hành lang Dãy Hành chính đến Phòng Tiếp dân" },
  { from: "node_hc_tret_td", to: "node_hc_tret_tt", desc: "Đi tiếp qua Phòng Truyền thống" },
  { from: "node_hc_tret_tt", to: "node_hc_tret_pht", desc: "Đi qua Phòng Phó Hiệu Trưởng" },
  { from: "node_hc_tret_pht", to: "node_hc_stair_tret", desc: "Đến Cầu thang Dãy Hành Chính (Trệt)" },
  { from: "node_hc_stair_tret", to: "node_hc_tret_p2", desc: "Đi tiếp qua Phòng hồ sơ 2" },
  { from: "node_hc_tret_p2", to: "node_hc_tret_p1", desc: "Đi qua Phòng hồ sơ 1" },
  { from: "node_hc_tret_p1", to: "node_hc_tret_wc", desc: "Đến WC Dãy Hành Chính (Trệt)" },

  // Cầu thang Hành chính (X = 365)
  { from: "node_hc_stair_tret", to: "node_hc_stair_t2", desc: "Leo cầu thang bộ lên Tầng 2 Dãy Hành Chính" },

  // Lối vào sảnh Hành chính (vị trí mới khoanh tròn - kết nối sân trước & cầu thang)
  { from: "node_hc_sanh_truoc", to: "node_hc_stair_tret", desc: "Lên bậc tam cấp vào sảnh chính Dãy Hành Chính" },
  { from: "node_hc_sanh_truoc", to: "node_duong_xe_hc", desc: "Đi theo lối đi bộ ra đường nội bộ phía Nam" },
  { from: "node_hc_sanh_truoc", to: "node_khuc_cua_tn", desc: "Đi theo lối đi phía Tây về phía góc cua Tây Nam" },

  // Tầng 2 Hành chính (Y = 697)
  { from: "node_hc_stair_t2", to: "node_hc_t2_kt", desc: "Hành lang Tầng 2 đến Phòng Kế toán" },
  { from: "node_hc_t2_kt", to: "node_hc_t2_cb", desc: "Đi tiếp đến Phòng Chi bộ (Họp GV)" },
  { from: "node_hc_stair_t2", to: "node_hc_t2_vt", desc: "Hành lang Tầng 2 sang Phòng Văn thư" },
  { from: "node_hc_t2_vt", to: "node_hc_t2_ht", desc: "Đi tiếp đến Phòng Hiệu trưởng" },
  { from: "node_hc_t2_ht", to: "node_hc_t2_wc", desc: "Đến WC Tầng 2 Dãy Hành Chính" },

  // --- DÃY B (KHỐI 12 - TẦNG TRỆT: Y = 612) ---
  { from: "node_hl_west_mid", to: "node_b_tret_12a10", desc: "Đi vào hành lang Dãy B qua Phòng 12A10" },
  { from: "node_b_tret_12a10", to: "node_b_tret_12a9", desc: "Đi tiếp qua Phòng 12A9" },
  { from: "node_b_tret_12a9", to: "node_b_stair_tret", desc: "Đến Cầu thang Dãy B (Trệt)" },
  { from: "node_b_stair_tret", to: "node_b_tret_12a8", desc: "Đi tiếp qua Phòng 12A8" },
  { from: "node_b_tret_12a8", to: "node_b_tret_12a7", desc: "Đi tiếp qua Phòng 12A7" },
  { from: "node_b_tret_12a7", to: "node_b_tret_wc", desc: "Đi đến WC Dãy B (Trệt)" },
  { from: "node_b_tret_wc", to: "node_b_exit_west", desc: "Đi ra lối cửa thoát hiểm phía Tây" },
  { from: "node_b_exit_west", to: "node_loi_ra_day_b", desc: "Bước ra đường xe phía Tây" },

  // Cầu thang Dãy B (X = 388)
  { from: "node_b_stair_tret", to: "node_b_stair_t2", desc: "Leo cầu thang bộ lên Tầng 2 Dãy B" },
  { from: "node_b_stair_t2", to: "node_b_stair_t3", desc: "Leo tiếp cầu thang lên Tầng 3 Dãy B" },
  { from: "node_b_stair_t3", to: "node_b_stair_t4", desc: "Leo tiếp cầu thang lên Tầng 4 Dãy B" },

  // Tầng 2 Dãy B (Y = 536) & Cầu hành lang nối sang Tòa GV (Tầng 2)
  { from: "node_b_stair_t2", to: "node_b_t2_12a5", desc: "Hành lang Tầng 2 qua Phòng 12A5" },
  { from: "node_b_t2_12a5", to: "node_hl_connect_b_hc_t2", desc: "Từ trước Phòng 12A5 rẽ vào Cầu hành lang nối Tầng 2 sang Tòa GV" },
  { from: "node_hl_connect_b_hc_t2", to: "node_hc_t2_cb", desc: "Đi thẳng qua Cầu hành lang nối Tầng 2 đến Phòng Chi bộ Dãy Hành Chính" },
  { from: "node_b_t2_12a5", to: "node_b_t2_12a6", desc: "Đi tiếp đến Phòng 12A6" },
  { from: "node_b_stair_t2", to: "node_b_t2_12a4", desc: "Hành lang Tầng 2 qua Phòng 12A4" },
  { from: "node_b_t2_12a4", to: "node_b_t2_12a3", desc: "Đi tiếp qua Phòng 12A3" },
  { from: "node_b_t2_12a3", to: "node_b_t2_wc", desc: "Đi đến WC Dãy B (T2)" },

  // Tầng 3 Dãy B (Y = 498)
  { from: "node_b_stair_t3", to: "node_b_t3_10a10", desc: "Hành lang Tầng 3 qua Phòng 10A10" },
  { from: "node_b_t3_10a10", to: "node_b_t3_10a9", desc: "Đi tiếp đến Phòng 10A9" },
  { from: "node_b_stair_t3", to: "node_b_t3_12a2", desc: "Hành lang Tầng 3 qua Phòng 12A2" },
  { from: "node_b_t3_12a2", to: "node_b_t3_12a1", desc: "Đi tiếp qua Phòng 12A1" },
  { from: "node_b_t3_12a1", to: "node_b_t3_wc", desc: "Đi đến WC Dãy B (T3)" },

  // Tầng 4 Dãy B (Y = 460)
  { from: "node_b_stair_t4", to: "node_b_t4_wc", desc: "Hành lang Tầng 4 đến WC Dãy B (T4)" },

  // --- DÃY BỘ MÔN (GIỮA BÊN PHẢI - TẦNG TRỆT: Y = 612) ---
  { from: "node_hl_east_mid", to: "node_bm_stair_tret", desc: "Đi vào hành lang Dãy Bộ Môn đến Cầu thang" },
  { from: "node_bm_stair_tret", to: "node_bm_tret_yte", desc: "Đi tiếp qua Phòng Y Tế" },
  { from: "node_bm_tret_yte", to: "node_bm_tret_ly", desc: "Đi tiếp qua Phòng Thí nghiệm Lý" },
  { from: "node_bm_tret_ly", to: "node_bm_tret_hoa", desc: "Đi đến Phòng Thí nghiệm Hóa" },

  // Cầu thang Bộ Môn (X = 928)
  { from: "node_bm_stair_tret", to: "node_bm_stair_t2", desc: "Leo cầu thang bộ lên Tầng 2 Dãy Bộ Môn" },
  { from: "node_bm_stair_t2", to: "node_bm_stair_t3", desc: "Leo tiếp cầu thang lên Tầng 3 Dãy Bộ Môn" },
  { from: "node_bm_stair_t3", to: "node_bm_stair_t4", desc: "Leo tiếp cầu thang lên Tầng 4 Dãy Bộ Môn" },

  // Tầng 2 Bộ Môn (Y = 536)
  { from: "node_bm_stair_t2", to: "node_bm_t2_doan", desc: "Hành lang Tầng 2 đến VP Đoàn Thanh Niên" },
  { from: "node_bm_t2_doan", to: "node_bm_t2_tin1", desc: "Đi tiếp qua Phòng Tin 1" },
  { from: "node_bm_t2_tin1", to: "node_bm_t2_tin2", desc: "Đi đến Phòng Tin 2" },

  // Tầng 3 Bộ Môn (Y = 498)
  { from: "node_bm_stair_t3", to: "node_bm_t3_may1", desc: "Hành lang Tầng 3 đến Phòng Máy 1" },
  { from: "node_bm_t3_may1", to: "node_bm_t3_may2", desc: "Đi đến Phòng Máy 2" },

  // Tầng 4 Bộ Môn (Y = 460)
  { from: "node_bm_stair_t4", to: "node_bm_t4_tin4", desc: "Hành lang Tầng 4 đến Phòng Tin 4" },
  { from: "node_bm_t4_tin4", to: "node_bm_t4_av", desc: "Đi đến Phòng Anh văn" },

  // --- HỘI TRƯỜNG & KHU VỰC ĐỂ XE 10A13 (TRỤC DỌC X = 928) ---
  { from: "node_bm_stair_tret", to: "node_hl_ht_684", desc: "Đi dọc theo hành lang xuống khu vực Hội Trường" },
  { from: "node_hl_ht_684", to: "node_pk_10a13", desc: "Rẽ vào Vị trí để xe lớp 10A13" },
  { from: "node_hl_ht_684", to: "node_hl_ht_721", desc: "Đi tiếp dọc hành lang về phía Hội Trường" },
  { from: "node_hl_ht_721", to: "node_wc_hoi_truong", desc: "Rẽ vào WC Hội Trường" },
  { from: "node_hl_ht_721", to: "node_hl_ht_775", desc: "Đi thẳng đến trước cửa Hội Trường" },
  { from: "node_hl_ht_775", to: "node_hoi_truong", desc: "Bước vào trong Hội Trường" },
  { from: "node_hl_ht_775", to: "node_hl_ht_south", desc: "Đi ra ngã ba hành lang phía Nam" },

  // --- DÃY A (TRÊN CÙNG: KHỐI 10 & 11 & THƯ VIỆN) ---
  // Tầng trệt hành lang (Y = 378)
  { from: "node_a_tret_wc_l", to: "node_a_tret_10a7", desc: "Hành lang Trệt Dãy A qua Phòng 10A7" },
  { from: "node_a_tret_10a7", to: "node_a_tret_10a8", desc: "Đi tiếp qua Phòng 10A8" },
  { from: "node_a_tret_10a8", to: "node_a1_stair_tret", desc: "Đến Chân Cầu thang A1 (Trái)" },
  { from: "node_a1_stair_tret", to: "node_hl_a_west", desc: "Qua ngã rẽ Hành lang Tây" },
  { from: "node_hl_a_west", to: "node_a_tret_tv", desc: "Đi tiếp đến Thư Viện trường" },
  { from: "node_a_tret_tv", to: "node_a2_stair_tret", desc: "Đi tiếp đến Chân Cầu thang A2 (Phải)" },
  { from: "node_a2_stair_tret", to: "node_hl_a_east", desc: "Qua ngã rẽ Hành lang Đông" },
  { from: "node_hl_a_east", to: "node_a_tret_11a9", desc: "Đi tiếp qua Phòng 11A9" },
  { from: "node_a_tret_11a9", to: "node_a_tret_11a10", desc: "Đi tiếp qua Phòng 11A10" },
  { from: "node_a_tret_11a10", to: "node_a_tret_wc_r", desc: "Đi đến WC Dãy A Phải (Trệt)" },

  // Cầu thang A1 (X = 593)
  { from: "node_a1_stair_tret", to: "node_a1_stair_t2", desc: "Leo cầu thang A1 lên Tầng 2 Dãy A" },
  { from: "node_a1_stair_t2", to: "node_a1_stair_t3", desc: "Leo tiếp cầu thang A1 lên Tầng 3 Dãy A" },
  { from: "node_a1_stair_t3", to: "node_a1_stair_t4", desc: "Leo tiếp cầu thang A1 lên Tầng 4 Dãy A" },

  // Cầu thang A2 (X = 831)
  { from: "node_a2_stair_tret", to: "node_a2_stair_t2", desc: "Leo cầu thang A2 lên Tầng 2 Dãy A" },
  { from: "node_a2_stair_t2", to: "node_a2_stair_t3", desc: "Leo tiếp cầu thang A2 lên Tầng 3 Dãy A" },
  { from: "node_a2_stair_t3", to: "node_a2_stair_t4", desc: "Leo tiếp cầu thang A2 lên Tầng 4 Dãy A" },

  // Tầng 2 Dãy A (Y = 301)
  { from: "node_a_t2_wc_l", to: "node_a_t2_10a6", desc: "Hành lang Tầng 2 qua Phòng 10A6" },
  { from: "node_a_t2_10a6", to: "node_a_t2_10a5", desc: "Đi tiếp qua Phòng 10A5" },
  { from: "node_a_t2_10a5", to: "node_a1_stair_t2", desc: "Đến Cầu thang A1 (T2)" },
  { from: "node_a1_stair_t2", to: "node_a_t2_10a4", desc: "Hành lang Tầng 2 qua Phòng 10A4" },
  { from: "node_a_t2_10a4", to: "node_a_t2_11a8", desc: "Đi tiếp qua Phòng 11A8" },
  { from: "node_a_t2_11a8", to: "node_a_t2_11a7", desc: "Đi tiếp qua Phòng 11A7" },
  { from: "node_a_t2_11a7", to: "node_a2_stair_t2", desc: "Đến Cầu thang A2 (T2)" },
  { from: "node_a2_stair_t2", to: "node_a_t2_11a6", desc: "Hành lang Tầng 2 qua Phòng 11A6" },
  { from: "node_a_t2_11a6", to: "node_a_t2_11a5", desc: "Đi tiếp qua Phòng 11A5" },
  { from: "node_a_t2_11a5", to: "node_a_t2_wc_r", desc: "Đi đến WC Dãy A Phải (T2)" },

  // Tầng 3 Dãy A (Y = 263)
  { from: "node_a_t3_wc_l", to: "node_a_t3_10a1", desc: "Hành lang Tầng 3 qua Phòng 10A1" },
  { from: "node_a_t3_10a1", to: "node_a_t3_10a2", desc: "Đi tiếp qua Phòng 10A2" },
  { from: "node_a_t3_10a2", to: "node_a1_stair_t3", desc: "Đến Cầu thang A1 (T3)" },
  { from: "node_a1_stair_t3", to: "node_a_t3_10a3", desc: "Hành lang Tầng 3 qua Phòng 10A3" },
  { from: "node_a_t3_10a3", to: "node_a_t3_11a1", desc: "Đi tiếp qua Phòng 11A1" },
  { from: "node_a_t3_11a1", to: "node_a_t3_11a2", desc: "Đi tiếp qua Phòng 11A2" },
  { from: "node_a_t3_11a2", to: "node_a2_stair_t3", desc: "Đến Cầu thang A2 (T3)" },
  { from: "node_a2_stair_t3", to: "node_a_t3_11a3", desc: "Hành lang Tầng 3 qua Phòng 11A3" },
  { from: "node_a_t3_11a3", to: "node_a_t3_11a4", desc: "Đi tiếp qua Phòng 11A4" },
  { from: "node_a_t3_11a4", to: "node_a_t3_wc_r", desc: "Đi đến WC Dãy A Phải (T3)" },

  // Tầng 4 Dãy A (Y = 225)
  { from: "node_a_t4_wc_l", to: "node_a1_stair_t4", desc: "Hành lang Tầng 4 đến Cầu thang A1 (T4)" },
  { from: "node_a1_stair_t4", to: "node_a_t4_10a13", desc: "Hành lang Tầng 4 đến Phòng 10A13" },
  { from: "node_a_t4_10a13", to: "node_a2_stair_t4", desc: "Đi tiếp đến Cầu thang A2 (T4)" },
  { from: "node_a2_stair_t4", to: "node_a_t4_10a12", desc: "Hành lang Tầng 4 sang Phòng 10A12" },
  { from: "node_a_t4_10a12", to: "node_a_t4_10a11", desc: "Đi tiếp qua Phòng 10A11" },
  { from: "node_a_t4_10a11", to: "node_a_t4_wc_r", desc: "Đi đến WC Dãy A Phải (T4)" },

  // --- ĐƯỜNG ĐI NGOẠI VI & HỆ THỐNG NHÀ XE ---
  // Nhà xe GV & lối rẽ phía Tây Nam
  { from: "node_nga_re_cong", to: "node_duong_xe_hc", desc: "Rẽ trái đi theo đường nội bộ qua trước Dãy Hành Chính" },
  { from: "node_duong_xe_hc", to: "node_truoc_nha_xe_gv", desc: "Đi tiếp đường nội bộ đến trước Nhà xe GV" },
  { from: "node_truoc_nha_xe_gv", to: "node_nha_xe_gv", desc: "Đi vào Nhà xe giáo viên" },
  { from: "node_truoc_nha_xe_gv", to: "node_khuc_cua_gv", desc: "Đi tiếp ra góc cua phía Tây" },
  { from: "node_khuc_cua_gv", to: "node_khuc_cua_tn", desc: "Rẽ phải theo khúc cua Tây Nam" },
  { from: "node_khuc_cua_tn", to: "node_goc_xe_tay_nam", desc: "Đi ra đường xe phía Tây" },

  // Đường xe phía Tây (X = 65)
  { from: "node_goc_xe_tay_nam", to: "node_pk_12a10", desc: "Đi thẳng đường xe phía Tây đến ô xe 12A10" },
  { from: "node_pk_12a10", to: "node_loi_ra_day_b", desc: "Đến trước lối thông ra Dãy B" },
  { from: "node_loi_ra_day_b", to: "node_pk_12a9", desc: "Đi tiếp đường xe phía Tây đến ô xe 12A9" },
  { from: "node_pk_12a9", to: "node_goc_xe_tay_bac", desc: "Đi thẳng đến góc cua Tây Bắc" },

  // Góc Cổng sau & Dãy xe 12A5..12A8 (X = 117)
  { from: "node_goc_xe_tay_bac", to: "node_khuc_cua_tb", desc: "Rẽ phải theo đường Cổng sau" },
  { from: "node_khuc_cua_tb", to: "node_pk_12a8", desc: "Đến ô xe 12A8" },
  { from: "node_pk_12a8", to: "node_pk_12a7", desc: "Đến ô xe 12A7" },
  { from: "node_pk_12a7", to: "node_pk_12a6", desc: "Đến ô xe 12A6" },
  { from: "node_pk_12a6", to: "node_pk_12a5", desc: "Đến ô xe 12A5" },

  // Đường xe phía Bắc (Y = 186)
  { from: "node_khuc_cua_tb", to: "node_rd_12a4", desc: "Đi thẳng đường xe phía Bắc" },
  { from: "node_rd_12a4", to: "node_pk_12a4", desc: "Đến ô xe 12A4" },
  { from: "node_rd_12a4", to: "node_rd_12a3", desc: "Đi thẳng tiếp đường xe phía Bắc" },
  { from: "node_rd_12a3", to: "node_pk_12a3", desc: "Đến ô xe 12A3" },
  { from: "node_rd_12a3", to: "node_rd_12a2", desc: "Đi thẳng tiếp" },
  { from: "node_rd_12a2", to: "node_pk_12a2", desc: "Đến ô xe 12A2" },
  { from: "node_rd_12a2", to: "node_rd_12a1", desc: "Đi thẳng tiếp" },
  { from: "node_rd_12a1", to: "node_pk_12a1", desc: "Đến ô xe 12A1" },
  { from: "node_rd_12a1", to: "node_rd_11a8", desc: "Đi thẳng tiếp" },
  { from: "node_rd_11a8", to: "node_pk_11a8", desc: "Đến ô xe 11A8" },
  { from: "node_rd_11a8", to: "node_rd_11a7", desc: "Đi thẳng tiếp" },
  { from: "node_rd_11a7", to: "node_pk_11a7", desc: "Đến ô xe 11A7" },
  { from: "node_rd_11a7", to: "node_rd_11a6", desc: "Đi thẳng tiếp" },
  { from: "node_rd_11a6", to: "node_pk_11a6", desc: "Đến ô xe 11A6" },
  { from: "node_rd_11a6", to: "node_rd_11a5", desc: "Đi thẳng tiếp qua Nhà lợp tôn" },
  { from: "node_rd_11a5", to: "node_pk_11a5", desc: "Đến ô xe 11A5" },
  { from: "node_rd_11a5", to: "node_rd_11a3", desc: "Đi thẳng tiếp" },
  { from: "node_rd_11a3", to: "node_pk_11a3", desc: "Đến ô xe 11A3" },
  { from: "node_rd_11a3", to: "node_goc_xe_dong_bac", desc: "Đến góc cua phía Đông Bắc" },

  // Đường xe phía Đông (X = 1498)
  { from: "node_goc_xe_dong_bac", to: "node_pk_11a2", desc: "Rẽ phải theo dãy xe phía Đông đến ô 11A2" },
  { from: "node_pk_11a2", to: "node_pk_11a1", desc: "Đi thẳng dọc dãy xe đến ô 11A1" },
  { from: "node_pk_11a1", to: "node_pk_10a12", desc: "Đi thẳng tiếp đến ô xe 10A12" },
  { from: "node_pk_10a12", to: "node_goc_xe_dong_nam", desc: "Đến góc cua phía Đông Nam" },

  // Nhà xe học sinh Cổng trước (Y = 938)
  { from: "node_nga_re_cong", to: "node_pk_10a1", desc: "Rẽ phải theo lối vào Nhà xe học sinh đến ô 10A1" },
  { from: "node_pk_10a1", to: "node_pk_10a2", desc: "Đi tiếp đến ô xe 10A2" },
  { from: "node_pk_10a2", to: "node_pk_10a3", desc: "Đi tiếp đến ô xe 10A3" },
  { from: "node_pk_10a3", to: "node_pk_10a4", desc: "Đi tiếp đến ô xe 10A4" },
  { from: "node_pk_10a4", to: "node_pk_10a5", desc: "Đi tiếp đến ô xe 10A5" },
  { from: "node_pk_10a5", to: "node_pk_10a6", desc: "Đi tiếp đến ô xe 10A6" },
  { from: "node_pk_10a6", to: "node_pk_10a7", desc: "Đi tiếp đến ô xe 10A7" },
  { from: "node_pk_10a7", to: "node_pk_10a8", desc: "Đi tiếp đến ô xe 10A8" },
  { from: "node_pk_10a8", to: "node_pk_10a9", desc: "Đi tiếp đến ô xe 10A9" },
  { from: "node_pk_10a9", to: "node_pk_10a10", desc: "Đi tiếp đến ô xe 10A10" },
  { from: "node_pk_10a10", to: "node_pk_10a11", desc: "Đi tiếp đến ô xe 10A11" },
  { from: "node_pk_10a11", to: "node_goc_xe_dong_nam", desc: "Đi đến góc cua phía Đông Nam" }
];

window.CAMPUS_LOCATIONS = CAMPUS_LOCATIONS;
window.CAMPUS_GRAPH_NODES = CAMPUS_GRAPH_NODES;
window.CAMPUS_GRAPH_EDGES = CAMPUS_GRAPH_EDGES;
