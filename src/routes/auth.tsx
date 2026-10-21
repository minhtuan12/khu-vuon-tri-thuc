import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { BigButton, Panel } from "@/components/kit";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Đăng nhập người lớn — Khu Vườn Tri Thức" }, { name: "description", content: "Giáo viên và phụ huynh đăng nhập để lưu tiến trình trực tuyến." }, { property: "og:title", content: "Đăng nhập người lớn" }, { property: "og:description", content: "Lưu tiến trình trực tuyến an toàn." }] }),
  component: AuthPage,
});

const input = "min-h-14 w-full rounded-2xl border-2 border-input bg-card px-4 text-lg";

function AuthPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      if (error) return void toast.error(error.message);
      toast.success("Hãy kiểm tra email để xác nhận tài khoản.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return void toast.error("Email hoặc mật khẩu chưa đúng.");
      navigate({ to: "/teacher" });
    }
  }

  return (
    <div className="min-h-[100dvh] bg-sky-gradient">
      <TopBar />
      <main className="mx-auto max-w-md px-4 pb-12">
        <Panel>
          {user ? (
            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold">Tài khoản</h1>
              <p>Đang đăng nhập: <b>{user.email}</b>. Tiến trình được lưu trực tuyến.</p>
              <BigButton variant="paper" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }}>Đăng xuất</BigButton>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h1 className="text-3xl font-extrabold">{mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}</h1>
              <p className="text-sm">Chỉ dành cho người lớn. Bé chơi được ngay không cần tài khoản.</p>
              <label className="block font-bold">Email<input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
              <label className="block font-bold">Mật khẩu<input className={input} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} /></label>
              <BigButton type="submit" size="lg" className="w-full" disabled={busy}>{mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}</BigButton>
              {mode === "in" && (
                <button type="button" className="min-h-14 w-full font-bold underline" onClick={async () => {
                  if (!email) return void toast.error("Nhập email trước nhé.");
                  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                  if (error) toast.error(error.message); else toast.success("Đã gửi email đặt lại mật khẩu.");
                }}>Quên mật khẩu?</button>
              )}
              <button type="button" className="min-h-14 w-full font-bold underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
                {mode === "in" ? "Chưa có tài khoản? Tạo mới" : "Đã có tài khoản? Đăng nhập"}
              </button>
            </form>
          )}
        </Panel>
      </main>
    </div>
  );
}
