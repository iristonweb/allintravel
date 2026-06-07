import PublicLayout from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "wouter";

export function RequireLogin() {
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
          <h1 className="text-2xl font-bold mb-2">Нужно войти</h1>
          <p className="text-muted-foreground mb-6">
            Эта страница доступна после авторизации. После входа мы вернём вас туда, куда вы
            переходили.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href={loginHref}>
              <Button variant="premium">Войти</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">На главную</Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default RequireLogin;
