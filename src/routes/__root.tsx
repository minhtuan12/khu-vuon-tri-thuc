import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { attachUser } from "@/lib/progress";
import { cancelSpeech } from "@/lib/speech";
import { useSettings } from "@/lib/settings";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-gradient px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Không tìm thấy trang</h2>
        <p className="mt-2 text-muted-foreground">Lối đi này chưa có trong khu vườn.</p>
        <div className="mt-6">
          <Link to="/" className="tactile inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-3 font-bold text-primary-foreground">
            Về khu vườn
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Trang chưa tải được</h1>
        <p className="mt-2 text-muted-foreground">Tiến trình của bé vẫn được giữ trên thiết bị.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="tactile inline-flex items-center justify-center rounded-3xl bg-primary px-6 py-3 font-bold text-primary-foreground"
          >
            Thử lại
          </button>
          <a href="/" className="tactile inline-flex items-center justify-center rounded-3xl border-2 border-border bg-card px-6 py-3 font-bold">
            Về khu vườn
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Khu Vườn Tri Thức — Trường Mầm Non Tô Hiến Thành" },
      { name: "description", content: "Khu vườn truyện tranh giúp bé 3–6 tuổi làm quen tiếng Anh qua nghe, chọn và vận động." },
      { name: "author", content: "Trường Mầm Non Tô Hiến Thành" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/school-logo.jpg", type: "image/jpeg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;700;800&display=swap&subset=vietnamese",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const settings = useSettings();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => attachUser(data.user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void attachUser(session?.user?.id ?? null);
      router.invalidate();
    });
    const unsub = router.subscribe("onBeforeNavigate", () => cancelSpeech());
    return () => {
      data.subscription.unsubscribe();
      unsub();
    };
  }, [router]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", settings.reduceMotion);
  }, [settings.reduceMotion]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
