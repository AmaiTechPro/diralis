import type { ReactNode } from "react";
import useCountUp from "../../hooks/useCountUp";
import { motion } from "framer-motion";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export default function KpiCard({
  title,
  value,
  icon,
  color,
  prefix = "",
  suffix = "",
  delay = 0,
}: KpiCardProps) {
    const isNumber = typeof value === "number";

  const animatedValue = isNumber
    ? useCountUp(value as number)
    : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay,
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
      }}
      className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80 p-5 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-500/10"
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>

          <div className="mt-2 text-2xl font-bold text-white">
  {prefix}
  {typeof animatedValue === "number"
 ? animatedValue.toFixed(1)
 : animatedValue}
  {suffix}
</div>
        </div>

        <motion.div
          whileHover={{
            rotate: 8,
            scale: 1.15,
          }}
          transition={{ duration: 0.2 }}
          className={`${color}`}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}

