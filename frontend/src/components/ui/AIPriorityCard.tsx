interface Props {
  title: string;
  description: string;
  level: "High" | "Medium" | "Low";
}

export default function AIPriorityCard({
  title,
  description,
  level,
}: Props) {

  const color =
    level === "High"
      ? "text-red-400 border-red-500/40"
      : level === "Medium"
      ? "text-yellow-400 border-yellow-500/40"
      : "text-emerald-400 border-emerald-500/40";

  return (
    <div
      className={`rounded-2xl border bg-slate-800 p-5 transition hover:scale-[1.02] ${color}`}
    >
      <div className="mb-3 flex items-center justify-between">

        <h3 className="text-lg font-semibold text-white">
          {title}
        </h3>

        <span className={`text-sm font-bold ${color}`}>
          {level}
        </span>

      </div>

      <p className="text-slate-300">
        {description}
      </p>

    </div>
  );
}

