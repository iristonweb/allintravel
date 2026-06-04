import { Headphones, Map, Shield, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const features = [
  { icon: Sparkles, label: "Персональные рекомендации", color: "text-ait-purple" },
  { icon: Map, label: "Офлайн-карты", color: "text-ait-cyan" },
  { icon: Headphones, label: "24/7 Support", color: "text-ait-orange" },
  { icon: Shield, label: "Безопасные платежи", color: "text-ait-gold" },
  { icon: Users, label: "Сообщество единомышленников", color: "text-ait-violet" },
];

type FeatureFooterProps = {
  className?: string;
};

export default function FeatureFooter({ className }: FeatureFooterProps) {
  return (
    <section
      className={cn(
        "border-t border-white/10 bg-gradient-to-b from-transparent to-[#050816]/80",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
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
