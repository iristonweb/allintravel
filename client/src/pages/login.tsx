import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PremiumBackground from "@/components/premium/PremiumBackground";
import { Globe } from "lucide-react";
import { useMemo } from "react";

export function Login() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const error = params.get("error") === "invalid";
  const redirect = params.get("redirect") || "/";

  const formAction = useMemo(() => {
    const q = new URLSearchParams();
    if (redirect && redirect !== "/") q.set("redirect", redirect);
    const qs = q.toString();
    return qs ? `/api/login?${qs}` : "/api/login";
  }, [redirect]);

  return (
    <PremiumBackground contentClassName="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md ait-surface">
        <CardHeader className="space-y-1 flex flex-row items-center gap-2">
          <Globe className="text-primary h-8 w-8" />
          <div>
            <CardTitle className="text-2xl">All In Travel</CardTitle>
            <CardDescription>Войдите, чтобы продолжить</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} method="post" className="space-y-4">
            {error && <p className="text-sm text-destructive">Проверьте email и код доступа.</p>}
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
              <Label htmlFor="password">Код доступа</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Введите код доступа"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" variant="premium" className="w-full">
              Войти
            </Button>
          </form>
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
              const q = redirect && redirect !== "/" ? `?state=${encodeURIComponent(redirect)}` : "";
              window.location.href = `/api/auth/google${q}`;
            }}
          >
            Войти через Google
          </Button>
        </CardContent>
      </Card>
    </PremiumBackground>
  );
}

export default Login;
