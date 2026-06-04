type StatPillProps = {
  value: string;
  label: string;
};

export default function StatPill({ value, label }: StatPillProps) {
  return (
    <div className="text-center px-4">
      <div className="text-2xl md:text-3xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
