import type { ReactNode } from "react";

interface SectionTitleProps {
  badge: string;
  title: ReactNode;
  description: string;
}

export default function SectionTitle({
  badge,
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">

      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
        {badge}
      </span>

      <h2 className="mt-8 text-4xl font-bold md:text-5xl">
        {title}
      </h2>

      <p className="mt-8 text-lg leading-8 text-slate-400">
        {description}
      </p>

    </div>
  );
}


