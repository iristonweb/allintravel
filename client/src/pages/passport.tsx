import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import PageShell from "@/components/layout/page-shell";
import TravelIdentityCard from "@/components/identity/TravelIdentityCard";
import EconomyContextBar from "@/components/ait/EconomyContextBar";
import FogOfWarMap from "@/components/passport/FogOfWarMap";
import PageMeta from "@/components/seo/PageMeta";
import { useTranslation } from "react-i18next";

export function PassportPage() {
  const { t } = useTranslation();

  return (
    <AppLayout rightRail={<DiscoveryRightRail />}>
      <PageMeta title={t("passport.title")} description={t("passport.subtitle")} path="/passport" />
      <PageShell title={t("passport.title")} description={t("passport.subtitle")}>
        <div className="space-y-section">
          <TravelIdentityCard />
          <EconomyContextBar surface="passport" />
          <FogOfWarMap />
        </div>
      </PageShell>
    </AppLayout>
  );
}

export default PassportPage;
