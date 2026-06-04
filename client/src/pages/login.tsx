import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AmbientBackground from "@/components/premium/AmbientBackground";
import BrandLogo from "@/components/brand/brand-logo";
import { SITE_DESCRIPTION_SHORT, SITE_TAGLINE } from "@/lib/site-meta";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

type AuthConfig = {
  googleOAuth: boolean;
  emailSignup: boolean;
};

async function fetchAuthConfig(): Promise<AuthConfig> {
  try {
    const res = await fetch("/api/auth/config", { credentials: "include" });
    if (!res.ok) {
      return { googleOAuth: false, emailSignup: true };
    }
    return (await res.json()) as AuthConfig;
  } catch {
    return { googleOAuth: false, emailSignup: true };
  }
}

export function Login() {
  const [, navigate] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const urlError = params.get("error");
  const redirect = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<"invalid" | "server" | null>(
    urlError === "invalid" ? "invalid" : urlError === "server" ? "server" : null,
  );

  const { data: authConfig } = useQuery({
    queryKey: ["/api/auth/config"],
    queryFn: fetchAuthConfig,
    staleTime: Infinity,
  });

  const googleEnabled = authConfig?.googleOAuth ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const body = new URLSearchParams();
    body.set("email", email.trim());
    body.set("password", password);

    const qs =
      redirect && redirect !== "/"
        ? `?redirect=${encodeURIComponent(redirect)}`
        : "";

    try {
      const res = await fetch(`/api/login${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        credentials: "include",
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("Location") || redirect;
        const target = location.startsWith("http")
          ? new URL(location).pathname + new URL(location).search
          : location;
        if (target.includes("/login") && target.includes("error=invalid")) {
          setFormError("invalid");
          setSubmitting(false);
          return;
        }
        if (target.includes("/login") && target.includes("error=server")) {
          setFormError("server");
          setSubmitting(false);
          return;
        }
        window.location.assign(target);
        return;
      }

      if (res.ok) {
        window.location.assign(redirect);
        return;
      }

      setFormError("server");
    } catch {
      setFormError("server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AmbientBackground className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mb-4">
        <Link href="/" className="text-sm text-slate-400 hover:text-ait-purple transition-colors">
          ← На главную
        </Link>
      </div>
      <Card className="w-full max-w-md ait-glass-strong ait-gradient-border">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <BrandLogo href="/" variant="nav" className="justify-center" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-ait-purple font-medium">
              {SITE_TAGLINE}
            </p>
            <CardDescription className="text-base leading-relaxed">
              {SITE_DESCRIPTION_SHORT}
            </CardDescription>
            <p className="text-sm text-muted-foreground">
              Вход или регистрация по email — аккаунт создаётся при первом входе
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError === "invalid" && (
              <p className="text-sm text-destructive">Неверный email или пароль.</p>
            )}
            {formError === "server" && (
              <p className="text-sm text-destructive">
                Ошибка сервера при входе. Проверьте DATABASE_URL на Vercel и выполните{" "}
                <code className="text-ait-purple">npm run db:push</code> для обновления схемы БД.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="например@mail.ru"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                При первом входе аккаунт создаётся автоматически — откроется личный кабинет со всеми
                функциями.
              </p>
            </div>
            <Button type="submit" variant="premium" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Входим…
                </>
              ) : (
                "Войти / зарегистрироваться"
              )}
            </Button>
          </form>
          {googleEnabled && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">или</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={() => {
                  const q =
                    redirect && redirect !== "/" ? `?state=${encodeURIComponent(redirect)}` : "";
                  window.location.href = `/api/auth/google${q}`;
                }}
              >
                Войти через Google
              </Button>
            </>
          )}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Уже есть аккаунт?{" "}
            <button
              type="button"
              className="text-ait-purple hover:underline"
              onClick={() => navigate("/login")}
            >
              Обновить страницу
            </button>
          </p>
        </CardContent>
      </Card>
    </AmbientBackground>
  );
}

export default Login;
