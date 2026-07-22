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
      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <AitSurface padding="md" className="text-center space-y-3">
          <h1 className="text-xl font-bold">{t("telegramApp.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {inTelegram ? t("telegramApp.inTelegram") : t("telegramApp.openFromBot")}
          </p>
        </AitSurface>

        <div className="grid gap-3">
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
          <AitButton variant="secondary" className="w-full gap-2" asChild>
            <Link href="/places">
              <Share2 className="h-4 w-4" aria-hidden />
              {t("nav.places")}
            </Link>
          </AitButton>
        </div>
      </div>
    </PublicLayout>
  );
}
