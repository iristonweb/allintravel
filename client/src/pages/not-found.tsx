import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";

export default function NotFound() {
  return (
    <AppLayout contentClassName="px-0">
      <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md mx-4 ait-surface">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">404 — Страница не найдена</h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Проверьте адрес или вернитесь на главную.
            </p>
            <Link href="/" className="inline-block mt-4">
              <Button variant="premium">На главную</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
