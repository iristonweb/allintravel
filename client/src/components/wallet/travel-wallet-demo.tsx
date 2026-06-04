import { useEffect, useState } from "react";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftRight, Wallet } from "lucide-react";
const STORAGE_KEY = "ait-demo-wallet";

type StoredWallet = {
  tokens: number;
  rewardsPoints: number;
  cashbackUsd: number;
  eur: number;
  usdt: number;
};

const DEFAULT: StoredWallet = {
  tokens: 120,
  rewardsPoints: 450,
  cashbackUsd: 12.5,
  eur: 320,
  usdt: 85,
};

function loadWallet(): StoredWallet {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT };
}

function saveWallet(w: StoredWallet) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
}

const RATES: Record<string, Record<string, number>> = {
  USDT: { EUR: 0.92, USDT: 1 },
  EUR: { USDT: 1.09, EUR: 1 },
};

export default function TravelWalletDemo() {
  const { toast } = useToast();
  const [balances, setBalances] = useState<StoredWallet>(loadWallet);
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState("USDT");
  const [to, setTo] = useState("EUR");

  useEffect(() => {
    saveWallet(balances);
  }, [balances]);

  const handleExchange = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast({ title: "Введите сумму", variant: "destructive" });
      return;
    }
    if (from === to) {
      toast({ title: "Выберите разные валюты", variant: "destructive" });
      return;
    }

    const keyFrom = from === "USDT" ? "usdt" : "eur";
    const keyTo = to === "USDT" ? "usdt" : "eur";
    if (balances[keyFrom] < value) {
      toast({ title: "Недостаточно средств (демо)", variant: "destructive" });
      return;
    }

    const rate = RATES[from]?.[to] ?? 1;
    const received = value * rate;

    setBalances((prev) => ({
      ...prev,
      [keyFrom]: prev[keyFrom] - value,
      [keyTo]: prev[keyTo] + received,
      tokens: prev.tokens + Math.floor(received * 2),
    }));
    setAmount("");
    toast({
      title: "Обмен выполнен (демо)",
      description: `${value} ${from} → ${received.toFixed(2)} ${to}`,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="rounded-2xl border border-ait-orange/30 bg-ait-orange/10 px-4 py-3 text-sm text-ait-orange">
        Демо-режим — без реальных транзакций. Удобно получать и менять валюту в поездке.
      </div>

      <GlassCard strong className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl ait-btn-glow flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Travel Wallet</h2>
            <p className="text-sm text-muted-foreground">Балансы для путешествий</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "USDT", value: balances.usdt.toFixed(2) },
            { label: "EUR", value: balances.eur.toFixed(2) },
            { label: "Points", value: String(balances.rewardsPoints) },
            { label: "Cashback", value: `$${balances.cashbackUsd}` },
          ].map((b) => (
            <div key={b.label} className="ait-glass rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{b.label}</p>
              <p className="text-lg font-bold mt-1">{b.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard strong className="p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-ait-purple" />
          Обмен для туристов
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Из</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="ait-glass-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Сумма</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="ait-glass-strong"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>В</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="ait-glass-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="w-full ait-btn-glow text-white rounded-2xl" onClick={handleExchange}>
          Обменять (демо)
        </Button>
      </GlassCard>
    </div>
  );
}
