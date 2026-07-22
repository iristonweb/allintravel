import PublicLayout from "@/components/public-layout";
import AitButton from "@/components/ait-ui/AitButton";
import { Lock } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export function RequireLogin() {
  const { t } = useTranslation();
  const [location] = useLocation();

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return location || "/";
    const path = window.location.pathname + window.location.search + window.location.hash;
    return path || "/";
  }, [location]);

  const loginHref = useMemo(() => {
    const q = new URLSearchParams();
    q.set("redirect", redirectTo);
    return `/login?${q.toString()}`;
  }, [redirectTo]);

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t("requireLogin.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("requireLogin.description")}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href={loginHref}>
              <AitButton variant="primary">{t("requireLogin.signIn")}</AitButton>
            </Link>
            <Link href="/">
              <AitButton variant="secondary">{t("requireLogin.backHome")}</AitButton>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default RequireLogin;
