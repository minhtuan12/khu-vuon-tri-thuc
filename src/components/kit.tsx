import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const bigButton = cva(
  "tactile inline-flex items-center justify-center gap-2 rounded-3xl font-display font-bold disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        leaf: "bg-primary text-primary-foreground",
        sun: "bg-sun text-ink",
        coral: "bg-coral text-ink",
        sky: "bg-sky text-ink",
        paper: "bg-card text-ink border-2 border-border",
        ghost: "bg-transparent text-ink shadow-none hover:bg-muted",
      },
      size: {
        md: "px-5 py-3 text-lg",
        lg: "px-7 py-4 text-2xl",
        xl: "px-10 py-6 text-3xl md:text-4xl",
        icon: "h-14 w-14 p-0 text-xl",
      },
    },
    defaultVariants: { variant: "leaf", size: "md" },
  },
);

export interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof bigButton> {}

export const BigButton = forwardRef<HTMLButtonElement, BigButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(bigButton({ variant, size }), className)} {...props} />
));
BigButton.displayName = "BigButton";

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-4xl border-2 border-border bg-card p-5 shadow-soft md:p-7", className)} {...props} />;
}
