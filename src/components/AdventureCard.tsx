import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Adventure } from "@/lib/content";

const ART: Record<string, string> = {
  garden: "/illustrations/garden-card.webp",
  colors: "/illustrations/colors-card.webp",
  train: "/illustrations/animals-card.webp",
};

export function AdventureCard({ adventure, action = "Vào khám phá", detail }: { adventure: Adventure; action?: string; detail?: string }) {
  return (
    <Link to="/learn/$id" params={{ id: adventure.id }} className={`adventure-card adventure-card--${adventure.id}`} aria-label={`${action}: ${adventure.title}`}>
      <img className="adventure-card__image" src={ART[adventure.id]} alt="" loading="lazy" />
      <span className="adventure-card__copy">
        <span className="adventure-card__title">{adventure.title}</span>
        <span className="adventure-card__detail">{detail || adventure.subtitle}</span>
        <span className="adventure-card__button">{action}<ArrowRight size={21} aria-hidden /></span>
      </span>
    </Link>
  );
}
