import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { useAitDashboard } from "@/hooks/useAit";
import { cn } from "@/lib/utils";

type AitBalancePillProps = {
  className?: string;
};

export default function AitBalancePill({ className }: AitBalancePillProps) {
  const { data } = useAitDashboard();
  const spend = data?.spendBalance ?? 0;

  return (
    <Link
      href="/wallet"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-ait-orange/35 bg-ait-orange/10 px-3 py-1.5 text-sm font-semibold text-ait-orange hover:bg-ait-orange/20 transition-colors",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>{spend.toLocaleString("ru-RU")}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">AIT</span>
    </Link>
  );
}
