import { useEffect } from "react";
import { Link } from "wouter";
import { initTelegramMiniApp, isTelegramMiniApp } from "@/lib/telegram";
import PublicLayout from "@/components/public-layout";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Map, Route, Share2 } from "lucide-react";

export default function TelegramAppPage() {
  useEffect(() => {
    initTelegramMiniApp();
  }, []);

  const inTelegram = isTelegramMiniApp();

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <GlassCard className="p-6 text-center space-y-3">
          <h1 className="text-xl font-bold">All In Travel</h1>
          <p className="text-sm text-muted-foreground">
            {inTelegram
              ? "Telegram Mini App — планируйте и делитесь маршрутами прямо в чате."
              : "Откройте эту страницу из Telegram-бота для полного опыта Mini App."}
          </p>
        </GlassCard>

        <div className="grid gap-3">
          <Button variant="premium" className="w-full gap-2 rounded-2xl" asChild>
            <Link href="/map">
              <Map className="h-4 w-4" />
              Карта
            </Link>
          </Button>
          <Button variant="outline" className="w-full gap-2 rounded-2xl" asChild>
            <Link href="/trips">
              <Route className="h-4 w-4" />
              Мои поездки
            </Link>
          </Button>
          <Button variant="outline" className="w-full gap-2 rounded-2xl" asChild>
            <Link href="/places">
              <Share2 className="h-4 w-4" />
              Места
            </Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
