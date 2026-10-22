import { Link } from "@tanstack/react-router";
import { BookOpen, Home, Sprout, UserRound, Route } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Trang chủ", Icon: Home },
  { to: "/roadmap", label: "Lộ trình", Icon: Route },
  { to: "/adventures", label: "Học tập", Icon: BookOpen },
  { to: "/progress", label: "Vườn của bé", Icon: Sprout },
  { to: "/teacher", label: "Của cô", Icon: UserRound },
] as const;

export function BottomDock() {
  return (
    <nav className="bottom-dock" aria-label="Điều hướng chính">
      {ITEMS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className="bottom-dock__item"
          activeProps={{ className: "bottom-dock__item is-active" }}
          activeOptions={{ exact: true }}
        >
          <Icon aria-hidden size={24} strokeWidth={2.25} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
