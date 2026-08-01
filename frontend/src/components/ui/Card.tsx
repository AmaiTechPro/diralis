import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-3xl
        border
        border-slate-800
        bg-slate-900
        p-8
        transition
        duration-300
        hover:-translate-y-2
        hover:border-cyan-500
        hover:shadow-xl
        ${className}
      `}
    >
      {children}
    </div>
  );
}

