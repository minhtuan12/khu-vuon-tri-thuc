# Khu Vườn Tri Thức — Trường Mầm Non Tô Hiến Thành

Khu vườn truyện tranh giúp bé 3–6 tuổi làm quen tiếng Anh qua nghe, chọn hình, vận động và nhớ lại. Có khu vực cho giáo viên/phụ huynh.

## Cài đặt

```bash
bun install
cp .env.example .env   # điền URL và khóa công khai của backend
bun run dev            # http://localhost:8080
bun run test           # chạy kiểm thử
```

## Biến môi trường
Xem `.env.example`. Chỉ khóa **công khai** nằm ở phía trình duyệt. `LOVABLE_API_KEY` (cho AI) chỉ đọc trên máy chủ, không bao giờ đưa vào mã phía trình duyệt.

## Cơ sở dữ liệu
PostgreSQL được quản lý (Lovable Cloud). Lược đồ + chính sách bảo mật theo từng người dùng (RLS) ở `supabase/migrations/0000_init_garden.sql`:
- `profiles`, `learner_profiles` (chỉ biệt danh, avatar, nhóm tuổi), `lesson_sessions`, `observations`, `ai_requests` (giới hạn tần suất AI).
- Mỗi bảng chỉ cho chủ sở hữu (`auth.uid()`) đọc/ghi. Không có chính sách công khai.

## Đăng nhập
Email + mật khẩu cho người lớn (cần xác nhận email). Có quên/đặt lại mật khẩu (`/reset-password`). Bé chơi không cần tài khoản: tiến trình “Lưu trên thiết bị”. Khi đăng nhập, tiến trình được gộp và đồng bộ (“Đã lưu trực tuyến”); nếu mất mạng, dữ liệu chờ được giữ lại và có nút “Thử lại”.

## AI
`src/lib/ai.functions.ts`: hàm máy chủ yêu cầu đăng nhập, giới hạn 20 lần/giờ, AI chỉ được chọn từ vựng/động tác có sẵn, kết quả được kiểm tra (`validateProposal`) và giáo viên phải duyệt. Khi AI lỗi, hiển thị rõ “Gợi ý có sẵn (không phải AI)”.

## Giọng đọc — giới hạn
- Dùng `speechSynthesis` của trình duyệt: vi-VN cho hướng dẫn, en-US cho từ vựng. Đây là đọc chữ thành tiếng, **không** phải AI chấm phát âm.
- Âm thanh chỉ phát sau khi người dùng bấm. Nhiều máy (đặc biệt Linux, một số Android) không có giọng tiếng Việt; ứng dụng hiện thông báo rõ và chữ hiển thị đầy đủ.
- Không dùng micro, camera; không ghi âm bé.

## Trang
`/` · `/adventures` · `/learn/:id` (`?mode=class` cho lớp học) · `/postcard/:id` · `/teacher` · `/progress` · `/about` · `/auth` · `/reset-password`
