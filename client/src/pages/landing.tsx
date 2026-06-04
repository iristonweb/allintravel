import PublicLayout from "@/components/public-layout";
import CinematicHero from "@/components/premium/CinematicHero";
import FeatureCard from "@/components/marketing/FeatureCard";
import HeroStats from "@/components/home/hero-stats";
import HomeMapSection from "@/components/home/home-map-section";
import HomePlannerSection from "@/components/home/home-planner-section";
import HomeCommunityPreview from "@/components/home/home-community-preview";
import HomeMobileShowcase from "@/components/home/home-mobile-showcase";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Globe,
  MapPin,
  MessageSquare,
  Star,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site-meta";

export function Landing() {
  const [, navigate] = useLocation();

  return (
    <PublicLayout>
      <CinematicHero showSearch />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
        <section className="md:hidden">
          <HeroStats />
        </section>

        <HomeMapSection places={[]} />
        <HomePlannerSection />
        <HomeCommunityPreview />
        <HomeMobileShowcase />

        <section id="features" className="scroll-offset">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <h2 className="ait-section-title">Единая экосистема путешествий</h2>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ait-purple font-medium">
              {SITE_TAGLINE}
            </p>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              {SITE_DESCRIPTION}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MapPin className="h-5 w-5" />}
              title="Исследуйте"
              description="Интерактивная карта мира, отели, рестораны и активности с живыми маркерами."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Сообщество"
              description="Travel Stories, ленты, блоги и групповые поездки с друзьями."
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5" />}
              title="Планируйте"
              description="AI-оптимизация маршрутов, бюджет и экспорт — как в продукте мечты."
            />
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { title: "Отзывы и рейтинги", icon: <Star className="h-4 w-4" />, text: "Решайте увереннее." },
              { title: "Чаты путешествий", icon: <MessageSquare className="h-4 w-4" />, text: "Telegram + Discord vibe." },
              { title: "Глобальный охват", icon: <Globe className="h-4 w-4" />, text: "120+ стран." },
            ].map((item) => (
              <div key={item.title} className="ait-glass rounded-2xl px-5 py-4 ait-gradient-border">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl ait-nav-active flex items-center justify-center text-ait-orange">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto text-center py-8">
          <h2 className="ait-section-title mb-6">Готовы к следующему приключению?</h2>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="ait-btn-glow rounded-2xl px-10 py-4 text-lg font-semibold text-white inline-flex items-center gap-2"
          >
            Начать бесплатно
            <ArrowRight className="h-5 w-5" />
          </button>
        </section>
      </div>
    </PublicLayout>
  );
}

export default Landing;
