import {
  FileSpreadsheet,
  Eye,
  Trash2,
  BarChart3,
} from "lucide-react";

import type { Dataset } from "../../types/dataset";

interface Props {
  dataset: Dataset;
  onDelete: (id: string) => void;
  onPreview: (id: string) => void;
  onAnalyze: (id: string) => void;
}

export default function DatasetCard({
  dataset,
  onDelete,
  onPreview,
  onAnalyze,
}: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-500">

      <div className="flex items-center gap-4">

        <div className="rounded-xl bg-cyan-500/20 p-3">
          <FileSpreadsheet
            className="text-cyan-400"
            size={28}
          />
        </div>

        <div>
          <h3 className="font-semibold">
            {dataset.originalName}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {(dataset.size / 1024 / 1024).toFixed(2)} MB
            {" • "}
            {new Date(
              dataset.uploadedAt
            ).toLocaleDateString()}
          </p>
        </div>

      </div>

      <div className="flex gap-2">

        <button
          onClick={() =>
            onPreview(dataset.id)
          }
          className="rounded-lg p-2 transition hover:bg-slate-800"
          title="Preview"
        >
          <Eye size={18} />
        </button>

        <button
          onClick={() =>
            onAnalyze(dataset.id)
          }
          className="rounded-lg p-2 text-cyan-400 transition hover:bg-cyan-500/10"
          title="Analyze"
        >
          <BarChart3 size={18} />
        </button>

        <button
          onClick={() =>
            onDelete(dataset.id)
          }
          className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>

      </div>

    </div>
  );
}

