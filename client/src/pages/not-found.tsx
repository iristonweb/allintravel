import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import AitSurface from "@/components/ait-ui/AitSurface";

export default function NotFound() {
  return (
    <AppLayout contentClassName="px-0" rightRail={<DiscoveryRightRail />}>
      <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center px-4 py-10">
        <AitSurface padding="lg" radius="lg" glow className="w-full max-w-md mx-4 text-center">
          <div className="flex mb-4 gap-2 justify-center items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">404 — Страница не найдена</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Проверьте адрес или вернитесь на главную.
          </p>
          <Link href="/" className="inline-block mt-6">
            <Button variant="premium">На главную</Button>
          </Link>
        </AitSurface>
      </div>
    </AppLayout>
  );
}
