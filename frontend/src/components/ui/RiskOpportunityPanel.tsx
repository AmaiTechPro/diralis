import Card from "./Card";

interface Props {
  title: string;
  items: string[];
  icon: string;
}

export default function RiskOpportunityPanel({
  title,
  items,
  icon,
}: Props) {
  return (
    <Card>

      <div className="mb-5 flex items-center gap-3">

        <span className="text-3xl">
          {icon}
        </span>

        <h2 className="text-2xl font-bold text-white">
          {title}
        </h2>

      </div>

      <div className="space-y-3">

        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-800 bg-slate-800 p-4 text-slate-200"
          >
            {item}
          </div>
        ))}

      </div>

    </Card>
  );
}

