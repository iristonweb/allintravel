import { motion } from "framer-motion";
import { Link } from "wouter";
import { Bed, Car, MapPin, Utensils, Wallet } from "lucide-react";

const categories = [
  { icon: Bed, label: "Отели", color: "from-[#8b5cf6] to-[#a855f7]" },
  { icon: Utensils, label: "Рестораны", color: "from-[#d946ef] to-[#ff7a18]" },
  { icon: Wallet, label: "Travel Wallet", color: "from-[#64748b] to-[#475569]", subtle: true },
  { icon: Car, label: "Транспорт", color: "from-[#22d3ee] to-[#10b981]" },
];

const tripChats = [
  { name: "Исландия 2024", preview: "Маршрут согласован ✓", unread: 2 },
  { name: "Алексей К.", preview: "Отправил геолокацию", unread: 0 },
  { name: "Группа: Бали", preview: "Мария: бронируем виллу?", unread: 5 },
];

export default function HomeMobileShowcase() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className="space-y-10"
    >
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="ait-section-title">
          Мобильный опыт{" "}
          <span className="ait-gradient-text">уровня Airbnb</span>
        </h2>
        <p className="text-muted-foreground mt-3">
          AMOLED-тема, стеклянные карточки и нижняя навигация — как нативное приложение
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        <motion.div
          className="ait-phone-frame w-[280px] p-3 shrink-0"
          whileHover={{ y: -8 }}
        >
          <div className="rounded-[24px] overflow-hidden bg-[#050816] min-h-[520px] flex flex-col">
            <div
              className="h-36 bg-cover bg-center p-4 flex flex-col justify-end"
              style={{
                backgroundImage:
                  "linear-gradient(to top, #050816, transparent 40%), url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80')",
                backgroundSize: "cover",
              }}
            >
              <p className="text-lg font-bold">Привет, Алексей!</p>
              <div className="mt-2 ait-input-glass px-3 py-2 text-xs text-slate-500">
                Куда хотите поехать?
              </div>
            </div>
            <div className="p-4 flex-1 space-y-3">
              <p className="text-xs font-semibold text-ait-purple uppercase tracking-wider">
                Популярные направления
              </p>
              <div className="flex gap-2 overflow-hidden">
                {["Бали", "Исландия"].map((d) => (
                  <div
                    key={d}
                    className="flex-shrink-0 w-24 h-20 rounded-2xl bg-cover bg-center border border-white/10"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1537996195241-795aa0a07e0f?w=200&q=70')`,
                    }}
                  />
                ))}
              </div>
              <div className="ait-glass rounded-2xl p-3">
                <p className="text-sm font-medium">Мои поездки</p>
                <p className="text-xs text-muted-foreground">Исландия · 60%</p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-[60%] ait-gradient-shimmer rounded-full" />
                </div>
              </div>
            </div>
            <div className="p-3 ait-glass-strong rounded-t-[24px] flex justify-around items-center">
              {["🏠", "🗺", "+", "💬", "👤"].map((icon, i) => (
                <span
                  key={icon}
                  className={`text-lg ${i === 2 ? "h-10 w-10 flex items-center justify-center rounded-xl ait-btn-glow text-sm -mt-6" : ""}`}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="ait-phone-frame w-[280px] p-3 shrink-0"
          whileHover={{ y: -8 }}
        >
          <div className="rounded-[24px] overflow-hidden bg-[#050816] min-h-[520px] flex flex-col">
            <div className="p-4 border-b border-white/10">
              <p className="font-bold text-lg">Чаты</p>
              <div className="flex gap-2 mt-3">
                {["Все", "Личные", "Группы"].map((t, i) => (
                  <span
                    key={t}
                    className={`text-xs px-3 py-1 rounded-full ${
                      i === 0 ? "ait-nav-active" : "text-slate-500"
                    }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 p-2 space-y-1">
              {tripChats.map((c) => (
                <Link key={c.name} href="/messages">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ait-purple to-ait-orange shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="h-5 min-w-5 px-1 rounded-full bg-ait-orange text-[10px] font-bold flex items-center justify-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {categories.map(({ icon: Icon, label, color, subtle }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.04, y: -4 }}
            className={`ait-glass rounded-[24px] p-5 text-center ${
              subtle ? "opacity-60" : ""
            }`}
          >
            <div
              className={`mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium">{label}</span>
            {subtle && (
              <p className="text-[10px] text-muted-foreground mt-1">Скоро</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
