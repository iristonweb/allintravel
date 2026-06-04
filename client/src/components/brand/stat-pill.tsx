type StatPillProps = {
  value: string;
  label: string;
};

export default function StatPill({ value, label }: StatPillProps) {
  return (
    <div className="text-center px-4 py-3 rounded-2xl ait-glass border border-white/5">
      <div className="text-2xl md:text-3xl font-bold ait-gradient-text">{value}</div>
      <div className="text-sm text-muted-foreground mt-1 uppercase tracking-wider text-[11px]">
        {label}
      </div>
    </div>
  );
}
