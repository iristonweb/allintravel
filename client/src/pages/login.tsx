import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AmbientBackground from "@/components/premium/AmbientBackground";
import { Globe } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

type AuthConfig = {
  googleOAuth: boolean;
  emailSignup: boolean;
};

export function Login() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const error = params.get("error") === "invalid";
  const redirect = params.get("redirect") || "/";

  const { data: authConfig } = useQuery<AuthConfig>({
    queryKey: ["/api/auth/config"],
    staleTime: Infinity,
  });

  const formAction = useMemo(() => {
    const q = new URLSearchParams();
    if (redirect && redirect !== "/") q.set("redirect", redirect);
    const qs = q.toString();
    return qs ? `/api/login?${qs}` : "/api/login";
  }, [redirect]);

  const googleEnabled = authConfig?.googleOAuth ?? false;

  return (
    <AmbientBackground className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md ait-glass-strong ait-gradient-border">
        <CardHeader className="space-y-1 flex flex-row items-center gap-2">
          <Globe className="text-primary h-8 w-8" />
          <div>
            <CardTitle className="text-2xl">All In Travel</CardTitle>
            <CardDescription>
              Вход или регистрация по email — аккаунт создаётся при первом входе
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} method="post" className="space-y-4">
            {error && (
              <p className="text-sm text-destructive">Неверный email или пароль.</p>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Минимум 8 символов"
                autoComplete="current-password"
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                При первом входе аккаунт создаётся автоматически — откроется личный кабинет со всеми
                функциями.
              </p>
            </div>
            <Button type="submit" variant="premium" className="w-full">
              Войти / зарегистрироваться
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
        </CardContent>
      </Card>
    </AmbientBackground>
  );
}

export default Login;
