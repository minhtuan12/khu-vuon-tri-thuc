import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { Panel } from "@/components/kit";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "Giới thiệu & AI — Khu Vườn Tri Thức" }, { name: "description", content: "AI được dùng thế nào và giới hạn của ứng dụng." }, { property: "og:title", content: "Giới thiệu Khu Vườn Tri Thức" }, { property: "og:description", content: "AI được dùng thế nào và giới hạn của ứng dụng." }] }),
  component: About,
});

function About() {
  return (
    <div className="min-h-[100dvh] bg-sky-gradient">
      <TopBar />
      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-12">
        <h1 className="text-4xl font-extrabold">Về Khu Vườn Tri Thức</h1>
        <Panel className="space-y-2">
          <h2 className="text-2xl font-bold">AI làm gì</h2>
          <p>Khi giáo viên đã đăng nhập bấm “Gợi ý cùng AI”, máy chủ gửi độ tuổi, thời lượng và lựa chọn vận động tới mô hình AI. AI chỉ được chọn từ danh sách từ vựng và động tác đã duyệt sẵn; kết quả được kiểm tra trước khi hiện ra, và giáo viên phải bấm duyệt mới dùng.</p>
          <p>Nếu AI không hoạt động, ứng dụng hiện “Gợi ý có sẵn” — một gợi ý cố định, không phải AI.</p>
        </Panel>
        <Panel className="space-y-2">
          <h2 className="text-2xl font-bold">Giới hạn</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Giọng đọc là giọng có sẵn của trình duyệt (đọc chữ thành tiếng), không phải AI. Có máy không có giọng tiếng Việt hoặc tiếng Anh; khi đó ứng dụng báo rõ và hiện chữ.</li>
            <li>Ứng dụng không dùng micro hay camera, không chấm phát âm của bé.</li>
            <li>Không có trò chuyện tự do giữa bé và AI.</li>
            <li>Ứng dụng không tự kết luận bé đã thành thạo; chỉ ghi nhận từ bé đã gặp và quan sát của giáo viên.</li>
            <li>Chỉ lưu biệt danh, hình đại diện và nhóm tuổi của bé — không lưu tên thật.</li>
          </ul>
        </Panel>
      </main>
    </div>
  );
}
