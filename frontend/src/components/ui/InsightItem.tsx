interface Props {
  text: string;
}

export default function InsightItem({
  text,
}: Props) {
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-800 p-4 transition-all duration-300 hover:border-cyan-500 hover:bg-slate-700">

      <div className="mt-1 text-cyan-400">
        💡
      </div>

      <p className="leading-7 text-slate-200">
        {text}
      </p>

    </div>
  );
}

