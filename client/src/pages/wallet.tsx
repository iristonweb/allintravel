import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitHub from "@/components/ait/AitHub";
import { useTranslation } from "react-i18next";

export function Wallet() {
  const { t } = useTranslation();
  return (
    <AppLayout rightRail={<DiscoveryRightRail />}>
      <ReelsPageLayout
        header={<AitSectionHeader title={t("nav.wallet")} description={t("wallet.description")} />}
        feed={<AitHub />}
      />
    </AppLayout>
  );
}

export default Wallet;
