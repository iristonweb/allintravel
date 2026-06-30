import HomeSectionHeader from "@/components/home/home-section-header";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type HomeCommunityProps = {
  friendsCount: number;
};

export default function HomeCommunity({ friendsCount }: HomeCommunityProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <HomeSectionHeader
        title={t("home.community.title")}
        description={t("home.community.description")}
        rightSlot={
          <Link href="/social-feed">
            <Button variant="glass" size="sm">
              {t("home.community.feed")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard hover className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("home.community.yourFriends")}</p>
              <p className="text-4xl font-bold mt-1 ait-gradient-text">{friendsCount}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("home.community.friendsHint")}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl ait-nav-active flex items-center justify-center">
              <Users className="h-6 w-6 text-ait-purple" />
            </div>
          </div>
          <div className="mt-5">
            <Link href="/friends">
              <Button variant="premium">{t("home.community.findFriends")}</Button>
            </Link>
          </div>
        </GlassCard>

        <GlassCard hover className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("home.community.groupChat")}</p>
              <p className="text-lg font-semibold mt-1">{t("home.community.groupChatTitle")}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("home.community.groupChatHint")}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl ait-nav-active flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-ait-orange" />
            </div>
          </div>
          <div className="mt-5">
            <Link href="/chat">
              <Button variant="glass">{t("home.community.openChat")}</Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
