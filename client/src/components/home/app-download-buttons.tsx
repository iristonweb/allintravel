import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Apple, Smartphone, Monitor } from "lucide-react";
import { APP_STORE_URL, PLAY_STORE_URL, WINDOWS_STORE_URL } from "@/lib/site-meta";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Platform = "ios" | "android" | "windows";

function detectPrimaryPlatform(): Platform {
  if (typeof navigator === "undefined") return "android";
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if ((navigator as Navigator & { platform?: string }).platform === "MacIntel") return "ios";
  return "windows";
}

const platforms: {
  id: Platform;
  label: string;
  short: string;
  icon: typeof Apple;
  url: string;
}[] = [
  { id: "ios", label: "App Store", short: "iOS", icon: Apple, url: APP_STORE_URL },
  { id: "android", label: "Google Play", short: "Android", icon: Smartphone, url: PLAY_STORE_URL },
  {
    id: "windows",
    label: "Microsoft Store",
    short: "Windows",
    icon: Monitor,
    url: WINDOWS_STORE_URL,
  },
];

export default function AppDownloadButtons({ className }: { className?: string }) {
  const { toast } = useToast();
  const primary = useMemo(() => detectPrimaryPlatform(), []);

  const ordered = useMemo(() => {
    const p = platforms.find((x) => x.id === primary)!;
    const rest = platforms.filter((x) => x.id !== primary);
    return [p, ...rest];
  }, [primary]);

  const openStore = (url: string, label: string) => {
    if (!url) {
      toast({ title: "Скоро", description: `${label} появится в ближайшем обновлении.` });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const [main, ...others] = ordered;

  return (
    <div className={cn("flex flex-col items-center gap-4 w-full max-w-md", className)}>
      <Button
        size="lg"
        className="w-full ait-btn-glow rounded-2xl text-white font-semibold h-12"
        onClick={() => openStore(main.url, main.label)}
      >
        <main.icon className="h-5 w-5 mr-2" />
        Скачать для {main.short}
        {!main.url && <span className="ml-2 text-xs opacity-80">(скоро)</span>}
      </Button>
      <div className="flex flex-wrap justify-center gap-2 w-full">
        {others.map((p) => (
          <Button
            key={p.id}
            variant="ghost"
            size="sm"
            className="rounded-full text-slate-400 hover:text-white border border-white/10"
            onClick={() => openStore(p.url, p.label)}
          >
            <p.icon className="h-4 w-4 mr-1.5" />
            {p.short}
          </Button>
        ))}
      </div>
    </div>
  );
}
