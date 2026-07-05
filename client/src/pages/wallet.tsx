import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import PageShell from "@/components/layout/page-shell";
import { useTranslation } from "react-i18next";
import AitHub from "@/components/ait/AitHub";

export function Wallet() {
  const { t } = useTranslation();
  return (
    <AppLayout rightRail={<DiscoveryRightRail />}>
      <PageShell title={t("nav.wallet")} description={t("wallet.description")}>
        <AitHub />
      </PageShell>
    </AppLayout>
  );
}

export default Wallet;
