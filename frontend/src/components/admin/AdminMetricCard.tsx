import type { ReactNode } from "react";

interface AdminMetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
}

export default function AdminMetricCard({
  title,
  value,
  icon,
}: AdminMetricCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        p-6
        flex
        items-center
        justify-between
        transition-all
        duration-300
        hover:border-cyan-500/40
        hover:shadow-xl
      "
    >
      <div>
        <p className="text-sm text-slate-400">
          {title}
        </p>

        <h2 className="mt-2 text-3xl font-bold text-white">
          {value}
        </h2>
      </div>

      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-xl
          bg-cyan-500/10
          text-cyan-400
        "
      >
        {icon}
      </div>
    </div>
  );
}