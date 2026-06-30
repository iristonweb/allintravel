import { Headphones, Map, Shield, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GuestAnchorLink } from "@/components/nav/guest-anchor-link";
import { useNavLabels } from "@/hooks/useNavLabels";

type FeatureFooterProps = {
  className?: string;
  showAnchors?: boolean;
};

export default function FeatureFooter({ className, showAnchors = false }: FeatureFooterProps) {
  const { t } = useTranslation();
  const { footerAnchors } = useNavLabels();

  const features = useMemo(
    () => [
      { icon: Sparkles, label: t("marketing.footer.personalRecs"), color: "text-ait-purple" },
      { icon: Map, label: t("marketing.footer.offlineMaps"), color: "text-ait-cyan" },
      { icon: Headphones, label: t("marketing.footer.support"), color: "text-ait-orange" },
      { icon: Shield, label: t("marketing.footer.securePayments"), color: "text-ait-gold" },
      { icon: Users, label: t("marketing.footer.community"), color: "text-ait-violet" },
    ],
    [t],
  );

  return (
    <section
      className={cn(
        "border-t border-white/10 bg-gradient-to-b from-transparent to-[#050816]/80",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
        {showAnchors && (
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {footerAnchors.map((link) => (
              <GuestAnchorLink
                key={link.href}
                href={link.href}
                className="text-slate-400 hover:text-ait-purple transition-colors"
              >
                {link.label}
              </GuestAnchorLink>
            ))}
            <Link href="/login" className="text-ait-orange hover:underline font-medium">
              {t("nav.login")}
            </Link>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {features.map(({ icon: Icon, label, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl ait-glass-strong ait-neon-purple">
                <Icon className={cn("h-5 w-5", color)} />
              </div>
              <span className="text-xs sm:text-sm text-slate-400 leading-snug">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
