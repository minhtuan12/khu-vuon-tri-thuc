import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { BigButton, Panel } from "@/components/kit";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Đặt lại mật khẩu — Khu Vườn Tri Thức" }, { name: "description", content: "Đặt mật khẩu mới cho tài khoản người lớn." }, { property: "og:title", content: "Đặt lại mật khẩu" }, { property: "og:description", content: "Đặt mật khẩu mới." }] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return void toast.error("Liên kết đã hết hạn hoặc không hợp lệ. Hãy gửi lại email.");
    toast.success("Đã đổi mật khẩu.");
    navigate({ to: "/teacher" });
  }
  return (
    <div className="min-h-[100dvh] bg-sky-gradient">
      <TopBar />
      <main className="mx-auto max-w-md px-4 pb-12">
        <Panel>
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-3xl font-extrabold">Đặt mật khẩu mới</h1>
            <label className="block font-bold">Mật khẩu mới
              <input type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className="min-h-14 w-full rounded-2xl border-2 border-input bg-card px-4 text-lg" />
            </label>
            <BigButton type="submit" size="lg" className="w-full" disabled={busy}>Lưu mật khẩu</BigButton>
          </form>
        </Panel>
      </main>
    </div>
  );
}
