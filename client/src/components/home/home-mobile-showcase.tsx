import { motion } from "framer-motion";
import AppDownloadButtons from "@/components/home/app-download-buttons";
import { DEST_BALI_SRC, DEST_ICELAND_SRC, HERO_MAIN_SRC } from "@/lib/marketing-images";
import { useTranslation } from "react-i18next";

export default function HomeMobileShowcase() {
  const { t } = useTranslation();

  return (
    <motion.section
      id="apps"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className="scroll-mt-28"
    >
      <div className="ait-glass rounded-[32px] p-8 md:p-12 ait-gradient-border">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <motion.div
            className="ait-phone-frame w-[260px] sm:w-[280px] p-3 shrink-0"
            whileHover={{ y: -6 }}
          >
            <div className="rounded-[24px] overflow-hidden bg-[#050816] min-h-[480px] flex flex-col">
              <div
                className="h-32 bg-cover bg-center p-4 flex flex-col justify-end"
                style={{
                  backgroundImage: `linear-gradient(to top, #050816, transparent 50%), url('${HERO_MAIN_SRC}')`,
                  backgroundSize: "cover",
                }}
              >
                <p className="text-base font-bold">All In Travel</p>
                <p className="text-xs text-slate-400 mt-1">{t("home.mobileShowcase.tagline")}</p>
              </div>
              <div className="p-4 flex-1 space-y-3">
                <div className="ait-input-glass px-3 py-2.5 text-xs text-slate-500">
                  {t("home.mobileShowcase.searchPlaceholder")}
                </div>
                <div className="flex gap-2">
                  {[DEST_BALI_SRC, DEST_ICELAND_SRC].map((src) => (
                    <div
                      key={src}
                      className="flex-1 h-16 rounded-xl bg-cover bg-center border border-white/10"
                      style={{ backgroundImage: `url('${src}')` }}
                    />
                  ))}
                </div>
                <div className="ait-glass rounded-2xl p-3">
                  <p className="text-sm font-medium">{t("home.mobileShowcase.routeThisWeek")}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div className="h-full w-[65%] ait-gradient-shimmer rounded-full" />
                  </div>
                </div>
              </div>
              <div className="p-3 ait-glass-strong rounded-t-[24px] flex justify-around text-lg">
                {["🏠", "🗺", "💬", "👤"].map((icon) => (
                  <span key={icon}>{icon}</span>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="flex-1 text-center lg:text-left max-w-lg">
            <h2 className="ait-section-title">
              {t("home.mobileShowcase.title")}{" "}
              <span className="ait-gradient-text">{t("home.mobileShowcase.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {t("home.mobileShowcase.description")}
            </p>
            <div className="mt-8 flex justify-center lg:justify-start">
              <AppDownloadButtons />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
