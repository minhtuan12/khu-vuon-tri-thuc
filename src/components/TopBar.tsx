import { Link } from "@tanstack/react-router";
import {
  Volume2,
  VolumeX,
  Settings2,
  CloudCheck,
  HardDrive,
  CloudAlert,
  RefreshCw,
  LogIn,
  User,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { updateSettings, useSettings } from "@/lib/settings";
import {
  cancelSpeech,
  isLikelyFemale,
  pickVoice,
  speak,
  useVoiceLists,
  useVoiceStatus,
} from "@/lib/speech";
import { syncNow, useProgress } from "@/lib/progress";
import { useUser } from "@/lib/auth";
import { AGE_LABELS, type AgeBand } from "@/lib/content";
import { BigButton } from "./kit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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
        <CloudAlert className="h-4 w-4" aria-hidden /> Chưa đồng bộ ({state.pending.length}) · Thử
        lại
        <RefreshCw className="h-4 w-4" aria-hidden />
      </button>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-3 py-1.5 text-sm font-bold">
      <CloudCheck className="h-4 w-4" aria-hidden />{" "}
      {status === "syncing" ? "Đang lưu…" : "Đã lưu trực tuyến"}
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
  const femaleVoices = lists.en.filter(isLikelyFemale);
  const offeredVoices = femaleVoices.length ? femaleVoices : lists.en;
  return (
    <>
      <BigButton
        size="icon"
        variant="paper"
        aria-label="Cài đặt giọng đọc và chuyển động"
        onClick={() => setOpen(true)}
      >
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
              <Switch
                checked={!s.muted}
                onCheckedChange={(v) => {
                  if (!v) cancelSpeech();
                  updateSettings({ muted: !v });
                }}
              />
            </label>
            <label className="flex min-h-14 items-center justify-between gap-4 font-bold">
              Giảm chuyển động
              <Switch
                checked={s.reduceMotion}
                onCheckedChange={(v) => updateSettings({ reduceMotion: v })}
              />
            </label>
            <fieldset>
              <legend className="mb-2 font-bold">Độ tuổi của bé</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(AGE_LABELS) as AgeBand[]).map((a) => (
                  <BigButton
                    key={a}
                    variant={s.age === a ? "leaf" : "paper"}
                    aria-pressed={s.age === a}
                    onClick={() => updateSettings({ age: a })}
                  >
                    {AGE_LABELS[a]}
                  </BigButton>
                ))}
              </div>
            </fieldset>
            <div>
              <label className="mb-1 block font-bold" htmlFor="voice-en">
                Giọng tiếng Anh · ưu tiên giọng nữ
              </label>
              <p className="mb-3 text-sm">
                Chỉ đọc tiếng Anh. Không thu âm hay gửi giọng nói của bé.
              </p>
              {status.en === "ok" ? (
                <>
                  <Select
                    value={
                      offeredVoices.some((v) => v.voiceURI === s.enVoiceURI)
                        ? s.enVoiceURI!
                        : "auto"
                    }
                    onValueChange={(value) => {
                      cancelSpeech();
                      updateSettings({ enVoiceURI: value === "auto" ? null : value });
                    }}
                  >
                    <SelectTrigger id="voice-en" className="min-h-14 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Tự động · ưu tiên giọng nữ</SelectItem>
                      {offeredVoices.map((v) => (
                        <SelectItem key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="my-3 text-sm">
                    Đang dùng: {pickVoice("en")?.name}.{" "}
                    {!femaleVoices.length &&
                      "Chưa nhận diện được giọng nữ trên máy này. Có thể nghe thử hoặc cài thêm giọng nữ tiếng Anh trong cài đặt thiết bị."}
                  </p>
                  <BigButton
                    variant="sky"
                    onClick={() =>
                      void speak([
                        {
                          text: "Hello, little explorer! Let's learn English together.",
                          lang: "en",
                        },
                      ])
                    }
                  >
                    Nghe thử
                  </BigButton>
                </>
              ) : (
                <p className="rounded-2xl bg-muted p-3 text-sm">
                  {status.en === "loading"
                    ? "Đang tìm giọng đọc…"
                    : status.en === "unsupported"
                      ? "Trình duyệt này không hỗ trợ đọc thành tiếng."
                      : "Máy chưa có giọng tiếng Anh. Người lớn có thể đọc mẫu hoặc cài thêm giọng tiếng Anh trong cài đặt thiết bị."}
                </p>
              )}
            </div>
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
        <span className="school-pill__seal">
          <img src="/school-logo.jpg" alt="" />
        </span>
        <span>
          TRƯỜNG MẦM NON
          <br />
          <strong>TÔ HIẾN THÀNH</strong>
        </span>
      </Link>
      <Link to="/" className="storybook-wordmark" aria-label="Khu Vườn Tri Thức">
        <span>Khu</span>
        <span>Vườn</span>
        <span>Tri</span>
        <span>Thức</span>
      </Link>
      <div className="storybook-header__tools">
        {!minimal && (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng">
            {(
              [
                ["/roadmap", "Lộ trình"],
                ["/adventures", "Phiêu lưu"],
                ["/progress", "Tiến trình"],
                ["/teacher", "Giáo viên"],
                ["/about", "Giới thiệu"],
              ] as const
            ).map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="flex min-h-14 items-center rounded-2xl px-3 font-bold hover:bg-white/80"
                activeProps={{ className: "bg-white/80" }}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
        <span className="storybook-header__sync">
          <SyncBadge />
        </span>
        <SoundToggle />
        <SettingsDialog />
        <Link
          to="/auth"
          className="storybook-avatar tactile"
          aria-label={user ? "Tài khoản" : "Đăng nhập người lớn"}
        >
          {user ? <User aria-hidden /> : <LogIn aria-hidden />}
        </Link>
      </div>
    </header>
  );
}
