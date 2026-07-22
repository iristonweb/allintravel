import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import TravelIdentityCard from "@/components/identity/TravelIdentityCard";
import EconomyContextBar from "@/components/ait/EconomyContextBar";
import AiContextChips from "@/components/ai/AiContextChips";
import FogOfWarMap from "@/components/passport/FogOfWarMap";
import PassportPageSkeleton from "@/components/passport/PassportPageSkeleton";
import PageMeta from "@/components/seo/PageMeta";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import { Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { sharePassportProfile } from "@/lib/passport-share";
import { useAitDashboard } from "@/hooks/useAit";
import { useQuery } from "@tanstack/react-query";
import { apiRequestJson } from "@/lib/queryClient";

export function PassportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isLoading: aitLoading } = useAitDashboard(true);
  const { isLoading: fogLoading } = useQuery({
    queryKey: ["/api/passport/fog-map"],
    queryFn: () => apiRequestJson("GET", "/api/passport/fog-map"),
    enabled: Boolean(user),
  });
  const pageLoading = Boolean(user) && (aitLoading || fogLoading);

  const handleShare = async () => {
    const handle = user?.username;
    if (!handle) return;
    await sharePassportProfile(handle, t, toast);
  };

  return (
    <AppLayout rightRail={<DiscoveryRightRail />}>
      <PageMeta title={t("passport.title")} description={t("passport.subtitle")} path="/passport" />
      <ReelsPageLayout
        header={
          <AitSectionHeader
            title={t("passport.title")}
            description={t("passport.subtitle")}
            actions={
              <AitButton
                variant="glass"
                className="gap-2"
                onClick={handleShare}
                disabled={!user?.username}
                aria-label={t("passport.shareCard")}
              >
                <Share2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                {t("passport.shareCard")}
              </AitButton>
            }
          />
        }
        stats={
          <div className="space-y-3">
            <EconomyContextBar surface="passport" />
            <AiContextChips surface="passport" />
          </div>
        }
        feed={
          pageLoading ? (
            <PassportPageSkeleton />
          ) : (
            <div className="space-y-section">
              <TravelIdentityCard embedded />
              <FogOfWarMap />
            </div>
          )
        }
      />
    </AppLayout>
  );
}

export default PassportPage;
