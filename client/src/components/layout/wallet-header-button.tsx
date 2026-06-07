import { Link } from "wouter";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type WalletHeaderButtonProps = {
  className?: string;
};

/** Быстрый вход в демо-кошелёк AIT рядом с аватаром */
export default function WalletHeaderButton({ className }: WalletHeaderButtonProps) {
  return (
    <Link
      href="/wallet"
      aria-label="Криптокошелёк AIT"
      title="AIT Hub — криптокошелёк платформы"
      className={cn(
        "group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
        "border border-white/10 bg-white/[0.06] backdrop-blur-sm",
        "transition-all duration-200 hover:border-ait-purple/45 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple/60",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 ait-gradient-border"
        aria-hidden
      />
      <span
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ait-purple/30 via-[#5b21b6]/20 to-ait-orange/25"
        aria-hidden
      >
        <Wallet
          className="h-[18px] w-[18px] text-white drop-shadow-[0_0_8px_rgba(139,92,246,0.65)] transition-transform duration-200 group-hover:scale-110"
          strokeWidth={2.2}
        />
      </span>
      <span
        className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-ait-purple to-ait-orange px-1 text-[8px] font-bold text-white shadow-md ring-2 ring-[#050816]"
        aria-hidden
      >
        AIT
      </span>
    </Link>
  );
}
