import { useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PublicLayout from "@/components/public-layout";
import AppLayout from "@/components/app-layout";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip } from "@shared/schema";
import { Users, LogIn } from "lucide-react";

type InvitePreview = {
  trip: Trip;
  stopCount: number;
  referrerId: string;
};

export default function TripJoinPage() {
  const { token } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<InvitePreview>({
    queryKey: ["/api/trips/invite", token],
    queryFn: () => apiRequestJson("GET", `/api/trips/invite/${token}`),
    enabled: !!token,
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      apiRequestJson<{ trip: Trip; referralApplied: boolean }>(
        "POST",
        `/api/trips/invite/${token}/join`,
      ),
    onSuccess: (result) => {
      toast({
        title: "Вы в поездке!",
        description: result.referralApplied ? "Реферальный бонус AIT начислен." : undefined,
      });
      navigate(`/trips/${result.trip.id}`);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const joinedRef = useRef(false);
  useEffect(() => {
    if (!authLoading && isAuthenticated && data && token && !joinedRef.current) {
      joinedRef.current = true;
      joinMutation.mutate();
    }
  }, [authLoading, isAuthenticated, data, token, joinMutation]);

  const Layout = isAuthenticated ? AppLayout : PublicLayout;

  if (isLoading || authLoading) {
    return (
      <Layout>
        <div className="h-48 animate-pulse bg-muted rounded-2xl" />
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <p className="text-muted-foreground text-center">Приглашение не найдено или устарело.</p>
      </Layout>
    );
  }

  return (
    <Layout contentClassName="py-12">
      <GlassCard className="p-8 max-w-lg mx-auto text-center space-y-4">
        <Users className="h-10 w-10 mx-auto text-primary" />
        <h1 className="text-xl font-bold">Приглашение в поездку</h1>
        <p className="text-muted-foreground">
          «{data.trip.title}» · {data.trip.destination}
        </p>
        <p className="text-sm">{data.stopCount} остановок в маршруте</p>
        {!isAuthenticated ? (
          <Button variant="premium" className="gap-2" asChild>
            <Link href={`/login?redirect=${encodeURIComponent(`/trips/join/${token}`)}`}>
              <LogIn className="h-4 w-4" />
              Войти и присоединиться
            </Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Присоединяем…</p>
        )}
      </GlassCard>
    </Layout>
  );
}
