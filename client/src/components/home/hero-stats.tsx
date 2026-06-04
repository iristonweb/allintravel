import StatPill from "@/components/brand/stat-pill";

const stats = [
  { value: "120+", label: "стран" },
  { value: "25K+", label: "мест" },
  { value: "1.2M+", label: "путешественников" },
  { value: "4.9", label: "рейтинг" },
];

export default function HeroStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s) => (
        <StatPill key={s.label} value={s.value} label={s.label} />
      ))}
    </div>
  );
}
