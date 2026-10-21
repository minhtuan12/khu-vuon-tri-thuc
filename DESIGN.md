# DESIGN — Khu Vườn Tri Thức

- **Hướng nghệ thuật:** sách truyện tranh khu vườn: bầu trời, đồi thoải, cây táo, hoa. Không phải dashboard.
- **Linh vật:** "Mầm" — hạt mầm vàng có lá non, biểu cảm: ngủ / vui / suy nghĩ / reo hò, miệng động khi đang đọc.
- **Khoảnh khắc đáng nhớ:** khu vườn từ xám, ngủ → rực rỡ, nở hoa khi bé chọn đúng (`GardenScene` `bloom` 0→1).
- **Bảng màu (oklch, `src/styles.css`):** sky, leaf, sun, coral pastel; chữ ink đậm; 4 màu sơn cho bài màu sắc.
- **Chữ:** Baloo 2 (tiêu đề), Nunito (nội dung) — đều hỗ trợ tiếng Việt.
- **Tương tác:** nút `tactile` ≥ 56px, bo tròn lớn, lún khi bấm; viền focus rõ.
- **Chuyển động:** float, pop, wiggle, rain; tắt khi `prefers-reduced-motion` hoặc bật "Giảm chuyển động".
- **Hình ảnh:** toàn bộ SVG tự vẽ (`WordArt`, `Mascot`, `GardenScene`), không dùng emoji.
