import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import PassportCard from "@/components/passport/PassportCard";
import FogOfWarMap from "@/components/passport/FogOfWarMap";
import PageMeta from "@/components/seo/PageMeta";
import { useTranslation } from "react-i18next";

export function PassportPage() {
  const { t } = useTranslation();

  return (
    <AppLayout>
      <PageMeta title={t("passport.title")} description={t("passport.subtitle")} path="/passport" />
      <PageShell title={t("passport.title")} description={t("passport.subtitle")}>
      <div className="max-w-2xl mx-auto space-y-6">
        <PassportCard />
        <FogOfWarMap />
      </div>
      </PageShell>
    </AppLayout>
  );
}

export default PassportPage;
