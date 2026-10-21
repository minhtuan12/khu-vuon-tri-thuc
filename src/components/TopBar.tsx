import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX, Settings2, CloudCheck, HardDrive, CloudAlert, RefreshCw, LogIn, User } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { updateSettings, useSettings } from "@/lib/settings";
import { cancelSpeech, speak, useVoiceLists, useVoiceStatus } from "@/lib/speech";
import { syncNow, useProgress } from "@/lib/progress";
import { useUser } from "@/lib/auth";
import { AGE_LABELS, type AgeBand } from "@/lib/content";
import { BigButton } from "./kit";

export function SyncBadge() {
  const { user } = useUser();
  const { status, state } = useProgress();
  if (!user)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-bold">
        <HardDrive className="h-4 w-4" aria-hidden /> Lưu trên thiết bị
      </span>
    );
  if (status === "error")
    return (
      <button
        onClick={() => void syncNow()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-sm font-bold"
      >
        <CloudAlert className="h-4 w-4" aria-hidden /> Chưa đồng bộ ({state.pending.length}) · Thử lại
        <RefreshCw className="h-4 w-4" aria-hidden />
      </button>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-3 py-1.5 text-sm font-bold">
      <CloudCheck className="h-4 w-4" aria-hidden /> {status === "syncing" ? "Đang lưu…" : "Đã lưu trực tuyến"}
    </span>
  );
}

export function SoundToggle() {
  const s = useSettings();
  return (
    <BigButton
      size="icon"
      variant="paper"
      aria-pressed={!s.muted}
      aria-label={s.muted ? "Bật âm thanh" : "Tắt âm thanh"}
      onClick={() => {
        if (!s.muted) cancelSpeech();
        updateSettings({ muted: !s.muted });
      }}
    >
      {s.muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
    </BigButton>
  );
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const s = useSettings();
  const lists = useVoiceLists();
  const status = useVoiceStatus();
  return (
    <>
      <BigButton size="icon" variant="paper" aria-label="Cài đặt giọng đọc và chuyển động" onClick={() => setOpen(true)}>
        <Settings2 aria-hidden />
      </BigButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-4xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Cài đặt</DialogTitle>
            <DialogDescription>Giọng đọc dùng sẵn trong trình duyệt của máy này.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <label className="flex min-h-14 items-center justify-between gap-4 font-bold">
              Âm thanh
              <Switch checked={!s.muted} onCheckedChange={(v) => { if (!v) cancelSpeech(); updateSettings({ muted: !v }); }} />
            </label>
            <label className="flex min-h-14 items-center justify-between gap-4 font-bold">
              Giảm chuyển động
              <Switch checked={s.reduceMotion} onCheckedChange={(v) => updateSettings({ reduceMotion: v })} />
            </label>
            <fieldset>
              <legend className="mb-2 font-bold">Độ tuổi của bé</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(AGE_LABELS) as AgeBand[]).map((a) => (
                  <BigButton key={a} variant={s.age === a ? "leaf" : "paper"} aria-pressed={s.age === a} onClick={() => updateSettings({ age: a })}>
                    {AGE_LABELS[a]}
                  </BigButton>
                ))}
              </div>
            </fieldset>
            {(["vi", "en"] as const).map((lang) => (
              <div key={lang}>
                <label className="mb-1 block font-bold" htmlFor={`voice-${lang}`}>
                  {lang === "vi" ? "Giọng tiếng Việt (hướng dẫn)" : "Giọng tiếng Anh (từ vựng)"}
                </label>
                {status[lang] === "ok" ? (
                  <div className="flex gap-2">
                    <select
                      id={`voice-${lang}`}
                      className="min-h-14 flex-1 rounded-2xl border-2 border-input bg-card px-3"
                      value={(lang === "vi" ? s.viVoiceURI : s.enVoiceURI) ?? ""}
                      onChange={(e) => updateSettings(lang === "vi" ? { viVoiceURI: e.target.value || null } : { enVoiceURI: e.target.value || null })}
                    >
                      <option value="">Tự động chọn</option>
                      {lists[lang].map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                      ))}
                    </select>
                    <BigButton variant="sky" onClick={() => speak([lang === "vi" ? { text: "Xin chào bé!", lang } : { text: "Hello! Apple.", lang }])}>
                      Nghe thử
                    </BigButton>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-muted p-3 text-sm">
                    {status[lang] === "loading" ? "Đang tìm giọng đọc…" : status[lang] === "unsupported" ? "Trình duyệt này không hỗ trợ đọc thành tiếng." : `Máy này chưa có giọng ${lang === "vi" ? "tiếng Việt" : "tiếng Anh"}. Chữ vẫn hiển thị đầy đủ; người lớn hãy đọc giúp bé, hoặc cài thêm giọng trong cài đặt hệ điều hành.`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TopBar({ minimal = false }: { minimal?: boolean }) {
  const { user } = useUser();
  return (
    <header className="storybook-header relative z-20">
      <Link to="/" className="school-pill" aria-label="Trang chủ Trường Mầm Non Tô Hiến Thành">
        <span className="school-pill__seal"><img src="/school-logo.jpg" alt="" /></span>
        <span>TRƯỜNG MẦM NON<br /><strong>TÔ HIẾN THÀNH</strong></span>
      </Link>
      <Link to="/" className="storybook-wordmark" aria-label="Khu Vườn Tri Thức">
        <span>Khu</span><span>Vườn</span><span>Tri</span><span>Thức</span>
      </Link>
      <div className="storybook-header__tools">
        {!minimal && (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng">
            {(
              [
                ["/adventures", "Phiêu lưu"],
                ["/progress", "Tiến trình"],
                ["/teacher", "Giáo viên"],
                ["/about", "Giới thiệu"],
              ] as const
            ).map(([to, label]) => (
              <Link key={to} to={to} className="flex min-h-14 items-center rounded-2xl px-3 font-bold hover:bg-white/80" activeProps={{ className: "bg-white/80" }}>
                {label}
              </Link>
            ))}
          </nav>
        )}
        <span className="storybook-header__sync"><SyncBadge /></span>
        <SoundToggle />
        <SettingsDialog />
        <Link to="/auth" className="storybook-avatar tactile" aria-label={user ? "Tài khoản" : "Đăng nhập người lớn"}>
          {user ? <User aria-hidden /> : <LogIn aria-hidden />}
        </Link>
      </div>
    </header>
  );
}
