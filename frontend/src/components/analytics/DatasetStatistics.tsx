import { motion } from "framer-motion";

interface Props {
  rows: number;
  columns: number;
  numericColumns: number;
  categoricalColumns: number;
  dateColumns: number;
  duplicateRows: number;
}

export default function DatasetStatistics({
  rows,
  columns,
  numericColumns,
  categoricalColumns,
  dateColumns,
  duplicateRows,
}: Props) {
  const stats = [
    {
      label: "Rows",
      value: rows,
    },
    {
      label: "Columns",
      value: columns,
    },
    {
      label: "Numeric",
      value: numericColumns,
    },
    {
      label: "Categorical",
      value: categoricalColumns,
    },
    {
      label: "Date",
      value: dateColumns,
    },
    {
      label: "Duplicates",
      value: duplicateRows,
    },
  ];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        delay: 0.1,
      }}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
    >
      <h2 className="text-lg font-semibold text-slate-300">
        Dataset Statistics
      </h2>

      <div className="mt-6 space-y-4">

        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-lg bg-slate-800/60 px-4 py-3"
          >
            <span className="text-slate-400">
              {stat.label}
            </span>

            <span className="font-bold text-cyan-400">
              {stat.value.toLocaleString()}
            </span>
          </div>
        ))}

      </div>
    </motion.div>
  );
}


