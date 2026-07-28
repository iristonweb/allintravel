import AppLayout from "@/components/app-layout";
import AitSurface from "@/components/ait-ui/AitSurface";
import { useTranslation } from "react-i18next";

export function Privacy() {
  const { t } = useTranslation();
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6 p-4 pb-12">
        <h1 className="text-2xl font-semibold">{t("privacy.title")}</h1>

        <AitSurface padding="md" className="space-y-3">
          <h2 className="text-lg font-semibold">{t("privacy.dataTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("privacy.dataBody1")}</p>
          <p className="text-sm text-muted-foreground">{t("privacy.dataBody2")}</p>
        </AitSurface>

        <AitSurface padding="md" className="space-y-3">
          <h2 className="text-lg font-semibold">{t("privacy.rightsTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("privacy.rightsBody1")}</p>
          <p className="text-sm text-muted-foreground">{t("privacy.rightsBody2")}</p>
        </AitSurface>

        <AitSurface padding="md">
          <h2 className="text-lg font-semibold mb-3">{t("privacy.cookiesTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("privacy.cookiesBody")}</p>
        </AitSurface>
      </div>
    </AppLayout>
  );
}

export default Privacy;
