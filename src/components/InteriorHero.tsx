type InteriorHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  image?: "garden" | "colors" | "animals";
  compact?: boolean;
};

export function InteriorHero({ eyebrow, title, description, image = "garden", compact = false }: InteriorHeroProps) {
  return (
    <section className={`interior-hero interior-hero--${image}${compact ? " interior-hero--compact" : ""}`} aria-label={title}>
      <div className="interior-hero__copy">
        <span className="interior-hero__eyebrow">✦ {eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <img src={`/illustrations/${image}-card.webp`} alt="" aria-hidden="true" />
    </section>
  );
}
