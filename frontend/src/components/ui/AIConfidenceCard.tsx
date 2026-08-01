import Card from "./Card";


interface Props {
  confidence: number;
}

export default function AIConfidenceCard({
  confidence,
}: Props) {
  return (
    <Card>

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-400">
            AI Confidence Score
          </p>

          <h2 className="mt-2 text-5xl font-bold text-emerald-400">
            {confidence}%
          </h2>

        </div>

        <div className="text-6xl">
          🎯
        </div>

      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000"
          style={{
            width: `${confidence}%`,
          }}
        />

      </div>

    </Card>
  );
}

