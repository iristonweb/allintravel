import AppLayout from "@/components/app-layout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitHub from "@/components/ait/AitHub";
import { useTranslation } from "react-i18next";

export function Wallet() {
  const { t } = useTranslation();
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <AitSectionHeader title={t("nav.wallet")} description={t("wallet.description")} />
        <AitHub />
      </div>
    </AppLayout>
  );
}

export default Wallet;
