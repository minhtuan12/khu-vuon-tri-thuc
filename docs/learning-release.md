# Khu Vườn Tri Thức — triển khai đợt đầu

## Đã triển khai trong mã nguồn

- Hồ sơ biệt danh và nhóm lớp, lựa chọn ngữ cảnh được giữ sau reload.
- Tiến độ local-first theo tài khoản/ngữ cảnh/thế giới/trải nghiệm; dữ liệu cũ vào Chơi chung.
- Sáu chặng học, hoạt động tìm hình, nhớ hình và đếm; ghi lượt chơi, gợi ý, hoàn thành và ghi chú.
- Góc người lớn: chuẩn bị câu chuyện/nhiệm vụ, sửa lời dẫn, xem trước trong dialog không ghi tiến độ, duyệt và lưu khi đăng nhập.
- Hai đề xuất AI qua gateway hiện có, kiểm tra nội dung curated, phương án biên soạn sẵn khi lỗi. Nội dung đã duyệt chạy từ bộ nhớ tại máy.
- Sao lưu JSON phiên bản 2, kiểm tra trước khôi phục, xuất CSV. Trải nghiệm trong backup không được tự nâng thành bản đã duyệt: chỉ giữ những bản tài khoản hiện tại đã có.
- Migration bổ sung bảng, RLS, RPC kiểm tra quyền sở hữu, hạn mức nguyên tử dùng chung 20 lượt/giờ.

## Vận hành

1. Sao lưu database và kiểm tra migration `supabase/migrations/0001_learning_experiences.sql` trên môi trường thử nghiệm trước khi phát hành. Không xóa bảng lịch sử cũ.
2. Áp dụng migration qua quy trình Supabase của dự án; cập nhật cấu hình gateway đang dùng trên server, không đưa khóa server vào biến frontend.
3. Hai cờ server `FEATURE_STORY_AI` và `FEATURE_REVIEW_AI`: đặt chuỗi `false` để tắt tương ứng. Nên tắt trên môi trường thật cho đến khi nghiệm thu luồng đăng nhập/duyệt.
4. Đăng nhập bằng hai tài khoản thử: tạo hồ sơ riêng, duyệt một bài, kiểm tra tài khoản kia không đọc/ghi được dữ liệu hoặc tham chiếu hồ sơ đó.
5. Thử mất mạng, reload, đăng xuất/đổi tài khoản, đồng bộ lại và xác nhận không mất hoặc trộn dữ liệu. Khách chơi bài chuẩn không cần gọi server; chưa có PWA cho lần mở đầu hoàn toàn offline.
6. Sao lưu trước khôi phục: khôi phục thay dữ liệu cục bộ, sau đó đồng bộ hợp nhất với dữ liệu server; không phải thao tác xóa lịch sử trên server.

## Kiểm chứng ngày 22/10/2026

- TypeScript: đạt.
- Vitest: 26 test đạt, bao gồm validation, cô lập hồ sơ/tài khoản, reload, backup và migration/RPC/RLS trên PGlite.
- Playwright: luồng desktop/mobile tạo hồ sơ → bài có sẵn → preview không ghi → bài thật ghi hoạt động; ảnh tại `docs/previews`.
- Production build: đạt; còn cảnh báo deprecation `inputValidator` và cấu hình đường dẫn Vite.
- ESLint các file triển khai: đạt. Lint toàn repository chưa đạt (nhiều lỗi định dạng/CRLF và lỗi ngoài phạm vi); không định dạng lại toàn bộ để tránh thay đổi không liên quan.
- Chưa chạy migration trên Supabase thật, chưa kiểm chứng gateway AI và duyệt bằng phiên đăng nhập thật. Test PGlite không thay thế kiểm thử trên dịch vụ Supabase.

## Giới hạn cần nghiệm thu tiếp

- Bộ quy tắc ôn tập hiện ưu tiên lượt gặp/lượt thử và gợi ý; chưa dùng quan sát tự do của người lớn để quyết định từ ôn.
- Nhánh câu chuyện thay lời phản hồi trong cảnh rồi hội tụ; chưa có đồ thị nhiều cảnh rẽ nhánh sâu.
- Cần kiểm tra thiết bị cảm ứng/tablet thật, giọng Việt/Anh thực tế, bàn phím toàn luồng và đồng bộ mất mạng với Supabase thật.
- Kiểm tra thiết kế tự động còn cảnh báo ở các thành phần cũ và một số mẫu wrapper. Chưa tuyên bố đạt audit accessibility toàn bộ.
- Camera, micro, đánh giá phát âm, liên kết cô–gia đình và PWA chưa thuộc đợt này.

## Minh họa

`public/illustrations/garden-story.jpg`: tạo qua AI Graphic Design/Superdesign, đã dùng đúng 6 credit được người dùng duyệt. Kích thước kết quả 2352×1568 (tỉ lệ 3:2), không chữ/logo. Ảnh chỉ làm nền; đáp án và điều khiển là thành phần riêng.

## Chạy kiểm tra

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
# Khởi động dev server ở cổng 8081 trước khi chạy trình duyệt:
node node_modules/playwright/cli.js test
```

Preview không mở tab mới. Các ảnh đã chụp nằm trong thư mục `docs/previews`.
