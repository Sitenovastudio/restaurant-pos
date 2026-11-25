import { cn } from "@/lib/utils";

export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span
      role="img"
      aria-label="SiteNova"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-primary font-bold tracking-tight text-primary-foreground shadow-sm",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(14, Math.round(size * 0.52)) }}
    >
      S
    </span>
  );
}
