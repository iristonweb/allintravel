import { useState } from "react";
import { Link } from "wouter";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformWallet, useWalletTransfer } from "@/hooks/usePlatformWallet";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Copy, QrCode, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

type PlatformWalletCardProps = {
  compact?: boolean;
  /** On /wallet page — hide link back to hub */
  embedded?: boolean;
  className?: string;
};

export default function PlatformWalletCard({
  compact,
  embedded,
  className,
}: PlatformWalletCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch } = usePlatformWallet();
  const transferMutation = useWalletTransfer();
  const [sendOpen, setSendOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const copyAddress = async () => {
    if (!data?.address) return;
    await navigator.clipboard.writeText(data.address);
    toast({ title: t("wallet.platform.copied") });
  };

  const handleSend = () => {
    const amt = Number(amount);
    if (!recipient.trim() || !Number.isFinite(amt) || amt <= 0) return;
    transferMutation.mutate(
      { username: recipient.trim(), amount: amt },
      {
        onSuccess: () => {
          toast({ title: t("wallet.platform.sent") });
          setSendOpen(false);
          setRecipient("");
          setAmount("");
        },
        onError: (err: Error) => {
          toast({
            title: t("wallet.platform.sendError"),
            description: err.message.replace(/^\d+:\s*/, ""),
            variant: "destructive",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <GlassCard strong className={cn("p-5", className)}>
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-16 w-full" />
      </GlassCard>
    );
  }

  if (isError || !data) {
    return (
      <GlassCard className={cn("p-5 text-center space-y-3", className)}>
        <p className="text-sm text-muted-foreground">{t("wallet.platform.loadError")}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </GlassCard>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(data.address)}`;

  return (
    <GlassCard
      strong
      className={cn("relative overflow-hidden p-5 md:p-6", compact && "p-4", className)}
    >
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-ait-purple/20 blur-3xl" />
      <div className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-ait-orange/15 blur-2xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-ait-orange">
          <Wallet className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            {t("wallet.platform.title")}
          </span>
        </div>
        {!compact && !embedded ? (
          <Link href="/wallet">
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              {t("wallet.platform.openHub")}
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="relative mt-4 flex flex-wrap gap-4 items-end justify-between">
        <div>
          <p className="text-3xl font-bold tabular-nums">
            {data.spendBalance.toLocaleString()}
            <span className="text-base font-semibold text-muted-foreground ml-2">AIT</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("wallet.platform.spendBalance")}</p>
          <p className="text-sm text-ait-cyan tabular-nums mt-2">
            {data.creatorBalance.toLocaleString()} Creator AIT
          </p>
        </div>
        {!compact ? (
          <img
            src={qrUrl}
            alt=""
            className="h-24 w-24 rounded-xl border border-white/10 bg-white p-1"
            width={96}
            height={96}
          />
        ) : (
          <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-ait-purple" />
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <code className="text-xs sm:text-sm font-mono truncate flex-1 text-foreground/90">
          {data.address}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => void copyAddress()}
          aria-label={t("wallet.platform.copy")}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {data.username ? (
        <p className="relative mt-2 text-xs text-muted-foreground">
          {t("wallet.platform.receiveHint", { username: `@${data.username}` })}
        </p>
      ) : null}

      {!compact ? (
        <div className="relative mt-4 space-y-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setSendOpen((v) => !v)}
          >
            {t("wallet.platform.send")}
          </Button>
          {sendOpen ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_6rem_auto]">
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={t("wallet.platform.recipientPlaceholder")}
                className="h-10 rounded-xl bg-white/5 border-white/10"
              />
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="AIT"
                className="h-10 rounded-xl bg-white/5 border-white/10"
              />
              <Button
                variant="premium"
                className="rounded-xl"
                disabled={transferMutation.isPending}
                onClick={handleSend}
              >
                {t("wallet.platform.send")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <Link href="/wallet" className="relative mt-4 inline-block">
          <Button variant="premium" size="sm" className="rounded-xl w-full sm:w-auto">
            {t("wallet.platform.manage")}
          </Button>
        </Link>
      )}
    </GlassCard>
  );
}
