import AppLayout from "@/components/app-layout";
import PassportCard from "@/components/passport/PassportCard";
import PageMeta from "@/components/seo/PageMeta";
import { useTranslation } from "react-i18next";

export function PassportPage() {
  const { t } = useTranslation();

  return (
    <AppLayout>
      <PageMeta title={t("passport.title")} description={t("passport.subtitle")} path="/passport" />
      <div className="max-w-2xl mx-auto space-y-6">
        <PassportCard />
      </div>
    </AppLayout>
  );
}

export default PassportPage;
