/**
 * room_images.js - Mapping toàn bộ Location ID → Ảnh thực tế chỉ đường (100% đầy đủ 118 ảnh)
 * Đường dẫn tương đối từ thư mục gốc dự án.
 * Phù hợp 100% với sơ đồ "ảnh chú thích thứ tự các dãy tòa học 1,2 và 3.png":
 * - TÒA 1: Dãy Bộ Môn (bên phải)
 * - TÒA 2: Dãy A (trên cùng - Khối 10, 11 & Thư Viện)
 * - TÒA 3: Dãy B (bên trái - Khối 12)
 * - TÒA GV: Dãy Hành Chính (Hiệu Bộ)
 * - HỘI TRƯỜNG: Khu vực Hội trường lớn
 */

const BASE = "file ảnh chỉ đường";

window.ROOM_IMAGES = {

  // =====================================================================
  // HỘI TRƯỜNG (6 ảnh)
  // =====================================================================
  "hoi_truong": [
    `${BASE}/HỘI TRƯỜNG-20261013T135150Z-1-001/HỘI TRƯỜNG/IMG_20261010_233806.jpg`,
    `${BASE}/HỘI TRƯỜNG-20261013T135150Z-1-001/HỘI TRƯỜNG/IMG_20261010_233809.jpg`,
    `${BASE}/HỘI TRƯỜNG-20261013T135150Z-1-001/HỘI TRƯỜNG/IMG_20261010_233815.jpg`,
    `${BASE}/HỘI TRƯỜNG-20261013T135150Z-1-001/HỘI TRƯỜNG/IMG_20261010_233817.jpg`,
    `${BASE}/HỘI TRƯỜNG-20261013T135150Z-1-001/HỘI TRƯỜNG/IMG_20261010_233824.jpg`,
    `${BASE}/HỘI TRƯỜNG-20261013T135150Z-1-001/HỘI TRƯỜNG/IMG_20261010_233826.jpg`,
  ],

  // =====================================================================
  // TÒA GV - DÃY HÀNH CHÍNH (HIỆU BỘ)
  // =====================================================================
  // Tầng trệt
  "phong_ho_so_1": [`${BASE}/TÒA GV/Tầng trệt/phòng hồ sơ 1.jpg`],
  "phong_ho_so_2": [`${BASE}/TÒA GV/Tầng trệt/phòng hồ sơ 2.jpg`],
  "phong_pho_ht": [`${BASE}/TÒA GV/Tầng trệt/phòng phó hiệu trưởng.jpg`],
  "phong_truyen_thong": [`${BASE}/TÒA GV/Tầng trệt/phòng truyền thống.jpg`],
  "phong_tiep_dan": [`${BASE}/TÒA GV/Tầng trệt/phòng tiếp công dân.jpg`],
  "wc_hc_tret": [`${BASE}/TÒA GV/Tầng trệt/nhà vệ sinh bên giáo viên ( bên trái ).jpg`],
  "cau_thang_hc": [
    `${BASE}/TÒA GV/Tầng trệt/cầu thang tầng trệt toà gv.jpg`,
    `${BASE}/TÒA GV/Tầng 2/cầu thang tầng 2 giáo viên.jpg`,
  ],
  "loi_vao_hanh_chinh": [
    `${BASE}/TÒA GV/Tầng trệt/view nhìn vào tầng trệt giáo viên.jpg`,
    `${BASE}/TÒA GV/Tầng trệt/view từ tầng trệt gv nhìn ra hội trường.jpg`,
    `${BASE}/TÒA GV/Tầng trệt/bàn ghế đá trước toà gv ( đoạn trước gần sân trường ).jpg`,
    `${BASE}/TÒA GV/Tầng trệt/bộ bàn ghế đá trước toà gv ( đoạn trong cùng ).jpg`,
  ],

  // Tầng 2
  "phong_hieu_truong": [`${BASE}/TÒA GV/Tầng 2/phòng hiệu trưởng.jpg`],
  "phong_van_thu": [`${BASE}/TÒA GV/Tầng 2/phòng văn thư • tq.jpg`],
  "phong_ke_toan": [`${BASE}/TÒA GV/Tầng 2/phòng kế toán.jpg`],
  "phong_chi_bo": [`${BASE}/TÒA GV/Tầng 2/phòng chi bộ ( họp gv ).jpg`],
  "wc_hc_t2": [`${BASE}/TÒA GV/Tầng 2/nhà vệ sinh giáo viên tầng 2 ( bên trái ).jpg`],

  // =====================================================================
  // TÒA 1 - DÃY BỘ MÔN & PHÒNG CHỨC NĂNG (BÊN PHẢI)
  // =====================================================================
  // Tầng trệt
  "phong_y_te": [
    `${BASE}/TÒA 1/Tầng trệt/phòng y tế.jpg`,
    `${BASE}/TÒA 1/Tầng trệt/bảng thông tin.jpg`,
  ],
  "bm_tret_ly": [`${BASE}/TÒA 1/Tầng trệt/phòng vật lí công nghệ.jpg`],
  "bm_tret_hoa": [`${BASE}/TÒA 1/Tầng trệt/phòng hóa sinh.jpg`],
  "wc_bm_tret": [`${BASE}/TÒA 1/Tầng trệt/wc.jpg`],
  "cau_thang_bm": [
    `${BASE}/TÒA 1/Tầng trệt/cầu thang.jpg`,
    `${BASE}/TÒA 1/Tầng trệt/cầu thang_.jpg`,
    `${BASE}/TÒA 1/Tầng trệt/hành lang tòa 1.jpg`,
    `${BASE}/TÒA 1/Tầng trệt/IMG_20261011_072230.jpg`,
    `${BASE}/TÒA 1/Tầng 2/cầu thang tầng 2 tòa 1.jpg`,
    `${BASE}/TÒA 1/Tầng 3/cầu thang tầng 3 tòa 1.jpg`,
    `${BASE}/TÒA 1/Tầng 4/Cầu thang tầng 4 tòa 1.jpg`,
  ],

  // Tòa 1 - Tầng 2
  "bm_t2_qp": [`${BASE}/TÒA 1/Tầng 2/P thể dục QP tầng 2 tòa 1.jpg`],
  "vp_doan": [`${BASE}/TÒA 1/Tầng 2/P đoàn thanh niên tầng 2 tòa 1.jpg`],
  "tin_hoc_1": [
    `${BASE}/TÒA 1/Tầng 2/P học vi tính tầng 2 tòa 1.jpg`,
    `${BASE}/TÒA 1/Tầng 2/P vi tính tầng 2 tòa 1.jpg`,
  ],
  "tin_hoc_2": [`${BASE}/TÒA 1/Tầng 2/P bộ môn tầng 2 tòa 1.jpg`],
  "wc_bm_t2": [`${BASE}/TÒA 1/Tầng 2/NVS tầng 2 tòa 1.jpg`],

  // Tòa 1 - Tầng 3
  "bm_t3_anh_van": [`${BASE}/TÒA 1/Tầng 3/phòng học anh văn tầng 3 tòa 1.jpg`],
  "bm_t3_tam_ly": [`${BASE}/TÒA 1/Tầng 3/phòng TV tâm lí tầng 3 tòa 1.jpg`],
  "bm_t3_may1": [`${BASE}/TÒA 1/Tầng 3/phòng trống tầng 3 tòa 1.jpg`],
  "bm_t3_may2": [`${BASE}/TÒA 1/Tầng 3/phòng trống 2 tầng 3 tòa 1.jpg`],
  "wc_bm_t3": [`${BASE}/TÒA 1/Tầng 3/NVS tầng 3 tòa 1.jpg`],

  // Tòa 1 - Tầng 4
  "bm_t4_luu_tru": [`${BASE}/TÒA 1/Tầng 4/phòng lưu trữ tầng 4 tòa 1.jpg`],
  "bm_t4_tin4": [
    `${BASE}/TÒA 1/Tầng 4/phòng trống tầng 4 tòa 1.jpg`,
    `${BASE}/TÒA 1/Tầng 4/Tầng 4 tòa 1.jpg`,
    `${BASE}/TÒA 1/Tầng 4/tầng 4 ảnh trên cao 2 tòa 1.jpg`,
  ],
  "bm_t4_anh_van": [`${BASE}/TÒA 1/Tầng 4/phòng học anh văn tầng 4 tòa 1.jpg`],
  "wc_bm_t4": [`${BASE}/TÒA 1/Tầng 4/NVS tầng 4 tòa 1.jpg`],

  // =====================================================================
  // TÒA 2 - DÃY A (TRÊN CÙNG: KHỐI 10, 11 & THƯ VIỆN)
  // =====================================================================
  // Tầng trệt
  "a_tret_thu_vien": [
    `${BASE}/TÒA 2/Tầng trệt/Thư viện tầng 1 tòa 2.JPG`,
    `${BASE}/TÒA 2/Tầng trệt/Phòng đọc giáo viên tầng 1 tòa 2.JPG`,
  ],
  "a_tret_10a7": [
    `${BASE}/TÒA 2/Tầng trệt/lớp 10A7 tầng 1 tòa 2.JPG`,
    `${BASE}/TÒA 2/Tầng trệt/hàng lang nối tòa 2 vs tòa 3 tầng 1.jpg`,
    `${BASE}/TÒA 2/Tầng trệt/hàng lang nối tòa 2 và tòa 3 ở tầng 1.jpg`,
  ],
  "a_tret_10a8": [`${BASE}/TÒA 2/Tầng trệt/Lớp 10A8 tầng 1 tòa 2.JPG`],
  "a_tret_11a9": [`${BASE}/TÒA 2/Tầng trệt/Lớp 11A9 tầng 1 tòa 2.JPG`],
  "a_tret_11a10": [`${BASE}/TÒA 2/Tầng trệt/lớp 11A10 tầng 1 tòa 2.JPG`],
  "wc_a_tret_right": [`${BASE}/TÒA 2/Tầng trệt/NVS Bên cạnh lớp 11A10 tầng 1 tòa 2.jpg`],
  "cau_thang_a1": [
    `${BASE}/TÒA 2/Tầng trệt/cầu thang tầng 1 tòa 2 bên cạnh thư viện.jpg`,
    `${BASE}/TÒA 2/Tầng 4/cầu thang tầng 4 tòa 2 bên cạnh P39.jpg`,
  ],
  "cau_thang_a2": [
    `${BASE}/TÒA 2/Tầng trệt/cầu thang tầng 1 tòa 2 bên cạnh 11A9.jpg`,
    `${BASE}/TÒA 2/Tầng 4/cầu thang tầng 4 tòa 2 bên cạnh 10A12.jpg`,
  ],

  // Tòa 2 - Tầng 2
  "a_t2_10a6": [`${BASE}/TÒA 2/Tầng 2/Lớp 10A6 tầng 2 tòa 2.JPG`],
  "a_t2_10a5": [`${BASE}/TÒA 2/Tầng 2/Lớp 10A5 tầng 2 tòa 2.JPG`],
  "a_t2_10a4": [`${BASE}/TÒA 2/Tầng 2/Lớp 10A4 tầng 2 tòa 2.JPG`],
  "a_t2_11a8": [`${BASE}/TÒA 2/Tầng 2/Lớp 11A8 tầng 2 tòa 2.JPG`],
  "a_t2_11a7": [`${BASE}/TÒA 2/Tầng 2/Lớp 11A7 tầng 2 tòa 2.JPG`],
  "a_t2_11a6": [`${BASE}/TÒA 2/Tầng 2/Lớp 11A6 tầng 2 tòa 2.JPG`],
  "a_t2_11a5": [`${BASE}/TÒA 2/Tầng 2/lớp 11A5 tòa 2 tầng 2.jpg`],
  "wc_a_t2_left": [`${BASE}/TÒA 2/Tầng 2/NVS bên cạnh lớp 10A6 tầng 2 tòa 2.JPG`],
  "wc_a_t2_right": [`${BASE}/TÒA 2/Tầng 2/NVS bên cạnh lớp 11A5 tầng 2 tòa 2 .JPG`],

  // Tòa 2 - Tầng 3
  "a_t3_10a1": [`${BASE}/TÒA 2/Tầng 3/Lớp 10A1 tầng 3 tòa 2.JPG`],
  "a_t3_10a2": [`${BASE}/TÒA 2/Tầng 3/Lớp 10A2 tầng 3 tòa 2.JPG`],
  "a_t3_10a3": [`${BASE}/TÒA 2/Tầng 3/Lớp 10A3 tầng 3 tòa 2.JPG`],
  "a_t3_11a1": [`${BASE}/TÒA 2/Tầng 3/Lớp 11A1 tầng 3 tòa 2.JPG`],
  "a_t3_11a2": [`${BASE}/TÒA 2/Tầng 3/Lớp 11A2 tầng 3 tòa 2.JPG`],
  "a_t3_11a3": [`${BASE}/TÒA 2/Tầng 3/Lớp 11A3 tầng 3 tòa 2.JPG`],
  "a_t3_11a4": [`${BASE}/TÒA 2/Tầng 3/Lớp 11A4 tầng 3 tòa 2.JPG`],
  "wc_a_t3_left": [`${BASE}/TÒA 2/Tầng 3/NVS bên cạnh lớp 10A1 tầng 3 tòa 2 .JPG`],
  "wc_a_t3_right": [`${BASE}/TÒA 2/Tầng 3/NVS bên cạnh lớp 11A4 tầng 3 tòa 2.JPG`],

  // Tòa 2 - Tầng 4
  "a_t4_ben_su_dia": [`${BASE}/TÒA 2/Tầng 4/P bên cạnh sử địa GDKTPL tầng 4 tòa 2.jpg`],
  "a_t4_su_dia": [`${BASE}/TÒA 2/Tầng 4/P sử địa GDKTPL tầng 4 tòa 2.jpg`],
  "a_t4_p38": [`${BASE}/TÒA 2/Tầng 4/P38 tầng 4 tòa 2.JPG`],
  "a_t4_p39": [`${BASE}/TÒA 2/Tầng 4/P39 tầng 4 tòa 2.jpg`],
  "a_t4_10a13": [`${BASE}/TÒA 2/Tầng 4/lớp 10A13 tầng 4 tòa 2.JPG`],
  "a_t4_10a12": [`${BASE}/TÒA 2/Tầng 4/Lớp 10A12 tầng 4 tòa 2.jpg`],
  "a_t4_10a11": [`${BASE}/TÒA 2/Tầng 4/Lớp 10A11 tầng 4 tòa 2.JPG`],
  "wc_a_t4_left": [`${BASE}/TÒA 2/Tầng 4/NVS cùng bên sử địa GDKTPL tầng 4 tòa 2.jpg`],
  "wc_a_t4_right": [`${BASE}/TÒA 2/Tầng 4/NVS bên cạnh lớp 10A11 tầng 4 tòa 2.JPG`],

  // =====================================================================
  // TÒA 3 - DÃY B (PHÍA TÂY: KHỐI 12 & 10A9, 10A10)
  // =====================================================================
  // Tầng trệt
  "b_tret_12a7": [
    `${BASE}/TÒA 3/Tầng trệt/12a7 tang tret.jpg`,
    `${BASE}/TÒA 3/Tầng trệt/hành lang tòa 3 tầng trệt.jpg`,
  ],
  "b_tret_12a8": [`${BASE}/TÒA 3/Tầng trệt/12a8 toa 3.jpg`],
  "b_tret_12a9": [`${BASE}/TÒA 3/Tầng trệt/12a9 tòa 3 tầng trệt.jpg`],
  "b_tret_12a10": [`${BASE}/TÒA 3/Tầng trệt/12a10.jpg`],
  "b_tret_am_thanh": [`${BASE}/TÒA 3/Tầng trệt/phòng âm thanh tầng 1.jpg`],
  "wc_b_tret": [`${BASE}/TÒA 3/Tầng trệt/wc tang tret.jpg`],

  // Tòa 3 - Tầng 2
  "b_t2_12a3": [`${BASE}/TÒA 3/Tầng 2/12a3.jpg`],
  "b_t2_12a4": [`${BASE}/TÒA 3/Tầng 2/12a4 tang 2.jpg`],
  "b_t2_12a5": [`${BASE}/TÒA 3/Tầng 2/12a5.jpg`],
  "b_t2_12a6": [`${BASE}/TÒA 3/Tầng 2/12a6.jpg`],
  "b_t2_thi_vu": [`${BASE}/TÒA 3/Tầng 2/phòng thi vụ.jpg`],
  "wc_b_t2": [`${BASE}/TÒA 3/Tầng 2/wc.jpg`],

  // Tòa 3 - Tầng 3
  "b_t3_12a1": [`${BASE}/TÒA 3/Tầng 3/toa 3 tang 3 12a1.jpg`],
  "b_t3_12a2": [`${BASE}/TÒA 3/Tầng 3/12a2 tang 3.jpg`],
  "b_t3_10a10": [`${BASE}/TÒA 3/Tầng 3/10a10 tang 3.jpg`],
  "b_t3_10a9": [`${BASE}/TÒA 3/Tầng 3/toa 3 tang 3 10a9.jpg`],
  "b_t3_nghi_gv_nu": [`${BASE}/TÒA 3/Tầng 3/p nghia gv nu tang 3.jpg`],
  "wc_b_t3": [`${BASE}/TÒA 3/Tầng 3/wc.jpg`],

  // Tòa 3 - Tầng 4
  "b_t4_p14": [`${BASE}/TÒA 3/Tầng 4/p14 tang 4.jpg`],
  "b_t4_p15": [`${BASE}/TÒA 3/Tầng 4/p15 tang 4.jpg`],
  "b_t4_p16": [`${BASE}/TÒA 3/Tầng 4/p16 tang 4.jpg`],
  "b_t4_media": [`${BASE}/TÒA 3/Tầng 4/media.jpg`],
  "b_t4_nghi_gv_nam": [`${BASE}/TÒA 3/Tầng 4/nghi trua gv nam tang 4.jpg`],
  "wc_b_t4": [`${BASE}/TÒA 3/Tầng 4/wc tang 4.jpg`],
};
