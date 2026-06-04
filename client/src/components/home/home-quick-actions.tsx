import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Car,
  Search,
  Shield,
  Utensils,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import GlassCard from "@/components/brand/glass-card";

const services = [
  { label: "Отели", icon: Building2, href: "/places?type=hotel" },
  { label: "Рестораны", icon: Utensils, href: "/places?type=restaurant" },
  { label: "Криптокошелёк", icon: Wallet, href: "/wallet", authOnly: true },
  { label: "Транспорт", icon: Car, soon: true },
  { label: "Страховка", icon: Shield, soon: true },
];

type HomeQuickActionsProps = {
  defaultSearch?: string;
};

export default function HomeQuickActions({ defaultSearch = "" }: HomeQuickActionsProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState(defaultSearch);

  const searchHref = useMemo(() => {
    const q = search.trim();
    return q ? `/places?search=${encodeURIComponent(q)}` : "/map";
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Куда вы хотите?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate(searchHref)}
            className="pl-9 ait-glass-strong"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {services.map(({ label, icon: Icon, href, soon, authOnly }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (authOnly && !isAuthenticated) {
                toast({ title: "Войдите", description: "Кошелёк доступен после входа." });
                navigate("/login");
                return;
              }
              if (soon) {
                toast({ title: "Скоро", description: `${label} появится в следующем обновлении.` });
                return;
              }
              navigate(href!);
            }}
            className="ait-glass rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/8 transition-colors"
          >
            <Icon className="h-6 w-6 text-ait-purple" />
            <span className="text-xs text-center text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Куда вы хотите?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigate(searchHref)}
                className="pl-9 ait-glass-strong"
              />
            </div>
            <Button variant="premium" onClick={() => navigate(searchHref)}>
              Найти
            </Button>
          </div>
        </div>
        <GlassCard className="p-4 flex items-center justify-center">
          <Button variant="outline" className="w-full" onClick={() => navigate("/map")}>
            Открыть интерактивную карту
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
