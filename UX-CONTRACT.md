# UX CONTRACT

1. Mỗi bài có đúng 6 chặng: giới thiệu → nghe & chọn → khu vườn đổi màu → vận động → nhớ lại → chúc mừng.
2. Số lựa chọn: 3–4 tuổi = 2, 4–5 = 3, 5–6 = 4.
3. Chọn sai: gợi ý nhẹ nhàng, không trừ điểm, không âm thanh phạt. Sau 2 lần: Mầm chỉ đáp án sáng lên.
4. Nút "Nghe lại" luôn hiển thị. Âm thanh chỉ bắt đầu sau cú bấm đầu tiên.
5. Không bao giờ giả vờ có giọng: thiếu giọng ngôn ngữ nào thì báo rõ, chữ luôn hiện.
6. Tiến trình lưu sau mỗi chặng; mở lại sẽ tiếp tục đúng chặng. "Từ đầu"/"Chơi lại" luôn có.
7. "Đã gặp" ≠ "thành thạo". Ứng dụng không tự kết luận thành thạo; chỉ giáo viên ghi: Làm quen / Làm theo / Nói được / Chưa quan sát.
8. Trạng thái lưu luôn hiện: "Lưu trên thiết bị" / "Đã lưu trực tuyến" / "Chưa đồng bộ · Thử lại".
9. AI chỉ đề xuất trong từ vựng & động tác đã duyệt; giáo viên duyệt trước khi dùng; dự phòng ghi rõ "Gợi ý có sẵn".
10. Camera/chatbot cho bé chưa có. Micro chỉ có trong lộ trình khi người lớn đồng ý theo phiên; không lưu audio/transcript. Browser có thể dùng dịch vụ nhận dạng riêng, vì vậy người lớn nhận cảnh báo trước khi bật; luôn có cách đi tiếp khi không hỗ trợ/không cấp quyền.

## Lộ trình và âm thanh (yêu cầu 22/10/2026)

- `/roadmap` gồm ba khu vườn, bốn bài từ vựng mỗi khu; ID lấy từ `src/lib/content.ts`. Không khóa bài.
- Bài lộ trình có sáu bước: Hello → Listen → Say it → Choose → Say more → Hooray. Sáu chặng của bài phiêu lưu cũ không thay đổi.
- Bấm bài mở Dialog tại chỗ; world/lesson trong URL để reload/Back khôi phục. Đóng trả focus về bài đã mở. Tiến độ theo hồ sơ và khóa `path-v1-<wordId>`, độc lập với `standard` và truyện đã duyệt.
- “Try saying it” dùng SpeechRecognition của browser sau khi người lớn đồng ý; transcript chỉ ở bộ nhớ tạm để so khớp rồi bỏ. Không chấm điểm phát âm: so khớp rất rộng (từ đích/sound-alike hoặc sai tối đa nửa số chữ). Đúng: chúc mừng và tự qua bước tiếp theo. Chưa khớp: “Try again!”, Mầm mặt mếu nhẹ, không trừ điểm. Sai hai lần có gợi ý.
- `speech.ts` chỉ phát tiếng Anh, hủy khi đổi màn/tắt tiếng. Giọng nữ ưu tiên theo tên vì Web Speech không có thuộc tính giới tính. Nếu không nhận diện được, thông báo và dùng giọng Anh hiện có; không giả giới tính bằng pitch.
- Cài đặt giọng dùng Select chuẩn, chỉ còn tiếng Anh. Truyện tiếng Việt cũ giữ caption nhưng không đọc thành tiếng.

## Học ở lớp và tại nhà

- Hồ sơ biệt danh và nhóm lớp thuộc riêng tài khoản; chưa chia sẻ cô–gia đình.
- Tiến độ tách theo chủ sở hữu, ngữ cảnh, thế giới và phiên bản trải nghiệm. Dữ liệu cũ ở “Chơi chung”; không tự gán cho bé.
- Khách không cần mạng để chơi khi ứng dụng đã tải. Dữ liệu khách không tự chuyển sang tài khoản khác.
- Câu chuyện/nhiệm vụ: đề xuất → chỉnh lời dẫn → xem trước không ghi dữ liệu → duyệt trên server → thư viện cho bé. Bản duyệt bất biến.
- Nhánh ở chặng cảnh hội tụ sang chặng vận động; không bỏ hoặc thêm chặng.
- AI dùng chung hạn mức 20 lượt/giờ, có nội dung dự phòng ghi rõ nguồn.
- Cài đặt nhạy cảm và nhập bản sao lưu đặt trong góc người lớn; khôi phục phải xác nhận.

## Canonical UI Map

| Khả năng | Chủ sở hữu | Biến thể | Kiểm tra |
|---|---|---|---|
| Select/Listbox | components/ui/select | Radix, nhãn tiếng Việt | keyboard, popup |
| Form | Zod + nhãn HTML, components/ui/textarea | tạo hồ sơ, sửa lời dẫn | validation |
| Toast | Sonner ở root | success/error | live region |
| Dialog | components/ui/dialog | preview, xác nhận nhập dữ liệu | focus/Escape |
| CRUD | LearningHub + progress + AI server functions | local-first, duyệt immutable | tests và browser |
| Scrollbar | src/styles.css | global | viewport |
