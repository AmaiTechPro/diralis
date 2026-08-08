import type { ReactNode } from "react";

interface AdminMetricCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
}

export default function AdminMetricCard({
  title,
  value,
  icon,
  description,
}: AdminMetricCardProps) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        p-5
        transition
        hover:border-cyan-500/30
      "
    >
      <div>
        <p className="text-sm text-slate-400">
          {title}
        </p>

        <h2 className="mt-2 text-3xl font-bold text-white">
          {value}
        </h2>

        {description && (
          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div
        className="
          flex
          h-14
          w-14
          shrink-0
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

