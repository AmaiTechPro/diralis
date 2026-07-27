interface StatCardProps {
  label: string;
  value: string;
  color?: string;
}

export default function StatCard({
  label,
  value,
  color = "text-cyan-400",
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-slate-800 p-6">

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <h3 className={`mt-3 text-3xl font-bold ${color}`}>
        {value}
      </h3>

    </div>
  );
}


