import { LifeBuoy } from "lucide-react";

const repository = "https://github.com/Sitenovastudio/restaurant-pos";
const upstream = "https://github.com/Raktim94/nodedr-restaurant-pos";

export function BrandFooter({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border px-1 py-3 text-center">
        <a href={repository} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium leading-tight text-sidebar-foreground/70 hover:underline">SiteNova</a>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border px-4 py-3">
      <a
        href={repository + "/issues"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-border px-3 py-1.5 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LifeBuoy className="h-3.5 w-3.5" />
        SiteNova support
      </a>
      <p className="text-left text-[11px] leading-relaxed text-sidebar-foreground/60">
        SiteNova customization of{" "}
        <a href={upstream} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
          OrderRestro by NodeDR
        </a>
      </p>
    </div>
  );
}
