import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import { useTranslation } from "react-i18next";
import AitHub from "@/components/ait/AitHub";

export function Wallet() {
  const { t } = useTranslation();
  return (
    <AppLayout>
      <PageShell title={t("nav.wallet")} description={t("wallet.description")}>
        <AitHub />
      </PageShell>
    </AppLayout>
  );
}

export default Wallet;
