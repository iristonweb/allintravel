import { useEffect } from "react";
import { Link } from "wouter";
import { initTelegramMiniApp, isTelegramMiniApp } from "@/lib/telegram";
import PublicLayout from "@/components/public-layout";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import { Map, Route, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TelegramAppPage() {
  const { t } = useTranslation();

  useEffect(() => {
    initTelegramMiniApp();
  }, []);

  const inTelegram = isTelegramMiniApp();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md space-y-8 px-4 py-12">
        <div className="space-y-3 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ait-orange">Telegram</p>
          <h1 className="ait-section-title text-2xl">{t("telegramApp.title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {inTelegram ? t("telegramApp.inTelegram") : t("telegramApp.openFromBot")}
          </p>
        </div>

        <AitSurface padding="md" className="grid gap-3">
          <AitButton className="w-full gap-2" asChild>
            <Link href="/map">
              <Map className="h-4 w-4" aria-hidden />
              {t("nav.map")}
            </Link>
          </AitButton>
          <AitButton variant="secondary" className="w-full gap-2" asChild>
            <Link href="/trips">
              <Route className="h-4 w-4" aria-hidden />
              {t("telegramApp.myTrips")}
            </Link>
          </AitButton>
          <AitButton variant="glass" className="w-full gap-2" asChild>
            <Link href="/social-feed">
              <Share2 className="h-4 w-4" aria-hidden />
              {t("nav.feed")}
            </Link>
          </AitButton>
        </AitSurface>
      </div>
    </PublicLayout>
  );
}
