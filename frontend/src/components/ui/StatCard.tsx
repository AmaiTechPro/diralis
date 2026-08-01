import type { ReactNode } from "react";



import Card from "./Card";

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  color?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  suffix = "",
  color = "text-cyan-400",
}: StatCardProps) {
  return (
    <Card>

      {icon && (
        <div className={color}>
          {icon}
        </div>
      )}

      <p className="mt-4 text-sm text-slate-400">
        {label}
      </p>

      <h2 className={`mt-2 text-4xl font-bold ${color}`}>

        {value}
        {suffix}

      </h2>

    </Card>
  );
}

