# Lộ trình học cùng Mầm

## Phạm vi

- Mở từ **Lộ trình** ở thanh dưới hoặc trang chủ. Ba thế giới, 12 bài từ nội dung curated; mỗi bài có nghe, nói theo, chọn từ và câu mẫu.
- Mở ngay trong trang; tiến độ theo tài khoản/ngữ cảnh/bài, reload tiếp tục bước đang học. Bài hoàn thành có thể chơi lại.
- Nói theo mở microphone sau khi người lớn đồng ý theo phiên. Audio và transcript không được lưu hoặc gửi bởi ứng dụng; transcript chỉ nằm tạm trong bộ nhớ để so khớp. Hoa ghi nhận trải nghiệm, không chứng nhận thành thạo.
- Giữ các bài phiêu lưu, truyện AI và dữ liệu cũ.

## Giọng đọc

Âm thanh qua `src/lib/speech.ts`, chỉ đọc tiếng Anh. Ưu tiên giọng nữ nhận diện theo tên (Microsoft Zira, Aria, Jenny, Samantha...), giữ pitch tự nhiên. Web Speech không cung cấp giới tính; giọng phụ thuộc thiết bị: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice

Nói theo dùng `SpeechRecognition` của browser nếu có. Các browser hỗ trợ khác nhau; một số triển khai mặc định dùng dịch vụ nhận dạng qua mạng, nên màn hình xin phép nêu rõ điều này cho người lớn. Lộ trình không mở mic tự động, không ghi/lưu audio, không lưu transcript và vẫn cho bé đi tiếp khi browser không hỗ trợ hoặc bị từ chối. Tham khảo: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API

Cài đặt có nghe thử/chọn giọng. Không nhận diện được giọng nữ: báo rõ và dùng giọng Anh hiện có. Không có giọng Anh: hướng dẫn đọc cùng người lớn/cài thêm giọng. Không thêm dịch vụ TTS. Một số giọng trình duyệt có thể cần mạng; không thu giọng nói của bé.

## Database

Áp dụng `supabase/migrations/20261022064642_learning_roadmap.sql` sau migration `20261022064636` trước khi đồng bộ lộ trình trên Supabase thật. Migration cho phép khóa curated `path-v1-*`, giữ RLS/quyền sở hữu và lịch sử. Chơi khách/lưu tại máy không cần migration online.

## Kiểm tra và giới hạn

- Unit: 12 ID, tách bài/hồ sơ/bài chuẩn, backup; giọng nữ, chặn tiếng Việt, thiếu giọng/mute, và nhận dạng trẻ em rộng rãi.
- Database PGlite: migration, khóa sai thế giới bị từ chối, giữ RLS hai tài khoản.
- Browser: nghe → người lớn bật mic → nói sai/Mầm mặt mếu/“Try again!” → nói gần đúng → tự qua bước tiếp theo; reload → đúng → hoàn thành; lưu offline; đổi thế giới; keyboard/Escape; lesson không tồn tại; thiếu giọng; mobile.
- Ảnh tại `docs/previews/roadmap-*.png`. Voice giả lập kiểm chứng chọn voice/lang, không thay thế nghe thử trên thiết bị thật.
- Đã áp dụng migration trên Supabase thật và kiểm thử RPC ghi/đọc cùng RLS trong giao dịch `ROLLBACK`; chưa kiểm chứng đồng bộ qua phiên đăng nhập trình duyệt hoặc chất lượng giọng trên mọi trình duyệt.

## Đối chiếu thiết kế

| Quy tắc | Thực hiện |
|---|---|
| Thương hiệu/pastel | Logo, nền garden-story, Mầm và biến màu runtime |
| Bài học tại chỗ | Dialog chuẩn, URL và phục hồi focus |
| Không giả kết quả học | Hoa trải nghiệm, nhận dạng rộng để khích lệ; không điểm/chứng nhận phát âm |
| Giọng Việt/Anh cũ | Thay đổi có chủ đích theo yêu cầu: chỉ đọc Anh, giữ caption cũ |
