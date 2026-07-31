interface Props {
  title: string;
  value: string | number;
  color: string;
}

export default function KpiCard({
  title,
  value,
  color,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <h2
        className={`mt-2 text-3xl font-bold ${color}`}
      >
        {value}
      </h2>
    </div>
  );
}

