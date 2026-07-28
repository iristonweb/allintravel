import AitButton from "@/components/ait-ui/AitButton";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import AitSurface from "@/components/ait-ui/AitSurface";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <AppLayout contentClassName="px-0">
      <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center px-4 py-10">
        <AitSurface padding="lg" radius="lg" glow className="w-full max-w-md mx-4 text-center">
          <div className="flex mb-4 gap-2 justify-center items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">{t("notFound.title")}</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("notFound.description")}</p>
          <Link href="/" className="inline-block mt-6">
            <AitButton variant="primary">{t("notFound.backHome")}</AitButton>
          </Link>
        </AitSurface>
      </div>
    </AppLayout>
  );
}
