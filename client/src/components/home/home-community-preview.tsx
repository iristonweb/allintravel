import { motion } from "framer-motion";
import { Link } from "wouter";
import GlassCard from "@/components/brand/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bookmark, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import HomeSectionHeader from "@/components/home/home-section-header";

export default function HomeCommunityPreview() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className="space-y-6"
    >
      <HomeSectionHeader
        title="Сообщество путешественников"
        description="Travel Stories, Reels и Journals — вдохновение как в Instagram"
        rightSlot={
          <div className="hidden sm:flex gap-2 ait-nav-pill rounded-full p-1">
            {["Лента", "Подписки", "Популярное"].map((tab, i) => (
              <span
                key={tab}
                className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                  i === 0 ? "ait-nav-active text-white" : "text-slate-400"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        }
      />

      <Link href="/social-feed">
        <GlassCard strong hover className="overflow-hidden max-w-2xl mx-auto cursor-pointer">
          <div className="p-5 flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-ait-purple/40">
              <AvatarImage src="https://i.pravatar.cc/120?img=5" />
              <AvatarFallback>М</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-lg">Мария Петрова</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-ait-orange" />
                Бали, Индонезия
              </div>
            </div>
          </div>

          <div
            className="h-72 md:h-96 bg-cover bg-center relative"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/90 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-5 right-5 text-slate-200 text-sm md:text-base leading-relaxed">
              Рассвет у вулкана Батур — одно из самых сильных впечатлений в жизни. Кто был на
              Бали — поймёт 🌋
            </p>
          </div>

          <div className="p-5 flex items-center justify-between border-t border-white/8">
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                <Heart className="h-4 w-4 mr-1 fill-current" />
                2.4K
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400">
                <MessageCircle className="h-4 w-4 mr-1" />
                186
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="text-ait-purple">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </GlassCard>
      </Link>
    </motion.section>
  );
}
